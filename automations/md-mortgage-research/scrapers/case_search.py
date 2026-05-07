"""
Scraper for the Maryland Judiciary Case Search portal
(https://casesearch.courts.state.md.us/casesearch/).

Navigation flow:
  1. Landing page  → click "I Agree" disclaimer
  2. Search form   → fill name/county/court fields → Submit
  3. Results table → filter for foreclosure cases in the right county
  4. Case detail   → extract docket entries

Three public coroutines:
  search_by_owner   – find foreclosure cases where the homeowner is the defendant
  search_by_trustee – find foreclosure cases where a named trustee is the plaintiff
  get_case_docket   – return full docket entries for a known case number

Note: Selectors are written against the Maryland JIS/ECRIS form structure.
      If the site has been migrated to a new UI, run with DEBUG logging and
      set SDAT_DEBUG_SCREENSHOTS=1 to capture pages for inspection.
"""

import asyncio
import logging
import os
import re
from datetime import datetime
from typing import Optional

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PlaywrightTimeoutError,
)

logger = logging.getLogger(__name__)

CASE_SEARCH_URL = "https://casesearch.courts.state.md.us/casesearch/"

# Try direct-form URL first; some deployments skip the disclaimer if session
# already has the cookie set or if navigating directly.
INQUIRY_SEARCH_URL = "https://casesearch.courts.state.md.us/casesearch/inquirySearch.jis"

_CHROME_PATHS = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
]

# Captures debug screenshots when set to "1" (useful during deployment testing)
_DEBUG_SCREENSHOTS = os.getenv("CASE_SEARCH_DEBUG_SCREENSHOTS", "") == "1"

# Patterns that identify a foreclosure / mortgage case type
_FORECLOSURE_RE = re.compile(
    r"foreclos|mortgage|foreclsr|mortg\b",
    re.IGNORECASE,
)

# Maryland county name variants → two-letter MDEC/JIS county code
_COUNTY_CODES: dict[str, str] = {
    "allegany": "AL",
    "anne arundel": "AA",
    "baltimore city": "BA",
    "baltimore county": "BC",
    "calvert": "CA",
    "caroline": "CR",
    "carroll": "CB",
    "cecil": "CC",
    "charles": "CH",
    "dorchester": "DO",
    "frederick": "FR",
    "garrett": "GA",
    "harford": "HA",
    "howard": "HO",
    "kent": "KE",
    "montgomery": "MO",
    "prince george's": "PG",
    "prince georges": "PG",
    "queen anne's": "QA",
    "queen annes": "QA",
    "st. mary's": "SM",
    "st marys": "SM",
    "saint mary's": "SM",
    "somerset": "SO",
    "talbot": "TA",
    "washington": "WA",
    "wicomico": "WI",
    "worcester": "WO",
}

# Maximum results before we refuse and ask for more specificity
_TOO_MANY = 50


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def search_by_owner(
    owner_first_name: str,
    owner_last_name: str,
    county: str,
    owner_middle_initial: str = "",
    sale_date_estimate: Optional[str] = None,
) -> list[dict]:
    """
    Search Maryland Judiciary Case Search for foreclosure cases where
    *owner_last_name* / *owner_first_name* is the defendant (homeowner).

    Args:
        owner_first_name:     Defendant's first name.
        owner_last_name:      Defendant's last name.
        county:               Maryland county name, e.g. ``"Prince George's"``.
        owner_middle_initial: Optional single letter.
        sale_date_estimate:   ISO date string for logging / future filtering.

    Returns:
        List of case dicts with keys ``case_number``, ``case_title``,
        ``filing_date``, ``case_status``, ``court``.
        On error, a single-item list with ``{"error": ..., "message": ...}``.
    """
    logger.info(
        "CaseSearch owner | %s, %s %s | county=%r",
        owner_last_name, owner_first_name, owner_middle_initial, county,
    )
    async with _browser_session() as (_, page):
        try:
            return await _name_search(
                page,
                last_name=owner_last_name,
                first_name=owner_first_name,
                middle_initial=owner_middle_initial,
                county=county,
                role_filter="defendant",
            )
        except PlaywrightTimeoutError as exc:
            logger.error("CaseSearch owner timeout: %s", exc)
            return [{"error": "timeout", "message": str(exc)}]
        except Exception as exc:
            logger.exception("CaseSearch owner unexpected error")
            return [{"error": "unexpected", "message": str(exc)}]


async def search_by_trustee(
    trustee_first: str,
    trustee_last: str,
    county: str,
) -> list[dict]:
    """
    Search for foreclosure cases where a named substitute trustee or lender
    appears as the plaintiff.

    Args:
        trustee_first: Plaintiff first name (or first token of entity name).
        trustee_last:  Plaintiff last name (or primary token of entity name).
        county:        Maryland county name, e.g. ``"Prince George's"``.

    Returns:
        List of case dicts (same schema as :func:`search_by_owner`).
    """
    logger.info(
        "CaseSearch trustee | %s, %s | county=%r", trustee_last, trustee_first, county,
    )
    async with _browser_session() as (_, page):
        try:
            return await _name_search(
                page,
                last_name=trustee_last,
                first_name=trustee_first,
                middle_initial="",
                county=county,
                role_filter="plaintiff",
            )
        except PlaywrightTimeoutError as exc:
            logger.error("CaseSearch trustee timeout: %s", exc)
            return [{"error": "timeout", "message": str(exc)}]
        except Exception as exc:
            logger.exception("CaseSearch trustee unexpected error")
            return [{"error": "unexpected", "message": str(exc)}]


async def get_case_docket(case_number: str, county: str) -> dict:
    """
    Retrieve the full docket for a known case number from Maryland Judiciary
    Case Search.

    Args:
        case_number: MDEC case number, e.g. ``"C-16-CV-24-005892"``.
        county:      Maryland county name (used for logging/fallback).

    Returns:
        Dictionary with ``case_number``, ``case_title``, ``filing_date``,
        ``case_status``, ``court``, ``parties`` (list), ``docket_entries``
        (list), and ``source_url``.
        On error: ``{"error": "<code>", "message": "<detail>"}``.
    """
    logger.info("CaseSearch docket | case=%r county=%r", case_number, county)
    async with _browser_session() as (_, page):
        try:
            return await _case_number_search(page, case_number)
        except PlaywrightTimeoutError as exc:
            logger.error("CaseSearch docket timeout: %s", exc)
            return {"error": "timeout", "message": str(exc)}
        except Exception as exc:
            logger.exception("CaseSearch docket unexpected error")
            return {"error": "unexpected", "message": str(exc)}


# ---------------------------------------------------------------------------
# Browser session context manager
# ---------------------------------------------------------------------------

class _browser_session:
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
        self._page = await ctx.new_page()
        return self._browser, self._page

    async def __aexit__(self, *_) -> None:
        await self._browser.close()
        await self._pw.stop()


# ---------------------------------------------------------------------------
# Disclaimer acceptance
# ---------------------------------------------------------------------------

async def _accept_disclaimer(page: Page) -> None:
    """
    Click the "I Agree" button on the Case Search landing page.

    The Maryland Judiciary Case Search landing page POSTs to inquirySearch.jis
    with the disclaimer acknowledgement.  The standard button selector is
    ``input[name='disclaimer'][value='I Agree']``.
    """
    candidates = [
        # Most likely — standard JIS/ECRIS form
        "input[name='disclaimer'][value='I Agree']",
        "input[name='disclaimer']",
        # General fallbacks
        "input[value='I Agree']",
        "input[value='I Accept']",
        "input[value='Accept']",
        "input[type='submit'][value*='gree']",
        "input[type='submit'][value*='ccept']",
        "#disclaimer",
        "a:has-text('I Agree')",
        "button:has-text('I Agree')",
        "button:has-text('Accept')",
    ]
    for sel in candidates:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                await loc.first.click()
                await page.wait_for_load_state("domcontentloaded", timeout=15_000)
                logger.debug("Accepted disclaimer via: %s", sel)
                return
        except Exception:
            continue
    logger.debug("No disclaimer button found — already on search form or disclaimer auto-passed")


# ---------------------------------------------------------------------------
# Name-based search flow
# ---------------------------------------------------------------------------

async def _name_search(
    page: Page,
    last_name: str,
    first_name: str,
    middle_initial: str,
    county: str,
    role_filter: str,  # "plaintiff" | "defendant"
) -> list[dict]:
    """Navigate the name-search form, collect all result rows, and filter."""
    # Go to the landing page; accept disclaimer; land on inquirySearch.jis
    await page.goto(CASE_SEARCH_URL, wait_until="domcontentloaded", timeout=30_000)
    await _accept_disclaimer(page)

    # If we're still on the disclaimer/landing page, try navigating directly
    if "inquirySearch" not in page.url and "disclaimer" in (await page.content()).lower():
        logger.debug("Retrying with direct form URL")
        await page.goto(INQUIRY_SEARCH_URL, wait_until="domcontentloaded", timeout=20_000)
        await _accept_disclaimer(page)

    await _screenshot(page, "after_disclaimer")

    # Some builds have a search-type radio/tab — activate name search
    await _activate_name_search_tab(page)

    # Fill the three name fields
    # JIS field names: lastName, firstName, middleName  (standard ECRIS naming)
    await _fill_field(page, last_name, [
        "input[name='lastName']",
        "input[id='lastName']",
        "input[name='last_name']",
        "input[id='last_name']",
        "input[name*='LastName']",
        "input[id*='lastName']",
        "input[id*='LastName']",
    ])
    await _fill_field(page, first_name, [
        "input[name='firstName']",
        "input[id='firstName']",
        "input[name='first_name']",
        "input[id='first_name']",
        "input[name*='FirstName']",
        "input[id*='firstName']",
        "input[id*='FirstName']",
    ])
    if middle_initial:
        await _fill_field(page, middle_initial[:1], [
            "input[name='middleName']",
            "input[id='middleName']",
            "input[name='middle_name']",
            "input[name*='MiddleName']",
            "input[id*='middleName']",
            "input[id*='MiddleName']",
            "input[name*='middle']",
            "input[id*='middle']",
        ])

    # Select court system (Circuit Court Civil) and county
    await _select_court_and_county(page, county)

    await _screenshot(page, "before_search_submit")

    await _click_search(page)
    await page.wait_for_load_state("domcontentloaded", timeout=20_000)

    await _screenshot(page, "search_results")

    # Gather all result rows across paginated pages
    all_rows = await _collect_all_result_rows(page)

    if not all_rows:
        logger.info("CaseSearch: no results for %s, %s", last_name, first_name)
        return [{"status": "no_owner_match", "message": "No cases found for this name"}]

    if len(all_rows) >= _TOO_MANY:
        logger.warning("CaseSearch: too many results (%d)", len(all_rows))
        return [{
            "error": "too_many_results",
            "message": (
                f"Search returned {len(all_rows)}+ results. "
                "Provide a middle initial or switch to trustee search to narrow results."
            ),
        }]

    # --- Filter: foreclosure case type → correct county → correct role ---
    foreclosure_rows = [r for r in all_rows if _is_foreclosure(r)]
    county_rows = [r for r in foreclosure_rows if _county_matches(r, county)]
    # Loosen county filter if it eliminated everything
    if not county_rows:
        county_rows = foreclosure_rows

    if not county_rows:
        return [{"status": "no_owner_match", "message": "No foreclosure cases found for this name"}]

    role_rows = _filter_by_role(county_rows, last_name, role_filter)
    result_rows = role_rows if role_rows else county_rows

    result_rows.sort(key=lambda r: _parse_date(r.get("filing_date", "")), reverse=True)

    # Strip internal helper key before returning
    for r in result_rows:
        r.pop("_href", None)

    return result_rows


async def _activate_name_search_tab(page: Page) -> None:
    """Click the 'Name Search' tab/link if the page offers multiple search modes."""
    tab_selectors = [
        "a:has-text('Name Search')",
        "input[value='Name Search']",
        "label:has-text('Name')",
        "button:has-text('Name')",
    ]
    for sel in tab_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.click()
                await page.wait_for_load_state("domcontentloaded", timeout=10_000)
                logger.debug("Activated name search tab via: %s", sel)
                return
        except Exception:
            continue


async def _fill_field(page: Page, value: str, selectors: list[str]) -> None:
    """Try each selector in order; fill the first visible match."""
    for sel in selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                el = loc.first
                if await el.is_visible():
                    await el.fill(value)
                    logger.debug("Filled %r via: %s", value, sel)
                    return
        except Exception:
            continue
    logger.warning("Could not fill field with value %r — no matching selector found", value)


async def _select_court_and_county(page: Page, county: str) -> None:
    """
    Select the Circuit Court Civil option and the target county.

    Maryland JIS form:
      - courtSystem dropdown  → value "CCVL" (Circuit Court Civil)
      - county dropdown       → 2-letter code, e.g. "PG"
    """
    county_key = county.lower().replace(" county", "").strip()
    county_code = _COUNTY_CODES.get(county_key, "")
    county_title = county.title().strip()

    # ---- Court system -------------------------------------------------------
    court_selectors = [
        "select[name='courtSystem']",
        "select[id='courtSystem']",
        "select[name*='court']",
        "select[id*='court']",
        "select[name*='Court']",
        "select[id*='Court']",
    ]
    # JIS values: CCVL = Circuit Court Civil, CCML = Circuit Court Criminal
    circuit_values = ["CCVL", "CC", "Circuit Court", "CIRCUIT COURT", "Circuit Court Civil", "Civil"]
    for sel in court_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() == 0:
                continue
            el = loc.first
            if not await el.is_visible():
                continue
            for v in circuit_values:
                try:
                    await el.select_option(value=v)
                    logger.debug("Selected court system value %r via: %s", v, sel)
                    # Allow page to react (county dropdown may appear dynamically)
                    await page.wait_for_timeout(500)
                    break
                except Exception:
                    try:
                        await el.select_option(label=v)
                        logger.debug("Selected court system label %r via: %s", v, sel)
                        await page.wait_for_timeout(500)
                        break
                    except Exception:
                        continue
            break
        except Exception:
            continue

    # ---- County -------------------------------------------------------------
    county_selectors = [
        "select[name='county']",
        "select[id='county']",
        "select[name*='county']",
        "select[id*='county']",
        "select[name*='County']",
        "select[id*='County']",
    ]
    county_candidates = [county_code, county_title, county.upper(), county]
    for sel in county_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() == 0:
                continue
            el = loc.first
            if not await el.is_visible():
                continue
            for c in county_candidates:
                if not c:
                    continue
                try:
                    await el.select_option(value=c)
                    logger.debug("Selected county value %r via: %s", c, sel)
                    break
                except Exception:
                    try:
                        await el.select_option(label=c)
                        logger.debug("Selected county label %r via: %s", c, sel)
                        break
                    except Exception:
                        continue
            break
        except Exception:
            continue


async def _click_search(page: Page) -> None:
    """Click the Search submit button."""
    submit_selectors = [
        "input[type='submit'][value='Search']",
        "input[type='submit'][value='Go']",
        "input[type='submit'][name='action']",
        "input[type='submit']",
        "#searchButton",
        "button[type='submit']",
        "button:has-text('Search')",
    ]
    for sel in submit_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.click()
                logger.debug("Clicked search via: %s", sel)
                return
        except Exception:
            continue
    raise RuntimeError("Could not find a visible Search button on the form")


# ---------------------------------------------------------------------------
# Results collection (with pagination)
# ---------------------------------------------------------------------------

async def _collect_all_result_rows(page: Page) -> list[dict]:
    """Gather case rows from all result pages."""
    all_rows: list[dict] = []
    page_num = 0

    while True:
        page_num += 1
        content = await page.content()

        no_result_phrases = [
            "no records found",
            "no results",
            "0 case",
            "search returned no",
        ]
        if any(p in content.lower() for p in no_result_phrases):
            logger.debug("No-results phrase detected on page %d", page_num)
            break

        rows = await _parse_results_table(page)
        if not rows:
            break

        all_rows.extend(rows)
        logger.debug("Page %d: %d rows (total %d)", page_num, len(rows), len(all_rows))

        if len(all_rows) >= _TOO_MANY:
            break

        advanced = await _go_to_next_page(page)
        if not advanced:
            break

    return all_rows


async def _parse_results_table(page: Page) -> list[dict]:
    """
    Parse the results table on the current page.

    Maryland Judiciary Case Search renders results as an HTML table with
    columns (order may vary):
      Case Number | Caption | Filing Date | Case Type | Case Status | Court
    """
    rows: list[dict] = []
    table_rows = page.locator("table tr")
    count = await table_rows.count()

    # Detect column layout from the first header row
    col_map: dict[str, int] = {}
    for i in range(min(count, 5)):
        cells = table_rows.nth(i).locator("th, td")
        cell_count = await cells.count()
        if cell_count < 3:
            continue
        headers = []
        for j in range(cell_count):
            try:
                headers.append((await cells.nth(j).inner_text()).strip().lower())
            except Exception:
                headers.append("")
        if not any("case" in h for h in headers):
            continue
        for j, h in enumerate(headers):
            if re.search(r"case\s*(no|num)", h):
                col_map["case_number"] = j
            elif re.search(r"caption|title|party|name", h):
                col_map["case_title"] = j
            elif re.search(r"fil(ing|e)\s*date|date\s*fil", h):
                col_map["filing_date"] = j
            elif re.search(r"\btype\b", h):
                col_map["case_type"] = j
            elif re.search(r"status", h):
                col_map["case_status"] = j
            elif re.search(r"court|loc", h):
                col_map["court"] = j
        if col_map:
            break

    # Fallback ordering when header detection fails
    if not col_map:
        col_map = {
            "case_number": 0,
            "case_title": 1,
            "filing_date": 2,
            "case_type": 3,
            "case_status": 4,
            "court": 5,
        }

    for i in range(count):
        cells = table_rows.nth(i).locator("td")
        cell_count = await cells.count()
        if cell_count < 3:
            continue

        cn_idx = col_map.get("case_number", 0)
        case_number = ""
        case_link_href = ""
        if 0 <= cn_idx < cell_count:
            cn_cell = cells.nth(cn_idx)
            link = cn_cell.locator("a")
            if await link.count() > 0:
                case_number = _ws(await link.first.inner_text())
                case_link_href = await link.first.get_attribute("href") or ""
            else:
                case_number = _ws(await cn_cell.inner_text())

        if not case_number:
            continue

        async def _text(key: str) -> str:
            idx = col_map.get(key, -1)
            if 0 <= idx < cell_count:
                try:
                    return _ws(await cells.nth(idx).inner_text())
                except Exception:
                    return ""
            return ""

        rows.append({
            "case_number": case_number,
            "case_title": await _text("case_title"),
            "filing_date": await _text("filing_date"),
            "case_type": await _text("case_type"),
            "case_status": await _text("case_status"),
            "court": await _text("court"),
            "_href": case_link_href,
        })

    return rows


async def _go_to_next_page(page: Page) -> bool:
    """Click the 'Next' pagination control.  Returns True if navigated."""
    next_selectors = [
        "a:has-text('Next')",
        "a[rel='next']",
        "input[value='Next']",
        "a:has-text('>')",
        "a:has-text('→')",
    ]
    for sel in next_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.click()
                await page.wait_for_load_state("domcontentloaded", timeout=15_000)
                logger.debug("Advanced to next page via: %s", sel)
                return True
        except Exception:
            continue
    return False


# ---------------------------------------------------------------------------
# Result filtering helpers
# ---------------------------------------------------------------------------

def _is_foreclosure(row: dict) -> bool:
    combined = row.get("case_type", "") + " " + row.get("case_title", "")
    return bool(_FORECLOSURE_RE.search(combined))


def _county_matches(row: dict, county: str) -> bool:
    county_key = county.lower().replace(" county", "").strip()
    court_lower = row.get("court", "").lower()
    return not court_lower or county_key in court_lower


def _filter_by_role(rows: list[dict], last_name: str, role: str) -> list[dict]:
    """
    Infer party role from the case caption (``PLAINTIFF VS DEFENDANT``).
    Returns only rows where *last_name* appears on the expected side.
    """
    target = last_name.upper()
    matched = []
    for row in rows:
        title = row.get("case_title", "").upper()
        sep = None
        if " VS " in title:
            sep = " VS "
        elif " V. " in title:
            sep = " V. "
        if sep is None:
            matched.append(row)
            continue
        plaintiff_part, _, defendant_part = title.partition(sep)
        if role == "defendant" and target in defendant_part:
            matched.append(row)
        elif role == "plaintiff" and target in plaintiff_part:
            matched.append(row)
    return matched


def _parse_date(date_str: str) -> datetime:
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.min


# ---------------------------------------------------------------------------
# Case number search + docket extraction
# ---------------------------------------------------------------------------

async def _case_number_search(page: Page, case_number: str) -> dict:
    """Navigate to a specific case's docket via case-number search."""
    await page.goto(CASE_SEARCH_URL, wait_until="domcontentloaded", timeout=30_000)
    await _accept_disclaimer(page)
    await _screenshot(page, "docket_after_disclaimer")

    # Activate the case-number search tab / radio if available
    await _activate_case_number_tab(page)

    # Case number field — JIS typically uses name="caseId"
    await _fill_field(page, case_number, [
        "input[name='caseId']",
        "input[id='caseId']",
        "input[name='caseNumber']",
        "input[id='caseNumber']",
        "input[name='case_id']",
        "input[name*='caseId']",
        "input[name*='CaseId']",
        "input[name*='caseNumber']",
    ])

    await _click_search(page)
    await page.wait_for_load_state("domcontentloaded", timeout=20_000)
    await _screenshot(page, "docket_search_result")

    content = await page.content()
    if "no records" in content.lower() or "not found" in content.lower():
        return {"error": "not_found", "message": f"Case {case_number} not found"}

    # Click the case link if we're on a result list
    case_links = page.locator(f"a:has-text('{case_number}')")
    if await case_links.count() == 0:
        # Broader fallback: any table link
        case_links = page.locator("table td a")
    if await case_links.count() > 0:
        await case_links.first.click()
        await page.wait_for_load_state("domcontentloaded", timeout=15_000)

    await _screenshot(page, "docket_detail")
    return await _extract_docket(page, case_number)


async def _activate_case_number_tab(page: Page) -> None:
    """Click the 'Case Number Search' tab/radio if the page has multiple search modes."""
    tab_selectors = [
        "a:has-text('Case Number')",
        "input[value='Case Number Search']",
        "label:has-text('Case Number')",
        "button:has-text('Case Number')",
    ]
    for sel in tab_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0 and await loc.first.is_visible():
                await loc.first.click()
                await page.wait_for_load_state("domcontentloaded", timeout=10_000)
                logger.debug("Activated case-number tab via: %s", sel)
                return
        except Exception:
            continue


async def _extract_docket(page: Page, case_number: str) -> dict:
    """
    Extract case metadata and docket entries from the MDEC case detail page.

    The detail page typically has:
    - A header section with case summary (label → value table rows)
    - A parties table
    - A docket-entries table (Date | Entry text | Comment)
    """
    result: dict = {
        "case_number": case_number,
        "case_title": "",
        "filing_date": "",
        "case_status": "",
        "court": "",
        "parties": [],
        "docket_entries": [],
        "source_url": page.url,
    }

    # ---- Header label/value pairs ------------------------------------------
    all_rows = page.locator("table tr")
    row_count = await all_rows.count()
    _found_status = False

    for i in range(row_count):
        cells = all_rows.nth(i).locator("td")
        cell_count = await cells.count()
        if cell_count < 2:
            continue
        try:
            raw_label = _ws(await cells.nth(0).inner_text()).upper()
            raw_value = _ws(await cells.nth(1).inner_text())
        except Exception:
            continue
        if not raw_label or not raw_value:
            continue

        if re.search(r"CASE\s*(NO|NUM|NUMBER)", raw_label):
            result["case_number"] = raw_value or case_number
        elif re.search(r"CAPTION|CASE\s*TITLE|CASE\s*NAME", raw_label):
            result["case_title"] = raw_value
        elif re.search(r"FILING\s*DATE|FILE\s*DATE|DATE\s*FILED", raw_label):
            result["filing_date"] = raw_value
        elif re.search(r"\bSTATUS\b", raw_label) and not _found_status:
            result["case_status"] = raw_value
            _found_status = True
        elif re.search(r"\bCOURT\b|\bLOCATION\b", raw_label) and not result["court"]:
            result["court"] = raw_value

    # ---- Parties -----------------------------------------------------------
    # Look for rows that explicitly mention plaintiff/defendant roles
    party_rows = page.locator(
        "table tr:has(td:has-text('Plaintiff')), "
        "table tr:has(td:has-text('Defendant')), "
        "table tr:has(td:has-text('plaintiff')), "
        "table tr:has(td:has-text('defendant'))"
    )
    p_count = await party_rows.count()
    for i in range(p_count):
        cells = party_rows.nth(i).locator("td")
        c = await cells.count()
        if c >= 2:
            try:
                name = _ws(await cells.nth(0).inner_text())
                role = _ws(await cells.nth(1).inner_text())
                if name:
                    result["parties"].append({"name": name, "role": role})
            except Exception:
                continue

    # ---- Docket entries ----------------------------------------------------
    best_table = await _find_docket_table(page)
    if best_table is not None:
        docket_rows = best_table.locator("tr")
        dr_count = await docket_rows.count()
        for i in range(dr_count):
            cells = docket_rows.nth(i).locator("td")
            cell_count = await cells.count()
            if cell_count < 2:
                continue
            try:
                date_text = _ws(await cells.nth(0).inner_text())
            except Exception:
                continue
            if not re.match(r"\d{1,2}/\d{1,2}/\d{4}", date_text):
                continue  # header or non-date row
            doc_name = _ws(await cells.nth(1).inner_text()) if cell_count > 1 else ""
            comment = _ws(await cells.nth(2).inner_text()) if cell_count > 2 else ""
            result["docket_entries"].append({
                "date": date_text,
                "document_name": doc_name,
                "comment": comment,
            })

    if not result["case_title"] and not result["docket_entries"]:
        return {
            "error": "parse_failed",
            "message": "Could not extract docket data — page structure may differ from expected",
            "source_url": page.url,
        }

    return result


async def _find_docket_table(page: Page):
    """
    Return the Playwright locator for the table most likely containing docket
    entries — scored by number of rows whose first cell matches a date pattern.
    """
    tables = page.locator("table")
    count = await tables.count()
    best = None
    best_score = 0

    for i in range(count):
        tbl = tables.nth(i)
        tbl_rows = tbl.locator("tr")
        row_count = await tbl_rows.count()
        if row_count < 2:
            continue
        date_hits = 0
        for j in range(1, min(row_count, 8)):
            cells = tbl_rows.nth(j).locator("td")
            if await cells.count() < 2:
                continue
            try:
                txt = _ws(await cells.nth(0).inner_text())
                if re.match(r"\d{1,2}/\d{1,2}/\d{4}", txt):
                    date_hits += 1
            except Exception:
                continue
        score = date_hits * row_count
        if score > best_score:
            best_score = score
            best = tbl

    return best


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _ws(text: str) -> str:
    """Collapse internal whitespace."""
    return re.sub(r"\s+", " ", text).strip()


async def _screenshot(page: Page, label: str) -> None:
    """Save a debug screenshot when CASE_SEARCH_DEBUG_SCREENSHOTS=1."""
    if not _DEBUG_SCREENSHOTS:
        return
    path = f"/tmp/case_search_{label}.png"
    try:
        await page.screenshot(path=path, full_page=True)
        logger.debug("Screenshot saved: %s", path)
    except Exception as exc:
        logger.debug("Screenshot failed (%s): %s", path, exc)


# ---------------------------------------------------------------------------
# Manual tests
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    async def _main() -> None:
        county = "Prince George's"

        print("\n=== Test 1: search_by_owner — Sarah P. Moore, Prince George's ===\n")
        cases = await search_by_owner(
            owner_first_name="Sarah",
            owner_last_name="Moore",
            county=county,
            owner_middle_initial="P",
        )
        print(json.dumps(cases, indent=2))

        print("\n=== Test 2: get_case_docket — C-16-CV-24-005892 ===\n")
        docket = await get_case_docket("C-16-CV-24-005892", county)
        print(json.dumps(docket, indent=2))

    asyncio.run(_main())
