"""
Scraper for the Maryland Judiciary Case Search portal
(https://casesearch.courts.state.md.us/casesearch/).

This site is protected by **DataDome**. The reliable production path is
**Bright Data Web Unlocker via the Direct API**: we POST the target URL to
``https://api.brightdata.com/request`` with our zone + Bearer key, and Bright
Data returns the fully-rendered HTML (DataDome bypass handled internally).

Public API (unchanged from earlier versions):
  search_by_owner   - find foreclosure cases where the homeowner is the defendant
  search_by_trustee - find foreclosure cases where a named trustee is the plaintiff
  get_case_docket   - return full docket entries for a known case number

Required environment variables:
  BRIGHTDATA_API_KEY    Bright Data Web Unlocker API key
  BRIGHTDATA_ZONE       Bright Data zone name (e.g. "web_unlocker_md")

When BRIGHTDATA_API_KEY is missing, the public functions return a single-item
list/dict with ``error="not_configured"`` so callers see the blocker without
timing out.
"""

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin, urlencode

import httpx
from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

CASE_SEARCH_BASE = "https://casesearch.courts.state.md.us/casesearch/"
LANDING_URL = urljoin(CASE_SEARCH_BASE, "inquiry-index.jsp")
DISCLAIMER_URL = urljoin(CASE_SEARCH_BASE, "processDisclaimer.jis")
SEARCH_URL = urljoin(CASE_SEARCH_BASE, "inquirySearch.jis")
CASE_NUM_URL = urljoin(CASE_SEARCH_BASE, "inquiryByCaseNum.jis")

BRIGHTDATA_API_URL = "https://api.brightdata.com/request"

# Patterns that identify a foreclosure / mortgage case type
_FORECLOSURE_RE = re.compile(
    r"foreclos|mortgage|foreclsr|mortg\b",
    re.IGNORECASE,
)

# Maryland county name variants -> two-letter MDEC/JIS county code
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

_TOO_MANY = 50


# ---------------------------------------------------------------------------
# Bright Data Direct API helper
# ---------------------------------------------------------------------------

def _api_key() -> Optional[str]:
    return os.environ.get("BRIGHTDATA_API_KEY", "").strip() or None


def _zone() -> str:
    return os.environ.get("BRIGHTDATA_ZONE", "web_unlocker_md").strip() or "web_unlocker_md"


def _not_configured() -> dict:
    return {
        "error": "not_configured",
        "message": (
            "BRIGHTDATA_API_KEY is not set. Maryland Case Search is protected "
            "by DataDome and requires routing through Bright Data Web Unlocker. "
            "Set BRIGHTDATA_API_KEY and BRIGHTDATA_ZONE environment variables."
        ),
    }


class BrightDataPolicyBlock(RuntimeError):
    """Raised when Bright Data refuses to scrape the target due to its
    usage-policy classification (e.g. .gov domains)."""
    def __init__(self, target_url: str, brd_error: str):
        self.target_url = target_url
        self.brd_error = brd_error
        super().__init__(f"Bright Data policy block on {target_url}: {brd_error}")


async def _bd_get(target_url: str) -> str:
    """
    Fetch a URL through Bright Data Web Unlocker Direct API (GET only).

    The Direct API spec accepts ``{zone, url, format}`` as the only fields;
    POST/body/method are not supported. We build the target URL with query
    parameters when a "form submit" is needed -- Maryland JIS forms accept
    GET as readily as POST since they use ``request.getParameter()``.

    Bright Data wraps the upstream response in their own HTTP 200, so a
    successful API call doesn't mean the scrape worked. Their actual outcome
    is signalled in response headers ``x-brd-error``, ``x-brd-error-code``,
    and ``x-brd-status-code``. We inspect those and raise a typed error
    when they refuse the target (e.g. .gov domains).

    Args:
        target_url: The URL on the target site to fetch (with query string).

    Returns:
        The fully-rendered HTML body of the unblocked response.

    Raises:
        RuntimeError: If BRIGHTDATA_API_KEY is not set.
        BrightDataPolicyBlock: If Bright Data refuses the URL by policy.
        httpx.HTTPStatusError: On non-2xx response from Bright Data itself.
    """
    api_key = _api_key()
    if not api_key:
        raise RuntimeError("BRIGHTDATA_API_KEY not set")

    body = {
        "zone": _zone(),
        "url": target_url,
        "format": "raw",
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    logger.debug("Bright Data GET %s", target_url)
    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as client:
        response = await client.post(BRIGHTDATA_API_URL, headers=headers, json=body)
        response.raise_for_status()

    brd_err = response.headers.get("x-brd-error", "").strip()
    brd_status = response.headers.get("x-brd-status-code", "").strip()
    if brd_err or (brd_status and brd_status != "200"):
        logger.error(
            "Bright Data refused %s | x-brd-status=%s | x-brd-error=%s",
            target_url, brd_status or "?", brd_err or "(none)",
        )
        raise BrightDataPolicyBlock(target_url, brd_err or f"upstream status {brd_status}")

    return response.text


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
    Search for foreclosure cases where *owner_last_name* / *owner_first_name*
    is the defendant.

    Returns a list of case dicts. On failure, a single-element list with
    ``{"error": "<code>", "message": "<detail>"}``.
    """
    if not _api_key():
        return [_not_configured()]

    logger.info(
        "CaseSearch owner | %s, %s %s | county=%r",
        owner_last_name, owner_first_name, owner_middle_initial, county,
    )
    try:
        return await _name_search(
            last_name=owner_last_name,
            first_name=owner_first_name,
            middle_initial=owner_middle_initial,
            county=county,
            role_filter="defendant",
        )
    except BrightDataPolicyBlock as exc:
        return [{
            "error": "brightdata_policy_block",
            "message": (
                f"Bright Data refused the request: {exc.brd_error} "
                "Email Bright Data support to allowlist this domain, or switch "
                "to ScrapingBee / ScraperAPI / Zyte (they have different .gov policies)."
            ),
        }]
    except httpx.HTTPStatusError as exc:
        logger.error("CaseSearch owner Bright Data HTTP %s: %s",
                     exc.response.status_code, exc.response.text[:300])
        return [{
            "error": "brightdata_error",
            "message": f"Bright Data API returned HTTP {exc.response.status_code}: {exc.response.text[:200]}",
        }]
    except Exception as exc:
        logger.exception("CaseSearch owner unexpected error")
        return [{"error": "unexpected", "message": str(exc)}]


async def search_by_trustee(
    trustee_first: str,
    trustee_last: str,
    county: str,
) -> list[dict]:
    """Same shape as ``search_by_owner`` but filters for plaintiff role."""
    if not _api_key():
        return [_not_configured()]

    logger.info(
        "CaseSearch trustee | %s, %s | county=%r",
        trustee_last, trustee_first, county,
    )
    try:
        return await _name_search(
            last_name=trustee_last,
            first_name=trustee_first,
            middle_initial="",
            county=county,
            role_filter="plaintiff",
        )
    except BrightDataPolicyBlock as exc:
        return [{
            "error": "brightdata_policy_block",
            "message": f"Bright Data refused the request: {exc.brd_error}",
        }]
    except httpx.HTTPStatusError as exc:
        logger.error("CaseSearch trustee Bright Data HTTP %s: %s",
                     exc.response.status_code, exc.response.text[:300])
        return [{
            "error": "brightdata_error",
            "message": f"Bright Data API returned HTTP {exc.response.status_code}",
        }]
    except Exception as exc:
        logger.exception("CaseSearch trustee unexpected error")
        return [{"error": "unexpected", "message": str(exc)}]


async def get_case_docket(case_number: str, county: str) -> dict:
    """
    Retrieve the full docket for a known case number.

    Returns ``{"case_number", "case_title", "filing_date", "case_status",
    "court", "parties", "docket_entries", "source_url"}`` or
    ``{"error", "message"}``.
    """
    if not _api_key():
        return _not_configured()

    logger.info("CaseSearch docket | case=%r county=%r", case_number, county)
    try:
        return await _docket_search(case_number, county)
    except BrightDataPolicyBlock as exc:
        return {
            "error": "brightdata_policy_block",
            "message": f"Bright Data refused the request: {exc.brd_error}",
        }
    except httpx.HTTPStatusError as exc:
        logger.error("CaseSearch docket Bright Data HTTP %s: %s",
                     exc.response.status_code, exc.response.text[:300])
        return {
            "error": "brightdata_error",
            "message": f"Bright Data API returned HTTP {exc.response.status_code}",
        }
    except Exception as exc:
        logger.exception("CaseSearch docket unexpected error")
        return {"error": "unexpected", "message": str(exc)}


# ---------------------------------------------------------------------------
# Name-based search flow
# ---------------------------------------------------------------------------

async def _name_search(
    last_name: str,
    first_name: str,
    middle_initial: str,
    county: str,
    role_filter: str,  # "plaintiff" | "defendant"
) -> list[dict]:
    """Perform a JIS name search via Bright Data and return parsed rows."""
    county_key = county.lower().replace(" county", "").strip()
    county_code = _COUNTY_CODES.get(county_key, "")
    # JIS accepts both GET and POST for ``inquirySearch.jis``; we GET via
    # Bright Data with all the form params (including disclaimer=Y to bypass
    # the disclaimer-cookie gate that the public site enforces in the UI).
    params = {
        "lastName": last_name,
        "firstName": first_name,
        "middleName": middle_initial[:1] if middle_initial else "",
        "partyType": "",
        "site": "00",
        "courtSystem": "B",            # Circuit Courts
        "countyName": county_code,
        "filingStart": "",
        "filingEnd": "",
        "filingDate": "",
        "company": "N",
        "disclaimer": "Y",
        "action": "Search",
    }
    search_url = f"{SEARCH_URL}?{urlencode(params)}"
    html = await _bd_get(search_url)

    if _looks_blocked(html):
        return [{
            "error": "datadome_block",
            "message": (
                "Bright Data did not bypass DataDome on this request. "
                "Verify the zone has Web Unlocker / DataDome handling enabled."
            ),
        }]

    rows = _parse_results_table(html)

    page_num = 1
    last_html = html
    while page_num < 5 and len(rows) < _TOO_MANY:
        next_url = _find_next_page(last_html, SEARCH_URL)
        if not next_url:
            break
        page_num += 1
        last_html = await _bd_get(next_url)
        more = _parse_results_table(last_html)
        if not more:
            break
        rows.extend(more)

    if not rows:
        return [{"status": "no_owner_match", "message": "No cases found for this name"}]

    if len(rows) >= _TOO_MANY:
        return [{
            "error": "too_many_results",
            "message": (
                f"Search returned {len(rows)}+ results. "
                "Provide a middle initial or switch to trustee search."
            ),
        }]

    foreclosure_rows = [r for r in rows if _is_foreclosure(r)]
    county_rows = [r for r in foreclosure_rows if _county_matches(r, county)]
    if not county_rows:
        county_rows = foreclosure_rows
    if not county_rows:
        return [{"status": "no_owner_match", "message": "No foreclosure cases found"}]

    role_rows = _filter_by_role(county_rows, last_name, role_filter)
    result_rows = role_rows if role_rows else county_rows
    result_rows.sort(key=lambda r: _parse_date(r.get("filing_date", "")), reverse=True)

    for r in result_rows:
        r.pop("_href", None)
    return result_rows


# ---------------------------------------------------------------------------
# Docket lookup by case number
# ---------------------------------------------------------------------------

async def _docket_search(case_number: str, county: str) -> dict:
    params = {
        "caseId": case_number,
        "disclaimer": "Y",
        "action": "Search",
    }
    case_num_url = f"{CASE_NUM_URL}?{urlencode(params)}"
    html = await _bd_get(case_num_url)

    if _looks_blocked(html):
        return {"error": "datadome_block",
                "message": "Bright Data did not bypass DataDome."}

    soup = BeautifulSoup(html, "html.parser")
    detail_link = None
    for a in soup.select("table a[href]"):
        href = a.get("href", "")
        if "inquiryDetail" in href or case_number in a.get_text(""):
            detail_link = href
            break

    if detail_link:
        detail_url = urljoin(CASE_SEARCH_BASE, detail_link)
        html = await _bd_get(detail_url)
        soup = BeautifulSoup(html, "html.parser")
        source_url = detail_url
    else:
        source_url = case_num_url

    return _parse_docket(soup, case_number, source_url)


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

def _parse_results_table(html: str) -> list[dict]:
    """Parse the JIS results table into a list of case dicts."""
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict] = []

    target_table = None
    for table in soup.find_all("table"):
        text = table.get_text(" ", strip=True).lower()
        if "case number" in text and ("filing" in text or "case type" in text):
            target_table = table
            break
    if target_table is None:
        return rows

    headers: list[str] = []
    col_map: dict[str, int] = {}
    for tr in target_table.find_all("tr"):
        cells = tr.find_all(["th", "td"])
        if not cells:
            continue
        if not headers:
            cell_texts = [_ws(c.get_text(" ", strip=True)).lower() for c in cells]
            if any("case" in t for t in cell_texts):
                headers = cell_texts
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
                continue

        if not col_map:
            col_map = {
                "case_number": 0,
                "case_title": 1,
                "filing_date": 2,
                "case_type": 3,
                "case_status": 4,
                "court": 5,
            }

        cn_idx = col_map.get("case_number", 0)
        if cn_idx >= len(cells):
            continue

        cn_cell = cells[cn_idx]
        link = cn_cell.find("a")
        if link is not None:
            case_number = _ws(link.get_text(" ", strip=True))
            case_link_href = link.get("href", "") or ""
        else:
            case_number = _ws(cn_cell.get_text(" ", strip=True))
            case_link_href = ""

        if not case_number or "case" in case_number.lower():
            continue  # likely a repeated header

        def _txt(key: str) -> str:
            idx = col_map.get(key, -1)
            if 0 <= idx < len(cells):
                return _ws(cells[idx].get_text(" ", strip=True))
            return ""

        rows.append({
            "case_number": case_number,
            "case_title": _txt("case_title"),
            "filing_date": _txt("filing_date"),
            "case_type": _txt("case_type"),
            "case_status": _txt("case_status"),
            "court": _txt("court"),
            "_href": case_link_href,
        })

    return rows


def _find_next_page(html: str, current_url: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a"):
        text = _ws(a.get_text(" ", strip=True)).lower()
        if text in ("next", ">", "next >"):
            href = a.get("href")
            if href:
                return urljoin(current_url, href)
    return None


def _parse_docket(soup: BeautifulSoup, case_number: str, source_url: str) -> dict:
    result: dict = {
        "case_number": case_number,
        "case_title": "",
        "filing_date": "",
        "case_status": "",
        "court": "",
        "parties": [],
        "docket_entries": [],
        "source_url": source_url,
    }

    found_status = False
    for tr in soup.find_all("tr"):
        cells = tr.find_all("td")
        if len(cells) < 2:
            continue
        raw_label = _ws(cells[0].get_text(" ", strip=True)).upper()
        raw_value = _ws(cells[1].get_text(" ", strip=True))
        if not raw_label or not raw_value:
            continue

        if re.search(r"CASE\s*(NO|NUM|NUMBER)", raw_label):
            result["case_number"] = raw_value or case_number
        elif re.search(r"CAPTION|CASE\s*TITLE|CASE\s*NAME", raw_label):
            result["case_title"] = raw_value
        elif re.search(r"FILING\s*DATE|FILE\s*DATE|DATE\s*FILED", raw_label):
            result["filing_date"] = raw_value
        elif re.search(r"\bSTATUS\b", raw_label) and not found_status:
            result["case_status"] = raw_value
            found_status = True
        elif re.search(r"\bCOURT\b|\bLOCATION\b", raw_label) and not result["court"]:
            result["court"] = raw_value

    for tr in soup.find_all("tr"):
        text = tr.get_text(" ", strip=True).lower()
        if not ("plaintiff" in text or "defendant" in text):
            continue
        cells = tr.find_all("td")
        if len(cells) >= 2:
            name = _ws(cells[0].get_text(" ", strip=True))
            role = _ws(cells[1].get_text(" ", strip=True))
            if name:
                result["parties"].append({"name": name, "role": role})

    best_table: Optional[Tag] = None
    best_score = 0
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue
        date_hits = 0
        for tr in rows[1:8]:
            cells = tr.find_all("td")
            if len(cells) < 2:
                continue
            txt = _ws(cells[0].get_text(" ", strip=True))
            if re.match(r"\d{1,2}/\d{1,2}/\d{4}", txt):
                date_hits += 1
        score = date_hits * len(rows)
        if score > best_score:
            best_score = score
            best_table = table

    if best_table is not None:
        for tr in best_table.find_all("tr"):
            cells = tr.find_all("td")
            if len(cells) < 2:
                continue
            date_text = _ws(cells[0].get_text(" ", strip=True))
            if not re.match(r"\d{1,2}/\d{1,2}/\d{4}", date_text):
                continue
            result["docket_entries"].append({
                "date": date_text,
                "document_name": _ws(cells[1].get_text(" ", strip=True)) if len(cells) > 1 else "",
                "comment": _ws(cells[2].get_text(" ", strip=True)) if len(cells) > 2 else "",
            })

    if not result["case_title"] and not result["docket_entries"]:
        return {
            "error": "parse_failed",
            "message": "Could not extract docket data. Page structure may have changed.",
            "source_url": source_url,
        }
    return result


# ---------------------------------------------------------------------------
# Filtering helpers
# ---------------------------------------------------------------------------

def _is_foreclosure(row: dict) -> bool:
    combined = row.get("case_type", "") + " " + row.get("case_title", "")
    return bool(_FORECLOSURE_RE.search(combined))


def _county_matches(row: dict, county: str) -> bool:
    county_key = county.lower().replace(" county", "").strip()
    court_lower = row.get("court", "").lower()
    return not court_lower or county_key in court_lower


def _filter_by_role(rows: list[dict], last_name: str, role: str) -> list[dict]:
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


def _looks_blocked(html: str) -> bool:
    lower = html.lower()
    return (
        "geo.captcha-delivery.com" in lower
        or "datadome" in lower
        or "access is temporarily restricted" in lower
    )


def _ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------------------------
# Manual test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json as _json
    from pathlib import Path
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    except Exception:
        pass

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    async def _main() -> None:
        county = "Prince George's"

        print("\n=== Test 1: search_by_owner -- Sarah P. Moore, Prince George's ===\n")
        cases = await search_by_owner(
            owner_first_name="Sarah",
            owner_last_name="Moore",
            county=county,
            owner_middle_initial="P",
        )
        print(_json.dumps(cases, indent=2))

        print("\n=== Test 2: get_case_docket -- C-16-CV-24-005892 ===\n")
        docket = await get_case_docket("C-16-CV-24-005892", county)
        print(_json.dumps(docket, indent=2))

    asyncio.run(_main())
