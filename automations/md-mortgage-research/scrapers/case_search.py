"""
Client for the Maryland Judiciary **Case Portal** JSON API
(the React SPA at https://casesearch.courts.state.md.us/casesearch/).

The legacy ``*.jis`` HTML pages were replaced by a single-page app that talks
to a small REST API. We use two **public** (no-auth) endpoints:

  * ``GET  /api-casedetails/v1/public/cases/{caseNumber}`` -- full case detail
    (parties, attorneys, judgment events, the docket as ``caseEventInfo``).
  * ``POST /api-caselist/v1/cases``                        -- name/party search;
    returns an array of case summaries.

Both sit behind **DataDome**, so a plain HTTP client gets a ``403`` with a
``geo.captcha-delivery.com`` redirect. We route every request through a
scraping API that solves DataDome at the proxy layer. Providers, in priority
order:

  1. **Scrape.do** (preferred) -- ``GET https://api.scrape.do/?token=KEY&url=ENCODED&super=true``.
     ``render`` is *not* used: these are JSON endpoints, no headless browser
     needed -- ``super=true`` (residential proxy) is what carries the DataDome
     cookie. Set ``SCRAPEDO_API_KEY``.
  2. **Bright Data Web Unlocker** (fallback) -- ``https://api.brightdata.com/request``.
     Set ``BRIGHTDATA_API_KEY`` (+ optional ``BRIGHTDATA_ZONE``).

If neither is configured, the public functions return ``error="not_configured"``.

There are ``/secure/...`` mirrors of both endpoints that expose restricted case
types, but they require an Azure AD / MSAL bearer token (tenant
``mdcourtsbusprod``) obtained via interactive login, so we don't use them.

Public API (unchanged across the HTML->JSON rewrite):
  search_by_owner   - foreclosure cases where the homeowner is the defendant
  search_by_trustee - foreclosure cases where a named trustee is the plaintiff
  get_case_docket   - full docket entries for a known case number
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Optional
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

CASE_PORTAL_ORIGIN = "https://casesearch.courts.state.md.us"
CASE_DETAIL_PATH = "/api-casedetails/v1/public/cases/{case_number}"
CASE_LIST_PATH = "/api-caselist/v1/cases"

BRIGHTDATA_API_URL = "https://api.brightdata.com/request"
SCRAPEDO_API_URL = "https://api.scrape.do/"

# Patterns that identify a foreclosure / mortgage-surplus case type
_FORECLOSURE_RE = re.compile(
    r"foreclos|mortgage|foreclsr|mortg\b|right of redemption",
    re.IGNORECASE,
)

# Above this, a name search is too broad to be useful -- caller should add a
# middle initial or switch to a trustee search.
_TOO_MANY = 50


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class CaseSearchError(RuntimeError):
    """A request reached the provider but the response was unusable
    (DataDome block leaked through, non-JSON body, ...)."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")


class ScrapingPolicyBlock(RuntimeError):
    """The scraping provider refused the request (bad token, no credits,
    .gov policy refusal, ...)."""
    def __init__(self, target_url: str, provider: str, error: str):
        self.target_url = target_url
        self.provider = provider
        self.error = error
        super().__init__(f"{provider} refused {target_url}: {error}")


# ---------------------------------------------------------------------------
# Scraping-API plumbing (Scrape.do preferred; Bright Data fallback)
# ---------------------------------------------------------------------------

def _scrapedo_key() -> Optional[str]:
    return os.environ.get("SCRAPEDO_API_KEY", "").strip() or None


def _brightdata_key() -> Optional[str]:
    return os.environ.get("BRIGHTDATA_API_KEY", "").strip() or None


def _brightdata_zone() -> str:
    return os.environ.get("BRIGHTDATA_ZONE", "web_unlocker_md").strip() or "web_unlocker_md"


def _provider() -> str:
    """Which scraping API will be used. Scrape.do preferred when both set."""
    if _scrapedo_key():
        return "scrapedo"
    if _brightdata_key():
        return "brightdata"
    return "none"


def _not_configured() -> dict:
    return {
        "error": "not_configured",
        "message": (
            "Neither SCRAPEDO_API_KEY nor BRIGHTDATA_API_KEY is set. "
            "The Maryland Case Portal API is behind DataDome and requires a "
            "scraping API. Recommended: set SCRAPEDO_API_KEY (super=true "
            "residential proxy; no render needed for the JSON endpoints)."
        ),
    }


async def _scrapedo_get(
    target_url: str,
    method: str = "GET",
    json_body: Optional[dict] = None,
) -> str:
    """Fetch ``target_url`` through Scrape.do's residential ("super") proxy.

    No ``render``: the Case Portal endpoints are JSON APIs, so a headless
    browser is unnecessary -- ``super=true`` is what supplies the DataDome
    cookie. Scrape.do passes the *target* status code through, so 4xx here is
    usually the upstream API's own error envelope (e.g. "case not found") --
    we return the body and let the caller parse it. Only a Scrape.do-level
    auth/credit failure (401) is raised as a policy block.
    """
    api_key = _scrapedo_key()
    if not api_key:
        raise RuntimeError("SCRAPEDO_API_KEY not set")

    params = {"token": api_key, "url": target_url, "super": "true"}
    logger.debug("Scrape.do %s %s", method, target_url)
    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as client:
        if method.upper() == "POST":
            response = await client.post(SCRAPEDO_API_URL, params=params, json=json_body)
        else:
            response = await client.get(SCRAPEDO_API_URL, params=params)

    if response.status_code == 401:
        body = response.text[:300]
        logger.error("Scrape.do auth/credit failure (%s): %s", response.status_code, body)
        raise ScrapingPolicyBlock(target_url, "Scrape.do", body or "HTTP 401")
    if response.status_code >= 500:
        logger.error("Scrape.do HTTP %s for %s: %s",
                     response.status_code, target_url, response.text[:300])
        response.raise_for_status()
    return response.text


async def _bd_get(
    target_url: str,
    method: str = "GET",
    json_body: Optional[dict] = None,
) -> str:
    """Fetch via Bright Data Web Unlocker (Direct API). Bright Data wraps the
    upstream response in its own HTTP 200; the real outcome is in the
    ``x-brd-*`` headers, which we inspect to raise on policy refusals."""
    api_key = _brightdata_key()
    if not api_key:
        raise RuntimeError("BRIGHTDATA_API_KEY not set")

    body: dict[str, Any] = {"zone": _brightdata_zone(), "url": target_url, "format": "raw"}
    if method.upper() == "POST":
        body["method"] = "POST"
        if json_body is not None:
            body["data"] = json.dumps(json_body)
            body["headers"] = {"content-type": "application/json"}
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    logger.debug("Bright Data %s %s", method, target_url)
    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as client:
        response = await client.post(BRIGHTDATA_API_URL, headers=headers, json=body)
        response.raise_for_status()

    brd_err = response.headers.get("x-brd-error", "").strip()
    brd_status = response.headers.get("x-brd-status-code", "").strip()
    # 4xx from the upstream API is legitimate (error envelope); only treat
    # provider errors / non-4xx upstream failures as a policy block.
    if brd_err or (brd_status and not brd_status.startswith("2") and not brd_status.startswith("4")):
        logger.error("Bright Data refused %s | x-brd-status=%s | x-brd-error=%s",
                     target_url, brd_status or "?", brd_err or "(none)")
        raise ScrapingPolicyBlock(target_url, "Bright Data", brd_err or f"upstream status {brd_status}")
    return response.text


async def _fetch(
    target_url: str,
    *,
    method: str = "GET",
    json_body: Optional[dict] = None,
) -> str:
    """Dispatch to the configured scraping provider (Scrape.do first)."""
    provider = _provider()
    if provider == "scrapedo":
        return await _scrapedo_get(target_url, method, json_body)
    if provider == "brightdata":
        return await _bd_get(target_url, method, json_body)
    raise RuntimeError("No scraping provider configured (set SCRAPEDO_API_KEY)")


async def _fetch_json(
    target_url: str,
    *,
    method: str = "GET",
    json_body: Optional[dict] = None,
) -> Any:
    """``_fetch`` + JSON parse, with DataDome-leak detection."""
    raw = await _fetch(target_url, method=method, json_body=json_body)
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        if _looks_blocked(raw):
            raise CaseSearchError(
                "datadome_block",
                f"{_provider()} did not get past DataDome (HTML challenge returned).",
            )
        raise CaseSearchError("bad_response", f"Non-JSON response: {raw[:200]}")
    # DataDome sometimes answers an API call with a JSON {"url": "https://geo.captcha-delivery.com/..."}
    if isinstance(data, dict) and isinstance(data.get("url"), str) and "captcha-delivery" in data["url"]:
        raise CaseSearchError(
            "datadome_block",
            f"{_provider()} did not get past DataDome (captcha redirect returned).",
        )
    return data


def _looks_blocked(text: str) -> bool:
    low = text.lower()
    return (
        "captcha-delivery.com" in low
        or "datadome" in low
        or "access is temporarily restricted" in low
    )


def _is_api_error_envelope(data: Any) -> bool:
    """The Case Portal API returns ``{timestamp, errorID, code, status:"FAILURE",
    level, error}`` for both real errors and "nothing matched"."""
    return (
        isinstance(data, dict)
        and (data.get("status") == "FAILURE" or "errorID" in data)
        and "error" in data
    )


# ---------------------------------------------------------------------------
# County name handling
# ---------------------------------------------------------------------------

def _county_display_name(county: str) -> str:
    """The ``/api-caselist`` search filter wants the descriptive jurisdiction
    name in upper case, e.g. ``"PRINCE GEORGE'S COUNTY"`` or ``"BALTIMORE CITY"``
    (a bare ``"PRINCE GEORGE'S"`` is rejected). Best-effort normalisation; if it
    turns out the API doesn't recognise it, ``_name_search`` retries unfiltered.
    """
    c = (county or "").strip()
    if not c:
        return ""
    if "city" in c.lower():               # "Baltimore City"
        return c.upper()
    base = re.sub(r"\s+county$", "", c, flags=re.IGNORECASE).strip()
    return f"{base.upper()} COUNTY"


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
    Foreclosure cases where *owner_last_name* / *owner_first_name* is the
    defendant. Returns a list of case dicts; on failure a single-element list
    with ``{"error": "<code>", "message": "<detail>"}``.
    """
    if _provider() == "none":
        return [_not_configured()]

    logger.info("CaseSearch owner | %s, %s %s | county=%r",
                owner_last_name, owner_first_name, owner_middle_initial, county)
    try:
        return await _name_search(
            last_name=owner_last_name,
            first_name=owner_first_name,
            middle_initial=owner_middle_initial,
            county=county,
            role_filter="defendant",
        )
    except CaseSearchError as exc:
        return [{"error": exc.code, "message": exc.message}]
    except ScrapingPolicyBlock as exc:
        return [{"error": "scraping_policy_block",
                 "message": f"{exc.provider} refused the request: {exc.error}"}]
    except httpx.HTTPStatusError as exc:
        provider = _provider()
        logger.error("CaseSearch owner %s HTTP %s: %s",
                     provider, exc.response.status_code, exc.response.text[:300])
        return [{"error": f"{provider}_error",
                 "message": f"{provider} returned HTTP {exc.response.status_code}"}]
    except Exception as exc:
        logger.exception("CaseSearch owner unexpected error")
        return [{"error": "unexpected", "message": str(exc)}]


async def search_by_trustee(
    trustee_first: str,
    trustee_last: str,
    county: str,
) -> list[dict]:
    """Same shape as ``search_by_owner`` but filters for the plaintiff role."""
    if _provider() == "none":
        return [_not_configured()]

    logger.info("CaseSearch trustee | %s, %s | county=%r", trustee_last, trustee_first, county)
    try:
        return await _name_search(
            last_name=trustee_last,
            first_name=trustee_first,
            middle_initial="",
            county=county,
            role_filter="plaintiff",
        )
    except CaseSearchError as exc:
        return [{"error": exc.code, "message": exc.message}]
    except ScrapingPolicyBlock as exc:
        return [{"error": "scraping_policy_block",
                 "message": f"{exc.provider} refused the request: {exc.error}"}]
    except httpx.HTTPStatusError as exc:
        provider = _provider()
        logger.error("CaseSearch trustee %s HTTP %s: %s",
                     provider, exc.response.status_code, exc.response.text[:300])
        return [{"error": f"{provider}_error",
                 "message": f"{provider} returned HTTP {exc.response.status_code}"}]
    except Exception as exc:
        logger.exception("CaseSearch trustee unexpected error")
        return [{"error": "unexpected", "message": str(exc)}]


async def get_case_docket(case_number: str, county: str) -> dict:
    """
    Full docket for a known case number. ``county`` is accepted for signature
    compatibility but isn't needed -- the case-detail endpoint keys off the
    case number alone.

    Returns ``{"case_number", "case_title", "filing_date", "case_status",
    "case_status_date", "case_type", "court", "parties", "docket_entries",
    "source_url"}`` or ``{"error", "message"}``.
    """
    if _provider() == "none":
        return _not_configured()

    logger.info("CaseSearch docket | case=%r", case_number)
    try:
        return await _docket_lookup(case_number)
    except CaseSearchError as exc:
        return {"error": exc.code, "message": exc.message}
    except ScrapingPolicyBlock as exc:
        return {"error": "scraping_policy_block",
                "message": f"{exc.provider} refused the request: {exc.error}"}
    except httpx.HTTPStatusError as exc:
        provider = _provider()
        logger.error("CaseSearch docket %s HTTP %s: %s",
                     provider, exc.response.status_code, exc.response.text[:300])
        return {"error": f"{provider}_error",
                "message": f"{provider} returned HTTP {exc.response.status_code}"}
    except Exception as exc:
        logger.exception("CaseSearch docket unexpected error")
        return {"error": "unexpected", "message": str(exc)}


# ---------------------------------------------------------------------------
# Name search  ->  POST /api-caselist/v1/cases
# ---------------------------------------------------------------------------

async def _name_search(
    last_name: str,
    first_name: str,
    middle_initial: str,
    county: str,
    role_filter: str,  # "plaintiff" | "defendant"
) -> list[dict]:
    url = CASE_PORTAL_ORIGIN + CASE_LIST_PATH
    base_body = {
        "searchPartyType": "Person",
        "lastName": last_name,
        "firstName": first_name or "",
        "middleName": (middle_initial or "")[:1],
        "businessName": "",
    }
    county_name = _county_display_name(county)

    # Attempt with the county filter first (keeps the result set small); if the
    # API rejects the county string, retry unfiltered and filter client-side.
    attempts: list[dict] = []
    if county_name:
        attempts.append({**base_body, "county": county_name})
    attempts.append(base_body)

    rows_raw: Optional[list] = None
    last_envelope_msg = ""
    for body in attempts:
        data = await _fetch_json(url, method="POST", json_body=body)
        if isinstance(data, list):
            rows_raw = data
            break
        if _is_api_error_envelope(data):
            last_envelope_msg = str(data.get("error") or "")
            continue
        raise CaseSearchError("bad_response", f"Unexpected search response: {str(data)[:200]}")

    if rows_raw is None:
        # Every attempt returned the API's failure envelope. That same message
        # is what the API returns when nothing matches, so treat it as no match.
        return [{"status": "no_owner_match",
                 "message": last_envelope_msg or "No cases found for this name"}]

    rows = [_map_search_row(r) for r in rows_raw if isinstance(r, dict)]
    if not rows:
        return [{"status": "no_owner_match", "message": "No cases found for this name"}]

    if len(rows) >= _TOO_MANY:
        return [{
            "error": "too_many_results",
            "message": (f"Search returned {len(rows)}+ results. "
                        "Provide a middle initial or switch to trustee search."),
        }]

    foreclosure_rows = [r for r in rows if _is_foreclosure(r)]
    county_rows = [r for r in foreclosure_rows if _county_matches(r, county)] or foreclosure_rows
    if not county_rows:
        return [{"status": "no_owner_match", "message": "No foreclosure cases found"}]

    role_rows = _filter_by_role(county_rows, role_filter)
    result_rows = role_rows or county_rows
    result_rows.sort(key=lambda r: _parse_date(r.get("filing_date", "")), reverse=True)
    return result_rows


def _map_search_row(r: dict) -> dict:
    return {
        "case_number": (r.get("caseNumber") or "").strip(),
        "case_title": (r.get("title") or "").strip(),
        "filing_date": (r.get("filingDate") or "").strip(),
        "case_type": (r.get("caseType") or "").strip(),
        "case_status": (r.get("caseStatus") or "").strip(),
        "court": (r.get("locationName") or "").strip(),
        "party_name": (r.get("fullName") or "").strip(),
        "party_role": (r.get("partyTypeDisplay") or "").strip(),
        "date_of_birth": r.get("dateOfBirthStr") or "",
    }


# ---------------------------------------------------------------------------
# Docket lookup  ->  GET /api-casedetails/v1/public/cases/{caseNumber}
# ---------------------------------------------------------------------------

async def _docket_lookup(case_number: str) -> dict:
    url = CASE_PORTAL_ORIGIN + CASE_DETAIL_PATH.format(case_number=quote(case_number.strip(), safe=""))
    data = await _fetch_json(url)

    if _is_api_error_envelope(data):
        return {"error": "case_not_found",
                "message": str(data.get("error") or "Case not found or access restricted."),
                "source_url": url}

    detail = (data or {}).get("caseDetail") if isinstance(data, dict) else None
    if not detail:
        return {"error": "parse_failed",
                "message": "Response contained no caseDetail object.",
                "source_url": url}
    return _map_case_detail(detail, case_number, url)


def _map_case_detail(detail: dict, case_number: str, source_url: str) -> dict:
    status = detail.get("caseStatus") or {}
    court = detail.get("court") or {}

    parties: list[dict] = []
    for p in detail.get("involvedParties") or []:
        name = (p.get("partyName") or "").strip()
        if name:
            parties.append({"name": name, "role": (p.get("partyType") or "").strip()})
    for d in detail.get("defendentInfo") or []:   # note: API spells it "defendent"
        name = (d.get("defendantName") or "").strip()
        if name and not any(pp["name"] == name for pp in parties):
            parties.append({"name": name, "role": "Defendant"})

    docket_entries: list[dict] = []
    for e in detail.get("caseEventInfo") or []:
        docket_entries.append({
            "date": (e.get("fileDate") or "").strip(),
            "document_name": (e.get("documentName") or e.get("comment") or "").strip(),
            "comment": (e.get("comment") or "").strip(),
            "event_id": e.get("internalEventID"),
            "has_documents": bool(e.get("eventDocuments")),
        })

    return {
        "case_number": (detail.get("caseNumber") or case_number or "").strip(),
        "case_title": (detail.get("caseTitle") or "").strip(),
        "filing_date": (detail.get("filedDate") or "").strip(),
        "case_status": (status.get("caseStatusType") or "").strip(),
        "case_status_date": (status.get("date") or "").strip(),
        "case_type": (detail.get("caseType") or "").strip(),
        "court": (court.get("courtName") or detail.get("courtSystem") or "").strip(),
        "parties": parties,
        "docket_entries": docket_entries,
        "source_url": source_url,
    }


# ---------------------------------------------------------------------------
# Filtering helpers
# ---------------------------------------------------------------------------

def _is_foreclosure(row: dict) -> bool:
    combined = f"{row.get('case_type', '')} {row.get('case_title', '')}"
    return bool(_FORECLOSURE_RE.search(combined))


def _county_matches(row: dict, county: str) -> bool:
    county_key = county.lower().replace(" county", "").strip()
    court_lower = row.get("court", "").lower()
    return not court_lower or county_key in court_lower


def _filter_by_role(rows: list[dict], role: str) -> list[dict]:
    want = "defendant" if role == "defendant" else "plaintiff"
    return [r for r in rows if r.get("party_role", "").lower() == want]


def _parse_date(date_str: str) -> datetime:
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.min


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

    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    async def _main() -> None:
        print("\n=== Test 1: get_case_docket -- C-16-CV-24-005892 ===\n")
        docket = await get_case_docket("C-16-CV-24-005892", "Prince George's")
        print(_json.dumps(docket, indent=2, default=str))

        print("\n=== Test 2: search_by_owner -- Moore, Sarah, Prince George's ===\n")
        cases = await search_by_owner(
            owner_first_name="Sarah",
            owner_last_name="Moore",
            county="Prince George's",
        )
        print(_json.dumps(cases, indent=2, default=str))

    asyncio.run(_main())
