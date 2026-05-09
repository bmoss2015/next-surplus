"""
Scraper for the Maryland State Department of Assessments and Taxation (SDAT) real
property search portal (https://sdat.dat.maryland.gov/RealProperty/).

Navigates the two-page search flow (county + search type, then street number /
street name) and returns a structured assessment record for the matched property.
"""

import asyncio
import logging
import os
import re
from typing import Optional

from playwright.async_api import (
    async_playwright,
    Page,
    TimeoutError as PlaywrightTimeoutError,
)

from ._stealth import (
    make_stealth_context,
    maryland_initial_wait,
    human_pause,
    field_pause,
    human_click,
    human_type,
)

logger = logging.getLogger(__name__)

SDAT_URL = "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx"

# Suffixes stripped from street_name before submitting to SDAT
_SUFFIXES: set[str] = {
    "drive", "dr",
    "avenue", "ave",
    "street", "st",
    "lane", "ln",
    "road", "rd",
    "court", "ct",
    "place", "pl",
    "boulevard", "blvd",
    "way",
    "circle", "cir",
    "terrace", "ter",
    "highway", "hwy",
    "parkway", "pkwy",
}


# ---------------------------------------------------------------------------
# Address parsing
# ---------------------------------------------------------------------------

def _parse_address(property_address: str) -> tuple[str, str]:
    """
    Split a full address into (street_number, street_name).

    Drops the city/state/zip portion (anything after a comma) and strips
    trailing street-type suffixes from the name.

    >>> _parse_address("4044 Hanson Oaks Drive")
    ('4044', 'Hanson Oaks')
    >>> _parse_address("123 Main Street, Baltimore, MD 21201")
    ('123', 'Main')
    """
    street = property_address.split(",")[0].strip()
    parts = street.split()
    if not parts:
        return "", ""

    street_number = parts[0]
    name_parts = parts[1:]

    # Strip any trailing suffix tokens (handle trailing periods, e.g. "Dr.")
    while name_parts and name_parts[-1].lower().rstrip(".") in _SUFFIXES:
        name_parts.pop()

    return street_number, " ".join(name_parts)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def search_sdat(property_address: str, county: str) -> dict:
    """
    Search SDAT real property for *property_address* in *county*.

    Args:
        property_address: Full address string, e.g. ``"4044 Hanson Oaks Drive"``.
        county: Maryland county name, e.g. ``"Prince George's County"``.

    Returns:
        Dictionary with the fields below (all values are strings unless noted):

        - ``current_owner``
        - ``property_type``
        - ``last_sale_date``
        - ``last_sale_price``
        - ``assessment_value``
        - ``principal_residence_indicator``
        - ``account_number``
        - ``mailing_address``
        - ``historical_owners`` (list[str], may be empty)
        - ``all_matches`` (list[dict], populated when multiple results found)
        - ``source_url``

        On failure the dict contains ``"error"`` (short code) and ``"message"``.
    """
    street_number, street_name = _parse_address(property_address)
    logger.info(
        "SDAT search | raw_address=%r  county=%r  -> street_number=%r  street_name=%r",
        property_address, county, street_number, street_name,
    )

    async with async_playwright() as pw:
        # Prefer the pre-installed system Chromium when the Playwright-managed
        # binary isn't available (common in CI / Docker environments).
        _CHROME_PATHS = [
            "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/bin/google-chrome",
        ]
        import os
        _exec = next((p for p in _CHROME_PATHS if os.path.isfile(p)), None)
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
            **( {"executable_path": _exec} if _exec else {} ),
        )
        # Stealth context: SDAT silently bot-detects raw Playwright and refuses
        # to advance the wizard past the address-entry step (verified locally).
        context = await make_stealth_context(browser)
        page = await context.new_page()
        try:
            result = await _run_search(page, county, street_number, street_name)
        except PlaywrightTimeoutError as exc:
            logger.error("SDAT timeout: %s", exc)
            result = {"error": "timeout", "message": str(exc)}
        except Exception as exc:
            logger.exception("SDAT unexpected error")
            result = {"error": "unexpected", "message": str(exc)}
        finally:
            await browser.close()

    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _run_search(
    page: Page, county: str, street_number: str, street_name: str
) -> dict:
    await page.goto(SDAT_URL, wait_until="domcontentloaded", timeout=30_000)
    # MD state sites are slow + WAF triggers on instant interaction
    await maryland_initial_wait()

    await _accept_disclaimer(page)
    await _fill_page1(page, county)
    await _fill_page2(page, street_number, street_name)
    return await _parse_results(page)


# -- Disclaimer --------------------------------------------------------------

async def _accept_disclaimer(page: Page) -> None:
    """Click through any terms/disclaimer overlay on the landing page."""
    candidates = [
        "input[value='I Accept']",
        "input[value='Accept']",
        "input[value='I Agree']",
        "#btnAccept",
        "input[name*='Accept']",
        "input[name*='Agree']",
        "a:has-text('I Agree')",
        "button:has-text('Accept')",
        "input[type='submit'][value*='gree']",
        "input[type='submit'][value*='ccept']",
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


# -- County normalization ----------------------------------------------------

def _normalize_county(county: str) -> list[str]:
    """
    Return candidate labels to try in the SDAT county dropdown.

    SDAT uses ALL CAPS names.  Prince George's County is tricky because the
    apostrophe may or may not appear in the dropdown option text.
    We return multiple candidates so the caller can try each one.
    """
    raw = county.strip()
    # Drop trailing " County" if present (SDAT dropdown usually omits it)
    normed = re.sub(r"\s+County$", "", raw, flags=re.IGNORECASE).strip()
    upper = normed.upper()
    # Variant without apostrophe (SDAT sometimes uses PRINCE GEORGES)
    no_apos = upper.replace("'", "")
    candidates: list[str] = []
    for variant in [upper, no_apos, raw.upper(), raw]:
        if variant not in candidates:
            candidates.append(variant)
    return candidates


# -- Page 1: county + search type -------------------------------------------

async def _fill_page1(page: Page, county: str) -> None:
    """Select county and search type, then advance."""
    county_candidates = _normalize_county(county)
    logger.info("SDAT county candidates: %s", county_candidates)

    # County dropdown — try a few ID patterns used by SDAT's ASP.NET controls.
    # The 2026 wizard redesign uses the long cphMainContentArea_... ID; keep the
    # short fallbacks for older deployments / cached pages.
    county_selectors = [
        "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlCounty",
        "[id$='ddlCounty']",
        "#County",
        "#ddlCounty",
        "select[name*='County']",
        "select[id*='County']",
    ]
    # Wizard's PRINCE GEORGE'S option is "PRINCE GEORGE'S COUNTY" (with " COUNTY")
    if "prince george" in county.lower():
        county_candidates = [
            "PRINCE GEORGE'S COUNTY",
            "PRINCE GEORGE'S",
            "PRINCE GEORGES COUNTY",
            "PRINCE GEORGES",
        ] + county_candidates
    county_selected = False
    for sel in county_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() == 0:
                continue
            for label in county_candidates:
                try:
                    await loc.select_option(label=label)
                    logger.info("Selected county %r via %s", label, sel)
                    county_selected = True
                    break
                except Exception:
                    continue
            if county_selected:
                break
        except Exception:
            continue

    if not county_selected:
        logger.warning("Could not select county from dropdown — will attempt to continue")

    # Search type dropdown — SDAT uses "STREET ADDRESS" (all caps)
    search_type_selectors = [
        "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlSearchType",
        "[id$='ddlSearchType']",
        "#SearchType",
        "#ddlSearchType",
        "select[name*='SearchType']",
        "select[id*='SearchType']",
        "select[name*='Type']",
    ]
    search_type_labels = ["STREET ADDRESS", "Street Address", "street address"]
    for sel in search_type_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() == 0:
                continue
            for label in search_type_labels:
                try:
                    await loc.select_option(label=label)
                    logger.info("Selected search type %r via %s", label, sel)
                    break
                except Exception:
                    continue
            break
        except Exception:
            continue

    await _click_submit(page)
    # Wait for page 2 inputs to appear rather than just domcontentloaded
    try:
        await page.wait_for_selector(
            "input[id*='StNo'], input[name*='StNo'], input[id*='StreetNumber'], input[name*='StreetNumber']",
            timeout=20_000,
        )
    except PlaywrightTimeoutError:
        await page.wait_for_load_state("domcontentloaded", timeout=10_000)


# -- Page 2: street number + name -------------------------------------------

async def _fill_page2(page: Page, street_number: str, street_name: str) -> None:
    """Enter street number and street name, then advance to results."""
    # 2026 wizard uses long ASP.NET IDs with a typo: txtStreenNumber (not Street).
    number_selectors = [
        "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreenNumber",
        "[id$='txtStreenNumber']",
        "input[id*='txtStreen']",
        "#StreetNumberID",
        "#txtStNo",
        "[id$='txtStNo']",
        "input[name*='StNo']",
        "input[id*='StNo']",
        "input[name*='StreetNumber']",
        "input[id*='StreetNumber']",
        "input[placeholder*='Number']",
    ]
    for sel in number_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                await loc.fill(street_number)
                logger.debug("Filled street number via: %s", sel)
                break
        except Exception:
            continue

    name_selectors = [
        "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreetName",
        "[id$='txtStreetName']",
        "#StreetNameID",
        "#txtStName",
        "[id$='txtStName']",
        "input[name*='StName']",
        "input[id*='StName']",
        "input[name*='StreetName']",
        "input[id*='StreetName']",
        "input[placeholder*='Name']",
    ]
    for sel in name_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                await loc.fill(street_name)
                logger.debug("Filled street name via: %s", sel)
                break
        except Exception:
            continue

    await _click_submit(page)
    # Wait for results table OR no-results text rather than just domcontentloaded
    try:
        await page.wait_for_selector(
            "table a[href*='Account'], table a[href*='account'], "
            "table a[href*='Detail'], table a[href*='detail'], "
            "table tr td",
            timeout=25_000,
        )
    except PlaywrightTimeoutError:
        await page.wait_for_load_state("domcontentloaded", timeout=10_000)


async def _click_submit(page: Page) -> None:
    """Click the Next / Submit / Continue button using multiple fallback selectors."""
    # Brief human-like pause before clicking; SDAT's bot detection trips on instant clicks.
    await field_pause()
    submit_selectors = [
        # 2026 wizard: page 1 -> Continue, page 2 -> Next
        "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StartNavigationTemplateContainerID_btnContinue",
        "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StepNavigationTemplateContainerID_btnStepNextButton",
        "[id$='btnContinue']",
        "[id$='btnStepNextButton']",
        "input[type='submit'][value='Continue']",
        "input[type='submit'][value='Next']",
        # Older / generic
        "#btnNext",
        "#btnSubmit",
        "#btnSearch",
        "[id$='btnNext']",
        "[id$='btnSubmit']",
        "[id$='btnSearch']",
        "input[type='submit'][value='Search']",
        "input[type='submit'][value='Submit']",
        "input[type='submit']",
        "button[type='submit']",
    ]
    for sel in submit_selectors:
        try:
            loc = page.locator(sel)
            if await loc.count() > 0:
                # human_click does mouse-move + offset, defeating instant-click bot heuristics.
                await human_click(page, sel)
                logger.debug("Clicked submit via: %s", sel)
                return
        except Exception:
            continue
    raise RuntimeError("Could not find a submit button on the page")


# -- Results parsing ---------------------------------------------------------

async def _parse_results(page: Page) -> dict:
    """
    Handle results page — may be a list of matches or a direct detail page.

    When multiple matches appear, returns the first match's detail plus an
    ``all_matches`` key listing all candidate addresses.
    """
    content = await page.content()

    # Check for explicit no-results conditions
    no_result_phrases = [
        "no records found",
        "no results found",
        "0 records",
        "your search returned no",
        "property not found",
    ]
    if any(p in content.lower() for p in no_result_phrases):
        return {"error": "not_found", "message": "No records found for this address"}

    # Detect a results list vs. a direct detail page
    # SDAT lists results as table rows with clickable account links
    result_row_links = page.locator(
        "table a[href*='Account'], table a[href*='account'], "
        "table a[href*='Detail'], table a[href*='detail']"
    )
    match_count = await result_row_links.count()

    all_match_texts: list[str] = []
    if match_count > 1:
        # Collect all candidate labels for the caller
        for i in range(match_count):
            txt = (await result_row_links.nth(i).inner_text()).strip()
            all_match_texts.append(txt)
        logger.info("Multiple SDAT results (%d); following first match", match_count)
        await result_row_links.first.click()
        await page.wait_for_load_state("domcontentloaded", timeout=15_000)
    elif match_count == 1:
        await result_row_links.first.click()
        await page.wait_for_load_state("domcontentloaded", timeout=15_000)
    # else: already on the detail page

    detail = await _extract_detail(page)
    if all_match_texts:
        detail["all_matches"] = all_match_texts
    return detail


async def _extract_detail(page: Page) -> dict:
    """
    Extract structured fields from an SDAT property detail page.

    SDAT renders data in ``<table>`` rows with a label cell and a value cell.
    We scan all rows and map recognised label patterns to output keys.
    """
    result: dict = {
        "current_owner": None,
        "property_type": None,
        "last_sale_date": None,
        "last_sale_price": None,
        "assessment_value": None,
        "principal_residence_indicator": None,
        "account_number": None,
        "mailing_address": None,
        "historical_owners": [],
        "source_url": page.url,
    }

    rows = page.locator("table tr")
    row_count = await rows.count()
    mailing_lines: list[str] = []

    for i in range(row_count):
        cells = rows.nth(i).locator("td")
        cell_count = await cells.count()
        if cell_count < 2:
            continue

        raw_label = (await cells.nth(0).inner_text()).strip()
        raw_value = (await cells.nth(1).inner_text()).strip()

        if not raw_label or not raw_value:
            continue

        label = raw_label.upper()
        value = _clean(raw_value)

        # Owner name
        if re.search(r"\bOWNER\b", label) and "PREVIOUS" not in label and "HISTORY" not in label:
            if result["current_owner"] is None:
                result["current_owner"] = value

        # Historical / previous owners
        elif "PREVIOUS OWNER" in label or "OWNER HISTORY" in label or "PRIOR OWNER" in label:
            result["historical_owners"].append(value)

        # Property type / use
        elif re.search(r"\bUSE\b|\bPROPERTY TYPE\b|\bPROPERTY CLASS\b|\bUSE CODE\b", label):
            if result["property_type"] is None:
                result["property_type"] = value

        # Sale date
        elif re.search(r"\bSALE DATE\b|\bTRANSFER DATE\b|\bDATE OF SALE\b", label):
            if result["last_sale_date"] is None:
                result["last_sale_date"] = value

        # Sale price
        elif re.search(r"\bSALE PRICE\b|\bCONSIDERATION\b|\bTRANSFER AMOUNT\b|\bSALE AMOUNT\b", label):
            if result["last_sale_price"] is None:
                result["last_sale_price"] = value

        # Assessment
        elif re.search(r"\bTOTAL ASSESS\b|\bASSESS.*TOTAL\b|\bASSESSABLE BASE\b|\bPHASE.*VALUE\b", label):
            if result["assessment_value"] is None:
                result["assessment_value"] = value

        # Principal residence / homestead credit
        elif re.search(r"\bPRINCIPAL\b|\bHOMESTEAD\b", label):
            if result["principal_residence_indicator"] is None:
                result["principal_residence_indicator"] = value

        # Account / parcel ID
        elif re.search(r"\bACCOUNT\b|\bACCOUNT NUMBER\b|\bPARCEL\b", label):
            if result["account_number"] is None:
                result["account_number"] = value

        # Mailing address (may span multiple rows)
        elif "MAILING" in label:
            if result["mailing_address"] is None:
                mailing_lines = [value]
            else:
                mailing_lines.append(value)

        elif mailing_lines and not raw_label.strip() and raw_value.strip():
            # Continuation row for mailing address (empty label, value present)
            mailing_lines.append(value)

    if mailing_lines:
        result["mailing_address"] = ", ".join(mailing_lines)

    # Scrub None entries so caller gets clean output
    result = {k: v for k, v in result.items() if v is not None and v != []}

    if len(result) <= 2:  # only source_url and maybe historical_owners
        # --- Debug capture ---
        current_url = page.url
        try:
            screenshot_path = "/tmp/sdat_debug_screenshot.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            logger.error("SDAT parse_failed | URL: %s | screenshot: %s", current_url, screenshot_path)
        except Exception as ss_err:
            logger.error("SDAT parse_failed | URL: %s | screenshot failed: %s", current_url, ss_err)

        try:
            html_path = "/tmp/sdat_debug_page.html"
            html = await page.content()
            with open(html_path, "w", encoding="utf-8") as fh:
                fh.write(html)
            body_text = await page.inner_text("body")
            logger.error("SDAT page body (first 500 chars): %s", body_text[:500])
            logger.error("SDAT HTML saved: %s", html_path)
        except Exception as html_err:
            logger.error("SDAT HTML capture failed: %s", html_err)
        # --- End debug ---

        return {
            "error": "parse_failed",
            "message": "Could not extract property data — page structure may have changed",
            "source_url": current_url,
        }

    return result


def _clean(text: str) -> str:
    """Collapse internal whitespace."""
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------------------------
# Manual test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    async def _main() -> None:
        address = "4044 Hanson Oaks Drive"
        county = "Prince George's County"
        print(f"\nSearching SDAT for: {address!r}  county={county!r}\n")
        result = await search_sdat(address, county)
        print(json.dumps(result, indent=2))

    asyncio.run(_main())
