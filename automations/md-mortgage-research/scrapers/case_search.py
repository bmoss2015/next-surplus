"""
Scraper for the Maryland Judiciary Case Search portal
(https://casesearch.courts.state.md.us/casesearch/).

This site is protected by **DataDome**. Real browsers auto-pass DataDome's
fingerprint check; raw Playwright (even with stealth) gets the slider captcha
challenge. The reliable production path is to route requests through
**Bright Data Web Unlocker**, which handles DataDome internally and returns
the rendered HTML.

Public API (unchanged from the previous Playwright-based version):
  search_by_owner   - find foreclosure cases where the homeowner is the defendant
  search_by_trustee - find foreclosure cases where a named trustee is the plaintiff
  get_case_docket   - return full docket entries for a known case number

Required environment variables:
  BRIGHTDATA_PROXY_URL    Full proxy URL with credentials, e.g.
                          http://brd-customer-<id>-zone-<name>:<password>@brd.superproxy.io:33335

When BRIGHTDATA_PROXY_URL is not set, the public functions return a single-item
list/dict with ``error="not_configured"`` so callers can see the blocker
without timing out.
"""

import asyncio
import logging
import os
import re
import ssl
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

CASE_SEARCH_BASE = "https://casesearch.courts.state.md.us/casesearch/"
LANDING_URL = urljoin(CASE_SEARCH_BASE, "inquiry-index.jsp")
DISCLAIMER_URL = urljoin(CASE_SEARCH_BASE, "processDisclaimer.jis")
SEARCH_URL = urljoin(CASE_SEARCH_BASE, "inquirySearch.jis")
CASE_NUM_URL = urljoin(CASE_SEARCH_BASE, "inquiryByCaseNum.jis")

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

# Realistic browser headers — Bright Data unlocks the request, but we still
# need to look like a normal browser to the origin server.
_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


# ---------------------------------------------------------------------------
# HTTP client factory
# ---------------------------------------------------------------------------

def _proxy_url() -> Optional[str]:
    return os.environ.get("BRIGHTDATA_PROXY_URL", "").strip() or None


def _build_client() -> Optional[httpx.AsyncClient]:
    """
    Build an httpx AsyncClient routed through Bright Data Web Unlocker.

    Returns None if BRIGHTDATA_PROXY_URL is not set (caller should report
    the configuration error).
    """
    proxy = _proxy_url()
    if not proxy:
        return None

    # Bright Data terminates SSL at their proxy; the certificate the client
    # sees is signed by Bright Data's CA. Most Bright Data setups require
    # disabling cert verification on the proxied connection.
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    return httpx.AsyncClient(
        proxy=proxy,
        verify=ctx,
        timeout=httpx.Timeout(60.0, connect=30.0),
        headers=_DEFAULT_HEADERS,
        follow_redirects=True,
        # Cookies persist across requests in this client instance.
    )


def _not_configured(form: str = "list") -> dict:
    msg = (
        "BRIGHTDATA_PROXY_URL is not set. Maryland Case Search is protected "
        "by DataDome and requires routing through Bright Data Web Unlocker "
        "(or equivalent). Set BRIGHTDATA_PROXY_URL to e.g. "
        "http://brd-customer-<id>-zone-<name>:<password>@brd.superproxy.io:33335"
    )
    return {"error": "not_configured", "message": msg}


# ---------------------------------------------------------------------------
# Disclaimer + session bootstrap
# ---------------------------------------------------------------------------

async def _accept_disclaimer(client: httpx.AsyncClient) -> None:
    """
    Accept the casesearch disclaimer.

    The site sets a session cookie on the disclaimer-acknowledgement POST
    that's required for subsequent searches. We send the standard form
    payload that the public site uses.
    """
    # Visit landing first so any pre-disclaimer cookies get set.
    await client.get(LANDING_URL)

    # The form action that JIS uses for disclaimer acknowledgement.
    payload = {
        "disclaimer": "Y",
        "action": "Disclaimer",
    }
    await client.post(DISCLAIMER_URL, data=payload)
    logger.debug("Disclaimer accepted (cookies: %s)", list(client.cookies.keys()))


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
    *owner_last_name* / *owner_first_name* is the defendant.

    Returns a list of case dicts. On failure, a single-element list with
    ``{"error": "<code>", "message": "<detail>"}``.
    """
    client = _build_client()
    if client is None:
        return [_not_configured()]

    logger.info(
        "CaseSearch owner | %s, %s %s | county=%r",
        owner_last_name, owner_first_name, owner_middle_initial, county,
    )
    async with client:
        try:
            return await _name_search(
                client,
                last_name=owner_last_name,
                first_name=owner_first_name,
                middle_initial=owner_middle_initial,
                county=county,
                role_filter="defendant",
            )
        except httpx.HTTPError as exc:
            logger.error("CaseSearch owner HTTP error: %s", exc)
            return [{"error": "http_error", "message": str(exc)}]
        except Exception as exc:
            logger.exception("CaseSearch owner unexpected error")
            return [{"error": "unexpected", "message": str(exc)}]


async def search_by_trustee(
    trustee_first: str,
    trustee_last: str,
    county: str,
) -> list[dict]:
    """Same shape as ``search_by_owner`` but filters for plaintiff role."""
    client = _build_client()
    if client is None:
        return [_not_configured()]

    logger.info(
        "CaseSearch trustee | %s, %s | county=%r",
        trustee_last, trustee_first, county,
    )
    async with client:
        try:
            return await _name_search(
                client,
                last_name=trustee_last,
                first_name=trustee_first,
                middle_initial="",
                county=county,
                role_filter="plaintiff",
            )
        except httpx.HTTPError as exc:
            logger.error("CaseSearch trustee HTTP error: %s", exc)
            return [{"error": "http_error", "message": str(exc)}]
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
    client = _build_client()
    if client is None:
        return _not_configured(form="dict")

    logger.info("CaseSearch docket | case=%r county=%r", case_number, county)
    async with client:
        try:
            return await _docket_search(client, case_number, county)
        except httpx.HTTPError as exc:
            logger.error("CaseSearch docket HTTP error: %s", exc)
            return {"error": "http_error", "message": str(exc)}
        except Exception as exc:
            logger.exception("CaseSearch docket unexpected error")
            return {"error": "unexpected", "message": str(exc)}


# ---------------------------------------------------------------------------
# Name-based search flow
# ---------------------------------------------------------------------------

async def _name_search(
    client: httpx.AsyncClient,
    last_name: str,
    first_name: str,
    middle_initial: str,
    county: str,
    role_filter: str,  # "plaintiff" | "defendant"
) -> list[dict]:
    await _accept_disclaimer(client)

    county_key = county.lower().replace(" county", "").strip()
    county_code = _COUNTY_CODES.get(county_key, "")

    # JIS form fields. ``site=00`` (all sites), ``courtSystem=B`` (Circuit).
    payload = {
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
        "action": "Search",
    }

    response = await client.post(SEARCH_URL, data=payload)
    response.raise_for_status()

    if _looks_blocked(response.text):
        return [{
            "error": "datadome_block",
            "message": (
                "Bright Data Web Unlocker did not bypass DataDome on this "
                "request. Verify the zone has DataDome handling enabled."
            ),
        }]

    rows = _parse_results_table(response.text)

    # Some result sets paginate. JIS pagination uses a 'd-... ' POST or a
    # GET on inquirySearch.jis with offset params. Follow up to 5 pages.
    page_num = 1
    while page_num < 5 and len(rows) < _TOO_MANY:
        next_url = _find_next_page(response.text, response.url)
        if not next_url:
            break
        page_num += 1
        response = await client.get(next_url)
        response.raise_for_status()
        more = _parse_results_table(response.text)
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

    # Filter chain
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

async def _docket_search(
    client: httpx.AsyncClient,
    case_number: str,
    county: str,
) -> dict:
    await _accept_disclaimer(client)

    payload = {
        "caseId": case_number,
        "action": "Search",
    }
    # Try the case-number search endpoint
    response = await client.post(CASE_NUM_URL, data=payload)
    response.raise_for_status()

    if _looks_blocked(response.text):
        return {
            "error": "datadome_block",
            "message": "Bright Data Web Unlocker did not bypass DataDome.",
        }

    soup = BeautifulSoup(response.text, "html.parser")

    # If we landed on a result list, follow the first link to the detail page.
    detail_link = None
    for a in soup.select("table a[href]"):
        href = a.get("href", "")
        if "inquiryDetail" in href or "Detail" in href or case_number in a.get_text(""):
            detail_link = href
            break
    if detail_link:
        detail_url = urljoin(str(response.url), detail_link)
        response = await client.get(detail_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

    return _parse_docket(soup, case_number, str(response.url))


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

def _parse_results_table(html: str) -> list[dict]:
    """Parse the JIS results table into a list of case dicts."""
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict] = []

    # Find the results table (contains a header row mentioning "Case Number")
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
            # Header row detection
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
            # Fall back to fixed column order
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
            continue  # likely a repeated header row

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


def _find_next_page(html: str, current_url) -> Optional[str]:
    """Locate a 'Next' / '>' pagination link if present."""
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a"):
        text = _ws(a.get_text(" ", strip=True)).lower()
        if text in ("next", ">", "next >"):
            href = a.get("href")
            if href:
                return urljoin(str(current_url), href)
    return None


def _parse_docket(soup: BeautifulSoup, case_number: str, source_url: str) -> dict:
    """Extract case metadata + docket entries from a detail page."""
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

    # Header label/value pairs
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

    # Parties
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

    # Docket entries — find the table with the most date-like first cells
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
    """Check whether the response looks like a DataDome challenge page."""
    lower = html.lower()
    if "geo.captcha-delivery.com" in lower:
        return True
    if "datadome" in lower:
        return True
    if "access is temporarily restricted" in lower:
        return True
    return False


def _ws(text: str) -> str:
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
        county = "Prince George's"

        print("\n=== Test 1: search_by_owner -- Sarah P. Moore, Prince George's ===\n")
        cases = await search_by_owner(
            owner_first_name="Sarah",
            owner_last_name="Moore",
            county=county,
            owner_middle_initial="P",
        )
        print(json.dumps(cases, indent=2))

        print("\n=== Test 2: get_case_docket -- C-16-CV-24-005892 ===\n")
        docket = await get_case_docket("C-16-CV-24-005892", county)
        print(json.dumps(docket, indent=2))

    asyncio.run(_main())
