"""
Scraper for Maryland land records via MDLandRec (https://mdlandrec.net/).

MDLandRec requires an account login (email + password). First login from a
new device triggers an email verification code step.  Subsequent logins reuse
a session cookie stored at ~/.md-research/session-cookies.json.

Search flow (post-login):
  1. Select county
  2. Choose search type: Grantor Index
  3. Enter last name / first name / date range
  4. Results table → click instrument link → detail page
  5. Download PDF link on detail page

Live network testing is blocked in the sandbox environment.  Set
LAND_RECORDS_DEBUG_SCREENSHOTS=1 to save page screenshots at each step
when running in a real environment.
"""

import asyncio
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PlaywrightTimeoutError,
)

logger = logging.getLogger(__name__)

MDLANDREC_URL = "https://mdlandrec.net"
LOGIN_URL = "https://mdlandrec.net/main/dsp_login.cfm"
SEARCH_URL = "https://mdlandrec.net/main/dsp_search.cfm"

_COOKIE_PATH = Path.home() / ".md-research" / "session-cookies.json"

_CHROME_PATHS = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
]

_DEBUG_SCREENSHOTS = os.getenv("LAND_RECORDS_DEBUG_SCREENSHOTS", "") == "1"

# Instrument types that matter for surplus / lien analysis
_RELEVANT_TYPES = re.compile(
    r"deed\s*of\s*trust|mortgage|substitut|trustee'?s?\s*deed|"
    r"assignment|release|lien|judgment|lis\s*pendens",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Browser session helpers
# ---------------------------------------------------------------------------

class _browser_session:
    """Async context manager yielding (browser, page) with shared config."""

    async def __aenter__(self) -> tuple[Browser, Page]:
        self._pw = await async_playwright().start()
        exec_ = next((p for p in _CHROME_PATHS if os.path.isfile(p)), None)
        self._browser = await self._pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
            **({"executable_path": exec_} if exec_ else {}),
        )
        ctx: BrowserContext = await self._browser.new_context(
            ignore_https_errors=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        # Restore saved cookies if available
        cookies = _load_cookies()
        if cookies:
            await ctx.add_cookies(cookies)
            logger.debug("Restored %d saved session cookies", len(cookies))
        self._ctx = ctx
        self._page = await ctx.new_page()
        return self._browser, self._page

    async def __aexit__(self, *_) -> None:
        await self._browser.close()
        await self._pw.stop()


def _load_cookies() -> list[dict]:
    try:
        if _COOKIE_PATH.exists():
            return json.loads(_COOKIE_PATH.read_text())
    except Exception as exc:
        logger.debug("Could not load cookies: %s", exc)
    return []


def _save_cookies(cookies: list[dict]) -> None:
    try:
        _COOKIE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _COOKIE_PATH.write_text(json.dumps(cookies, indent=2))
        logger.debug("Saved %d session cookies to %s", len(cookies), _COOKIE_PATH)
    except Exception as exc:
        logger.warning("Could not save cookies: %s", exc)


async def _screenshot(page: Page, label: str) -> None:
    if not _DEBUG_SCREENSHOTS:
        return
    path = f"/tmp/land_records_{label}.png"
    try:
        await page.screenshot(path=path, full_page=True)
        logger.debug("Screenshot: %s", path)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def login(email: str, password: str) -> list[dict]:
    """
    Authenticate with MDLandRec.

    Handles the optional email verification code prompt that appears on first
    login from a new device.  Returns the session cookies so callers can
    persist them.

    If the verification code prompt appears, this function will block waiting
    for the code to be entered via stdin (intended for initial one-time setup).

    Args:
        email:    MDLandRec account email.
        password: MDLandRec account password.

    Returns:
        List of cookie dicts (Playwright format) saved to ~/.md-research/session-cookies.json.
    """
    async with _browser_session() as (browser, page):
        try:
            await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=30_000)
            await _screenshot(page, "login_page")

            # Fill credentials
            await _fill(page, email, [
                "input[name='emailAddress']", "input[name='email']",
                "input[type='email']", "input[id*='email']", "input[id*='Email']",
            ])
            await _fill(page, password, [
                "input[name='password']", "input[type='password']",
                "input[id*='password']", "input[id*='Password']",
            ])

            # Submit
            await _click_submit(page, ["input[type='submit']", "button[type='submit']",
                                       "button:has-text('Login')", "input[value='Login']"])
            await page.wait_for_load_state("domcontentloaded", timeout=20_000)
            await _screenshot(page, "after_login")

            content = await page.content()

            # Verification code prompt
            if "verification" in content.lower() or "verify" in content.lower():
                logger.info("Email verification code required — check your inbox")
                code = input("Enter verification code from email: ").strip()
                await _fill(page, code, [
                    "input[name='verificationCode']", "input[name='code']",
                    "input[id*='code']", "input[id*='Code']", "input[type='text']",
                ])
                await _click_submit(page, ["input[type='submit']", "button[type='submit']",
                                           "button:has-text('Verify')", "input[value='Verify']"])
                await page.wait_for_load_state("domcontentloaded", timeout=20_000)

            cookies = await page.context.cookies()
            _save_cookies(cookies)
            logger.info("Login successful; %d cookies saved", len(cookies))
            return cookies

        except PlaywrightTimeoutError as exc:
            logger.error("Login timeout: %s", exc)
            return []
        except Exception as exc:
            logger.exception("Login error")
            return []


async def search_grantor_index(
    grantor_last: str,
    grantor_first: str,
    county: str,
    date_range_start: Optional[str] = None,
    date_range_end: Optional[str] = None,
) -> list[dict]:
    """
    Search the MDLandRec grantor index for a named party.

    Args:
        grantor_last:       Last name of grantor (borrower / seller).
        grantor_first:      First name of grantor.
        county:             Maryland county name, e.g. ``"Prince George's"``.
        date_range_start:   Optional ISO date string ``"YYYY-MM-DD"`` for start filter.
        date_range_end:     Optional ISO date string ``"YYYY-MM-DD"`` for end filter.

    Returns:
        List of instrument dicts with keys:
          ``date_recorded``, ``grantor``, ``grantee``, ``instrument_type``,
          ``book``, ``page``, ``remarks``.
        On error: single-item list with ``{"error": ..., "message": ...}``.

    Note:
        Requires valid session cookies (call :func:`login` first).
        Sandbox environment blocks outbound connections — live testing must be
        done from an unrestricted network.
    """
    logger.info(
        "LandRecords grantor search | %s, %s | county=%r | %s–%s",
        grantor_last, grantor_first, county, date_range_start, date_range_end,
    )
    async with _browser_session() as (_, page):
        try:
            return await _run_grantor_search(
                page, grantor_last, grantor_first, county,
                date_range_start, date_range_end,
            )
        except PlaywrightTimeoutError as exc:
            logger.error("LandRecords timeout: %s", exc)
            return [{"error": "timeout", "message": str(exc)}]
        except Exception as exc:
            logger.exception("LandRecords unexpected error")
            return [{"error": "unexpected", "message": str(exc)}]


async def get_instrument_details(book: str, page_num: str, county: str) -> dict:
    """
    Fetch full metadata for a specific instrument by book/page reference.

    Args:
        book:     Liber (book) number.
        page_num: Folio (page) number.
        county:   Maryland county name.

    Returns:
        Dict with instrument metadata or ``{"error": ..., "message": ...}``.
    """
    logger.info("LandRecords instrument detail | book=%s page=%s county=%r", book, page_num, county)
    async with _browser_session() as (_, page):
        try:
            return await _fetch_instrument_detail(page, book, page_num, county)
        except PlaywrightTimeoutError as exc:
            return {"error": "timeout", "message": str(exc)}
        except Exception as exc:
            logger.exception("LandRecords instrument detail error")
            return {"error": "unexpected", "message": str(exc)}


async def download_instrument_pdf(
    book: str,
    page_num: str,
    county: str,
    output_path: str,
) -> str:
    """
    Download the PDF for a specific instrument.

    Args:
        book:        Liber number.
        page_num:    Folio number.
        county:      Maryland county name.
        output_path: Local filesystem path to write the PDF.

    Returns:
        Absolute path of the downloaded PDF, or empty string on failure.
    """
    logger.info(
        "LandRecords PDF download | book=%s page=%s county=%r -> %s",
        book, page_num, county, output_path,
    )
    async with _browser_session() as (browser, page):
        try:
            detail = await _fetch_instrument_detail(page, book, page_num, county)
            pdf_url = detail.get("pdf_url", "")
            if not pdf_url:
                logger.warning("No PDF URL found for book=%s page=%s", book, page_num)
                return ""

            # Download via Playwright download event
            async with page.expect_download() as dl_info:
                await page.goto(pdf_url, wait_until="domcontentloaded", timeout=30_000)
            download = await dl_info.value
            await download.save_as(output_path)
            logger.info("PDF saved to %s", output_path)
            return os.path.abspath(output_path)

        except Exception as exc:
            logger.exception("PDF download error")
            return ""


# ---------------------------------------------------------------------------
# Internal navigation helpers
# ---------------------------------------------------------------------------

async def _run_grantor_search(
    page: Page,
    grantor_last: str,
    grantor_first: str,
    county: str,
    date_start: Optional[str],
    date_end: Optional[str],
) -> list[dict]:
    await page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=30_000)
    await _screenshot(page, "search_landing")

    content = await page.content()
    # Redirect to login if session expired
    if "login" in content.lower() and "password" in content.lower():
        return [{"error": "not_authenticated",
                 "message": "Session expired. Call login() to refresh credentials."}]

    # County selection
    await _select_option(page, county, [
        "select[name='county']", "select[id='county']",
        "select[name*='County']", "select[id*='County']",
    ])

    # Search type: Grantor Index
    await _select_option(page, "Grantor", [
        "select[name='searchType']", "select[name='type']",
        "select[id*='search']", "select[id*='type']",
    ], fallback_label="Grantor Index")

    # Name fields
    await _fill(page, grantor_last, [
        "input[name='lastName']", "input[name='grantor_last']",
        "input[id*='lastName']", "input[id*='LastName']",
        "input[name*='last']",
    ])
    await _fill(page, grantor_first, [
        "input[name='firstName']", "input[name='grantor_first']",
        "input[id*='firstName']", "input[id*='FirstName']",
        "input[name*='first']",
    ])

    # Optional date range (MM/DD/YYYY format expected by MDLandRec)
    if date_start:
        start_fmt = _reformat_date(date_start)
        await _fill(page, start_fmt, [
            "input[name='startDate']", "input[name='dateFrom']",
            "input[id*='startDate']", "input[id*='Start']",
        ])
    if date_end:
        end_fmt = _reformat_date(date_end)
        await _fill(page, end_fmt, [
            "input[name='endDate']", "input[name='dateTo']",
            "input[id*='endDate']", "input[id*='End']",
        ])

    await _screenshot(page, "before_search")
    await _click_submit(page, [
        "input[type='submit']", "input[value='Search']",
        "button[type='submit']", "button:has-text('Search')",
    ])
    await page.wait_for_load_state("domcontentloaded", timeout=20_000)
    await _screenshot(page, "search_results")

    return await _parse_results_table(page)


async def _fetch_instrument_detail(page: Page, book: str, page_num: str, county: str) -> dict:
    """Navigate to instrument detail by book/page lookup."""
    await page.goto(SEARCH_URL, wait_until="domcontentloaded", timeout=30_000)

    content = await page.content()
    if "login" in content.lower() and "password" in content.lower():
        return {"error": "not_authenticated",
                "message": "Session expired. Call login() to refresh credentials."}

    # Some MDLandRec implementations allow direct book/page search
    await _select_option(page, county, ["select[name='county']", "select[id*='County']"])
    await _select_option(page, "Book/Page", [
        "select[name='searchType']", "select[id*='type']",
    ], fallback_label="Liber/Folio")

    await _fill(page, book, [
        "input[name='book']", "input[name='liber']",
        "input[id*='book']", "input[id*='Book']",
    ])
    await _fill(page, page_num, [
        "input[name='page']", "input[name='folio']",
        "input[id*='page']", "input[id*='Page']",
    ])

    await _click_submit(page, ["input[type='submit']", "button:has-text('Search')"])
    await page.wait_for_load_state("domcontentloaded", timeout=20_000)

    rows = await _parse_results_table(page)
    if not rows or "error" in rows[0]:
        return rows[0] if rows else {"error": "not_found", "message": "Instrument not found"}

    # If on results list, click into the first match
    detail_links = page.locator("table a[href*='instrument'], table a[href*='detail']")
    if await detail_links.count() > 0:
        await detail_links.first.click()
        await page.wait_for_load_state("domcontentloaded", timeout=15_000)

    return await _extract_detail_page(page, book, page_num)


async def _extract_detail_page(page: Page, book: str, page_num: str) -> dict:
    """Extract metadata from an instrument detail page."""
    result: dict = {
        "book": book,
        "page": page_num,
        "date_recorded": "",
        "instrument_type": "",
        "grantor": "",
        "grantee": "",
        "remarks": "",
        "pdf_url": "",
        "source_url": page.url,
    }

    # Label/value table rows
    rows = page.locator("table tr")
    count = await rows.count()
    for i in range(count):
        cells = rows.nth(i).locator("td")
        if await cells.count() < 2:
            continue
        label = _ws(await cells.nth(0).inner_text()).upper()
        value = _ws(await cells.nth(1).inner_text())
        if not label or not value:
            continue

        if re.search(r"DATE\s*RECORDED|RECORDED\s*DATE|RECORD.*DATE", label):
            result["date_recorded"] = value
        elif re.search(r"INSTRUMENT\s*TYPE|DOCUMENT\s*TYPE|TYPE", label):
            result["instrument_type"] = value
        elif re.search(r"\bGRANTOR\b", label):
            result["grantor"] = value
        elif re.search(r"\bGRANTEE\b", label):
            result["grantee"] = value
        elif re.search(r"REMARK|DESCRIP|CONSIDER|PROPERTY", label):
            result["remarks"] = value

    # PDF download link
    pdf_link = page.locator("a[href*='.pdf'], a:has-text('PDF'), a:has-text('Download')")
    if await pdf_link.count() > 0:
        href = await pdf_link.first.get_attribute("href") or ""
        if href and not href.startswith("http"):
            href = MDLANDREC_URL + "/" + href.lstrip("/")
        result["pdf_url"] = href

    return result


async def _parse_results_table(page: Page) -> list[dict]:
    """Parse the grantor-index results table into a list of instrument dicts."""
    content = await page.content()
    no_results_phrases = ["no records", "no results", "0 records", "not found"]
    if any(p in content.lower() for p in no_results_phrases):
        return [{"error": "not_found", "message": "No instruments found"}]

    results: list[dict] = []
    rows = page.locator("table tr")
    count = await rows.count()

    # Detect column layout from header row
    col_map: dict[str, int] = {}
    for i in range(min(count, 5)):
        cells = rows.nth(i).locator("th, td")
        n = await cells.count()
        if n < 3:
            continue
        headers = [_ws(await cells.nth(j).inner_text()).lower() for j in range(n)]
        if any("grantor" in h or "instrument" in h or "book" in h for h in headers):
            for j, h in enumerate(headers):
                if "date" in h and "record" in h:
                    col_map["date_recorded"] = j
                elif "grantor" in h:
                    col_map["grantor"] = j
                elif "grantee" in h:
                    col_map["grantee"] = j
                elif "type" in h or "instrument" in h:
                    col_map["instrument_type"] = j
                elif "book" in h or "liber" in h:
                    col_map["book"] = j
                elif "page" in h or "folio" in h:
                    col_map["page"] = j
                elif "remark" in h or "descrip" in h:
                    col_map["remarks"] = j
            break

    if not col_map:
        col_map = {
            "date_recorded": 0,
            "grantor": 1,
            "grantee": 2,
            "instrument_type": 3,
            "book": 4,
            "page": 5,
            "remarks": 6,
        }

    for i in range(count):
        cells = rows.nth(i).locator("td")
        n = await cells.count()
        if n < 3:
            continue

        async def _cell(key: str) -> str:
            idx = col_map.get(key, -1)
            if 0 <= idx < n:
                try:
                    return _ws(await cells.nth(idx).inner_text())
                except Exception:
                    return ""
            return ""

        instrument_type = await _cell("instrument_type")
        if not instrument_type:
            continue

        results.append({
            "date_recorded": await _cell("date_recorded"),
            "grantor": await _cell("grantor"),
            "grantee": await _cell("grantee"),
            "instrument_type": instrument_type,
            "book": await _cell("book"),
            "page": await _cell("page"),
            "remarks": await _cell("remarks"),
        })

    return results if results else [{"error": "not_found", "message": "No instruments parsed from table"}]


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

async def _fill(page: Page, value: str, selectors: list[str]) -> None:
    for sel in selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.fill(value)
                return
        except Exception:
            continue
    logger.warning("Could not fill %r — no selector matched", value)


async def _select_option(
    page: Page,
    value: str,
    selectors: list[str],
    fallback_label: Optional[str] = None,
) -> None:
    for sel in selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                el = loc.first
                candidates = [value, value.upper(), value.title()]
                if fallback_label:
                    candidates.append(fallback_label)
                for c in candidates:
                    try:
                        await el.select_option(label=c)
                        return
                    except Exception:
                        try:
                            await el.select_option(value=c)
                            return
                        except Exception:
                            continue
        except Exception:
            continue


async def _click_submit(page: Page, selectors: list[str]) -> None:
    for sel in selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.click()
                return
        except Exception:
            continue
    raise RuntimeError("No submit button found")


def _ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _reformat_date(iso_date: str) -> str:
    """Convert YYYY-MM-DD to MM/DD/YYYY for MDLandRec date fields."""
    try:
        parts = iso_date.strip().split("-")
        if len(parts) == 3:
            return f"{parts[1]}/{parts[2]}/{parts[0]}"
    except Exception:
        pass
    return iso_date
