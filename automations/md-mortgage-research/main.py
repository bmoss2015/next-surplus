"""
FastAPI application — Maryland Mortgage Foreclosure Surplus Research Agent.

Endpoints:
  GET  /health                   – liveness probe
  POST /research/maryland        – submit a lead; returns job_id immediately
  GET  /status/{job_id}          – poll research run status from Supabase
  POST /oauth/google/start        – start OAuth flow for Drive/Gmail
  POST /oauth/google/callback     – complete OAuth flow (handled client-side)

The research workflow runs in a FastAPI background task so the HTTP response
returns immediately with a job_id the caller can poll.
"""

import asyncio
import json
import logging
import os
import re
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title="MD Mortgage Surplus Verification Agent",
    description="Automates verification of Maryland foreclosure surplus funds.",
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class MarylandLeadRequest(BaseModel):
    property_address: str = Field(..., description="Full property address")
    county: str = Field(..., description="Maryland county name, e.g. \"Prince George's\"")
    owner_last_name: str
    owner_first_name: str
    owner_middle_initial: str = ""
    sale_type: str = Field("mortgage_foreclosure", description="Must be 'mortgage_foreclosure'")
    closing_bid: Optional[float] = Field(None, description="Foreclosure sale bid price in USD")
    sale_date_estimate: Optional[str] = Field(None, description="ISO date of estimated sale")
    owner_living: bool = Field(True, description="Is the former owner still living?")
    trustee_first: Optional[str] = None
    trustee_last: Optional[str] = None


class ResearchJobResponse(BaseModel):
    job_id: str
    status: str
    message: str


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# Research endpoint
# ---------------------------------------------------------------------------

@app.post("/research/maryland", response_model=ResearchJobResponse)
async def research_maryland(
    lead: MarylandLeadRequest,
    background_tasks: BackgroundTasks,
):
    """
    Submit a Maryland mortgage foreclosure lead for research.

    Returns a ``job_id`` immediately.  Poll ``GET /status/{job_id}`` for results.
    """
    if lead.sale_type != "mortgage_foreclosure":
        raise HTTPException(
            status_code=400,
            detail=(
                f"sale_type={lead.sale_type!r} is not supported. "
                "This agent handles 'mortgage_foreclosure' cases only. "
                "Maryland tax sale workflow is not implemented."
            ),
        )

    job_id = str(uuid.uuid4())
    background_tasks.add_task(_run_research_pipeline, job_id, lead)

    return ResearchJobResponse(
        job_id=job_id,
        status="queued",
        message="Research pipeline started. Poll /status/{job_id} for updates.",
    )


# ---------------------------------------------------------------------------
# Status endpoint
# ---------------------------------------------------------------------------

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Return the current status of a research run from Supabase."""
    try:
        from storage.supabase_client import get_supabase_client
        client = get_supabase_client()
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: client.table("research_runs").select("*").eq("id", job_id).execute(),
        )
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Status lookup failed for %s: %s", job_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# OAuth endpoints
# ---------------------------------------------------------------------------

@app.post("/oauth/google/start")
async def oauth_google_start():
    """
    Start the Google OAuth 2.0 flow.

    Returns an authorization URL the user opens in their browser. Google will
    redirect back to GET /oauth/google/callback with the authorization code.
    """
    try:
        from storage.google_drive import get_oauth_authorization_url
        auth_url, state = get_oauth_authorization_url()
        return {
            "authorization_url": auth_url,
            "instructions": "Open authorization_url in your browser and authorize access.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Test endpoints — synchronous component testing
# ---------------------------------------------------------------------------

class SDATTestRequest(BaseModel):
    property_address: str
    county: str


class LandRecordsTestRequest(BaseModel):
    owner_first_name: str
    owner_last_name: str
    county: str


class CaseSearchTestRequest(BaseModel):
    owner_first_name: str
    owner_last_name: str
    county: str


@app.post("/test/sdat")
async def test_sdat(req: SDATTestRequest):
    """Call search_sdat() synchronously and return the full result or error."""
    import traceback
    try:
        from scrapers.sdat import search_sdat
        result = await search_sdat(req.property_address, req.county)
        return {"ok": True, "result": result}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(exc), "traceback": traceback.format_exc()},
        )


@app.post("/test/land_records_search")
async def test_land_records_search(req: LandRecordsTestRequest):
    """Call search_grantor_index() synchronously and return instruments or error."""
    import traceback
    try:
        from scrapers.land_records import search_grantor_index
        instruments = await search_grantor_index(
            grantor_last=req.owner_last_name,
            grantor_first=req.owner_first_name,
            county=req.county,
        )
        return {"ok": True, "instruments": instruments, "count": len(instruments)}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(exc), "traceback": traceback.format_exc()},
        )


@app.post("/test/case_search_by_owner")
async def test_case_search_by_owner(req: CaseSearchTestRequest):
    """Call search_by_owner() synchronously and return cases or error."""
    import traceback
    try:
        from scrapers.case_search import search_by_owner
        cases = await search_by_owner(
            owner_first_name=req.owner_first_name,
            owner_last_name=req.owner_last_name,
            county=req.county,
        )
        return {"ok": True, "cases": cases, "count": len(cases)}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(exc), "traceback": traceback.format_exc()},
        )


@app.post("/test/save_lead")
async def test_save_lead(lead_data: dict):
    """Call create_lead() synchronously and return lead_id or error."""
    import traceback
    try:
        from storage.supabase_client import create_lead
        lead_id = await create_lead(lead_data)
        return {"ok": True, "lead_id": lead_id}
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(exc), "traceback": traceback.format_exc()},
        )


@app.get("/oauth/google/callback")
async def oauth_google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State token for CSRF verification"),
    error: Optional[str] = Query(None),
):
    """
    Google redirects here after the user authorizes (or denies) access.

    Exchanges the code for a refresh token and displays it on a simple page.
    Copy the refresh token and add it as GOOGLE_REFRESH_TOKEN in Railway.
    """
    if error:
        return HTMLResponse(
            f"<h2>Authorization denied</h2><p>Google returned error: <code>{error}</code></p>",
            status_code=400,
        )
    try:
        from storage.google_drive import complete_oauth_flow
        refresh_token = complete_oauth_flow(code=code, state=state)
        return HTMLResponse(f"""<!DOCTYPE html>
<html>
<head><title>OAuth Complete</title>
<style>body{{font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 20px}}
code{{background:#f4f4f4;padding:12px;display:block;word-break:break-all;border-radius:4px}}
</style></head>
<body>
<h2>Authorization successful</h2>
<p>Copy the refresh token below and add it to Railway as <strong>GOOGLE_REFRESH_TOKEN</strong>:</p>
<code>{refresh_token}</code>
<p>Once added, Google Drive and Gmail features will be active.</p>
</body></html>""")
    except ValueError as exc:
        return HTMLResponse(
            f"<h2>Invalid state</h2><p>{exc}</p><p>Please restart the OAuth flow.</p>",
            status_code=400,
        )
    except Exception as exc:
        logger.error("OAuth callback error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Research pipeline
# ---------------------------------------------------------------------------

async def _run_research_pipeline(job_id: str, lead: MarylandLeadRequest) -> None:
    """
    Full research workflow.  Runs in a background task.

    Steps:
      1  Upsert lead in Supabase; create research_run
      2  SDAT verification
      3  Land Records search
      4  Download PDFs
      5  Case search by owner (fall back to trustee)
      6  Get full case docket
      7  Parse all PDFs with Claude
      8  Calculate surplus estimate
      9  Apply decision logic
      10 Upload to Google Drive
      11 Draft missing-document emails
      12 Update Supabase with all findings
    """
    from storage import supabase_client as db

    lead_id: Optional[str] = None
    run_id: Optional[str] = None
    summary: dict = {}

    try:
        # ------------------------------------------------------------------
        # Step 1 – Supabase setup
        # ------------------------------------------------------------------
        existing = await db.get_lead_by_address(lead.property_address)
        if existing:
            lead_id = existing["id"]
            await db.update_lead(lead_id, {
                "owner_last_name": lead.owner_last_name,
                "owner_first_name": lead.owner_first_name,
                "county": lead.county,
            })
            logger.info("Updating existing lead %s", lead_id)
        else:
            lead_id = await db.create_lead({
                "property_address": lead.property_address,
                "county": lead.county,
                "owner_first_name": lead.owner_first_name,
                "owner_middle_initial": lead.owner_middle_initial,
                "owner_last_name": lead.owner_last_name,
                "sale_type": lead.sale_type,
                "closing_bid": lead.closing_bid,
                "status": "researching",
            })

        run_id = await db.create_research_run(lead_id, status="running", run_id=job_id)

        # ------------------------------------------------------------------
        # Step 2 – SDAT verification
        # ------------------------------------------------------------------
        logger.info("[%s] Running SDAT lookup", job_id)
        sdat_result = {}
        try:
            from scrapers.sdat import search_sdat
            sdat_result = await search_sdat(lead.property_address, lead.county)
            summary["sdat"] = sdat_result
        except Exception as exc:
            logger.warning("SDAT error (non-fatal): %s", exc)
            summary["sdat"] = {"error": str(exc)}

        current_owner = sdat_result.get("current_owner", "")
        sale_completed = bool(sdat_result.get("last_sale_date"))

        # ------------------------------------------------------------------
        # Step 3 – Land Records search (grantor index)
        # ------------------------------------------------------------------
        logger.info("[%s] Searching land records", job_id)
        instruments: list[dict] = []
        try:
            from scrapers.land_records import search_grantor_index
            instruments = await search_grantor_index(
                grantor_last=lead.owner_last_name,
                grantor_first=lead.owner_first_name,
                county=lead.county,
                date_range_start=lead.sale_date_estimate,
            )
            summary["instruments"] = instruments
        except Exception as exc:
            logger.warning("Land records error (non-fatal): %s", exc)
            summary["instruments"] = [{"error": str(exc)}]

        # ------------------------------------------------------------------
        # Step 4 – Download PDFs
        # ------------------------------------------------------------------
        logger.info("[%s] Downloading PDFs", job_id)
        downloaded_pdfs: dict[str, str] = {}  # label → local path
        tmpdir = tempfile.mkdtemp(prefix="md_research_")
        try:
            from scrapers.land_records import download_instrument_pdf
            relevant_types = ["deed of trust", "mortgage", "substitution", "trustee", "lien"]
            for inst in instruments:
                if isinstance(inst, dict) and "error" not in inst:
                    itype = inst.get("instrument_type", "").lower()
                    if any(t in itype for t in relevant_types):
                        book = inst.get("book", "")
                        page = inst.get("page", "")
                        if book and page:
                            fname = f"{itype.replace(' ', '_')}_{book}_{page}.pdf"
                            local = os.path.join(tmpdir, fname)
                            path = await download_instrument_pdf(book, page, lead.county, local)
                            if path:
                                downloaded_pdfs[fname] = path
        except Exception as exc:
            logger.warning("PDF download error (non-fatal): %s", exc)

        # ------------------------------------------------------------------
        # Step 5 – Case search
        # ------------------------------------------------------------------
        logger.info("[%s] Searching case records", job_id)
        foreclosure_cases: list[dict] = []
        try:
            from scrapers.case_search import search_by_owner, search_by_trustee
            cases = await search_by_owner(
                owner_first_name=lead.owner_first_name,
                owner_last_name=lead.owner_last_name,
                county=lead.county,
                owner_middle_initial=lead.owner_middle_initial,
                sale_date_estimate=lead.sale_date_estimate,
            )
            first = cases[0] if cases else {}
            if first.get("error") == "too_many_results":
                # Prefer trustee from request; otherwise extract from land records
                trustee_last = lead.trustee_last or ""
                trustee_first = lead.trustee_first or ""
                if not trustee_last and instruments:
                    trustee_last, trustee_first = _extract_trustee_from_instruments(instruments)
                if trustee_last:
                    logger.info(
                        "[%s] Too many owner results — falling back to trustee search: %s %s",
                        job_id, trustee_first, trustee_last,
                    )
                    cases = await search_by_trustee(
                        trustee_first=trustee_first,
                        trustee_last=trustee_last,
                        county=lead.county,
                    )
                else:
                    logger.warning("[%s] Too many owner results and no trustee found — cannot narrow search", job_id)
            foreclosure_cases = [c for c in cases if "error" not in c and "status" not in c]
            summary["cases"] = cases
        except Exception as exc:
            logger.warning("Case search error (non-fatal): %s", exc)
            summary["cases"] = [{"error": str(exc)}]

        # ------------------------------------------------------------------
        # Step 6 – Case docket
        # ------------------------------------------------------------------
        docket: dict = {}
        case_number = ""
        case_status = ""
        if foreclosure_cases:
            case_number = foreclosure_cases[0].get("case_number", "")
        if case_number:
            logger.info("[%s] Fetching docket for %s", job_id, case_number)
            try:
                from scrapers.case_search import get_case_docket
                docket = await get_case_docket(case_number, lead.county)
                case_status = docket.get("case_status", "")
                summary["docket"] = docket
            except Exception as exc:
                logger.warning("Docket fetch error (non-fatal): %s", exc)
                summary["docket"] = {"error": str(exc)}

        # ------------------------------------------------------------------
        # Step 7 – Parse PDFs with Claude
        # ------------------------------------------------------------------
        parsed_docs: dict[str, dict] = {}
        if downloaded_pdfs:
            logger.info("[%s] Parsing %d PDFs", job_id, len(downloaded_pdfs))
            from parsers.document_parser import parse_document
            for label, path in downloaded_pdfs.items():
                doc_type = _infer_doc_type(label)
                try:
                    parsed = await parse_document(path, doc_type)
                    parsed_docs[label] = parsed
                except Exception as exc:
                    logger.warning("Parse error for %s: %s", label, exc)
                    parsed_docs[label] = {"error": str(exc)}
            summary["parsed_docs"] = parsed_docs

        # ------------------------------------------------------------------
        # Step 8 – Surplus estimate
        # ------------------------------------------------------------------
        surplus = _calculate_surplus(lead, parsed_docs, instruments)
        summary["surplus_estimate"] = surplus

        # Persist any liens to Supabase
        for lien in surplus.get("identified_liens", []):
            try:
                await db.add_lien(lead_id, lien)
            except Exception:
                pass

        # ------------------------------------------------------------------
        # Step 9 – Decision logic
        # ------------------------------------------------------------------
        decision, decision_reason = _apply_decision_logic(
            surplus_amount=surplus.get("net_surplus", 0.0),
            owner_living=lead.owner_living,
            case_status=case_status,
        )
        summary["decision"] = decision
        summary["decision_reason"] = decision_reason
        recheck_date = None
        if decision == "HOLD" and "auditor" in decision_reason.lower():
            recheck_date = (datetime.now(timezone.utc) + timedelta(days=60)).date().isoformat()
            summary["recheck_date"] = recheck_date

        # ------------------------------------------------------------------
        # Step 10 – Google Drive upload
        # ------------------------------------------------------------------
        drive_folder_url = ""
        drive_urls: dict[str, str] = {}
        if downloaded_pdfs:
            logger.info("[%s] Uploading to Google Drive", job_id)
            try:
                from storage.google_drive import upload_lead_documents
                lead_folder_name = f"{lead.owner_last_name}_{lead.owner_first_name}{lead.owner_middle_initial}"
                drive_urls = upload_lead_documents(
                    state="Maryland",
                    county=lead.county,
                    lead_name=lead_folder_name,
                    files=list(downloaded_pdfs.values()),
                )
                summary["drive_urls"] = drive_urls
                if drive_urls:
                    drive_folder_url = list(drive_urls.values())[0].rsplit("/", 2)[0]
            except Exception as exc:
                logger.warning("Drive upload error (non-fatal): %s", exc)
                summary["drive_urls"] = {"error": str(exc)}

        # ------------------------------------------------------------------
        # Step 11 – Gmail drafts for missing documents
        # ------------------------------------------------------------------
        draft_urls: list[str] = []
        missing_docs = _identify_missing_docs(docket, parsed_docs)
        summary["missing_documents"] = missing_docs
        if missing_docs and case_number:
            logger.info("[%s] Creating Gmail drafts for %d missing docs", job_id, len(missing_docs))
            try:
                clerk_email = _get_clerk_email(lead.county)
                from storage.gmail_drafts import create_clerk_records_request
                court_name = f"Circuit Court for {lead.county} County"
                for doc_name in missing_docs:
                    url = create_clerk_records_request(
                        case_number=case_number,
                        court=court_name,
                        document_name=doc_name,
                        recipient_email=clerk_email,
                        lead_address=lead.property_address,
                    )
                    draft_urls.append(url)
                summary["draft_urls"] = draft_urls
            except Exception as exc:
                logger.warning("Gmail draft error (non-fatal): %s", exc)
                summary["draft_urls"] = [f"error: {exc}"]

        # ------------------------------------------------------------------
        # Step 12 – Final Supabase update
        # ------------------------------------------------------------------
        await db.update_lead(lead_id, {
            "status": decision.lower(),
            "estimated_surplus_low": surplus.get("net_surplus"),
            "decision": decision,
            "decision_reason": decision_reason,
            "drive_folder_url": drive_folder_url,
        })
        await db.complete_research_run(
            run_id=run_id,
            status="completed",
            summary=summary,
        )
        logger.info("[%s] Pipeline complete. Decision: %s", job_id, decision)

    except Exception as exc:
        logger.exception("[%s] Pipeline failed", job_id)
        if run_id:
            try:
                from storage import supabase_client as db2
                await db2.complete_research_run(
                    run_id=run_id,
                    status="failed",
                    summary=summary,
                    error=str(exc),
                )
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Surplus calculation
# ---------------------------------------------------------------------------

def _calculate_surplus(
    lead: MarylandLeadRequest,
    parsed_docs: dict,
    instruments: list[dict],
) -> dict:
    """
    Estimate net surplus using Maryland Rule 14-305 schedule.

    Formula:
      net_surplus = closing_bid
                    - trustee_commission (10% of closing_bid, MD Rule 14-305)
                    - attorney_fees (from auditor report or $5,000 estimate)
                    - mortgage_payoff (from deed of trust, accrued at 6% since note_date)
                    - all identified junior liens
    """
    closing_bid = lead.closing_bid or 0.0

    # Trustee commission: Maryland Rule 14-305 — 10% of gross proceeds
    trustee_commission = closing_bid * 0.10

    # Attorney fees from auditor report or default estimate
    attorney_fees = 5_000.0
    mortgage_payoff = 0.0
    identified_liens: list[dict] = []

    for label, doc in parsed_docs.items():
        if "error" in doc or "parse_error" in doc:
            continue

        doc_type = _infer_doc_type(label)

        if doc_type == "auditor_report":
            attorney_fees = _parse_amount(doc.get("attorney_fees", "")) or attorney_fees
            mortgage_payoff = _parse_amount(doc.get("mortgage_payoff", "")) or mortgage_payoff
            for lien in doc.get("junior_liens", []):
                amt = _parse_amount(lien.get("amount", ""))
                if amt:
                    identified_liens.append({
                        "lien_holder": lien.get("creditor", ""),
                        "lien_amount": amt,
                        "lien_type": lien.get("lien_type", "unknown"),
                        "recorded_date": "",
                        "debtor_name": f"{lead.owner_last_name}, {lead.owner_first_name}",
                    })

        elif doc_type == "deed_of_trust" and not mortgage_payoff:
            original = _parse_amount(doc.get("original_loan_amount", ""))
            note_date_str = doc.get("note_date", "")
            if original and note_date_str:
                mortgage_payoff = _accrue_mortgage(original, note_date_str)

        elif doc_type == "lien":
            amt = _parse_amount(doc.get("lien_amount", ""))
            if amt:
                identified_liens.append({
                    "lien_holder": doc.get("lien_holder", ""),
                    "lien_amount": amt,
                    "lien_type": doc.get("lien_type", "unknown"),
                    "recorded_date": doc.get("recorded_date", ""),
                    "debtor_name": doc.get("debtor_name", ""),
                })

    total_liens = sum(l["lien_amount"] for l in identified_liens)
    net_surplus = max(0.0, closing_bid - trustee_commission - attorney_fees - mortgage_payoff - total_liens)

    return {
        "closing_bid": closing_bid,
        "trustee_commission": trustee_commission,
        "attorney_fees": attorney_fees,
        "mortgage_payoff": mortgage_payoff,
        "total_junior_liens": total_liens,
        "net_surplus": round(net_surplus, 2),
        "identified_liens": identified_liens,
        "note": "Estimate only. Verify against filed Auditor's Report." if closing_bid else "No closing bid provided.",
    }


def _accrue_mortgage(principal: float, note_date_str: str, rate: float = 0.06) -> float:
    """Simple interest accrual at *rate* per annum from *note_date_str* to today."""
    try:
        from datetime import date
        for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
            try:
                note_date = datetime.strptime(note_date_str, fmt).date()
                break
            except ValueError:
                continue
        else:
            return principal
        years = (date.today() - note_date).days / 365.25
        return principal * (1 + rate * years)
    except Exception:
        return principal


# ---------------------------------------------------------------------------
# Decision logic
# ---------------------------------------------------------------------------

def _apply_decision_logic(
    surplus_amount: float,
    owner_living: bool,
    case_status: str,
) -> tuple[str, str]:
    """
    Apply Moss Equity decision rules.

    Returns:
        Tuple of (decision, reason) where decision is KEEP | HOLD | SKIP.
    """
    cs = case_status.lower()

    if "exception" in cs:
        return "SKIP", "Contested sale — exceptions filed"

    if "auditor" in cs and "pending" in cs:
        return "HOLD", "Auditor report not yet filed — recheck in 60 days"

    floor = 35_000 if owner_living else 50_000
    owner_type = "living owner" if owner_living else "estate"

    if surplus_amount <= 0:
        return "HOLD", "No closing bid provided — cannot estimate surplus"

    if surplus_amount < floor:
        return "SKIP", f"Surplus estimate ${surplus_amount:,.0f} is below ${floor:,} floor for {owner_type}"

    if "auditor" in cs and "filed" in cs:
        return "KEEP", f"Auditor report filed; estimated surplus ${surplus_amount:,.0f}"

    return "HOLD", f"Estimated surplus ${surplus_amount:,.0f} — awaiting final auditor report"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_trustee_from_instruments(instruments: list[dict]) -> tuple[str, str]:
    """
    Pull a trustee last/first name from land records instrument grantee fields.

    Prefers a Substitution of Trustee record (most specific), falls back to
    Deed of Trust grantee.  Returns (last, first) or ("", "").
    """
    sub_grantee = None
    dot_grantee = None
    for inst in instruments:
        if not isinstance(inst, dict) or "error" in inst:
            continue
        itype = inst.get("instrument_type", "").lower()
        grantee = (inst.get("grantee") or "").strip()
        if not grantee:
            continue
        if "substitut" in itype and not sub_grantee:
            sub_grantee = grantee
        elif ("deed of trust" in itype or "mortgage" in itype) and not dot_grantee:
            dot_grantee = grantee

    raw = sub_grantee or dot_grantee
    if not raw:
        return "", ""

    # Strip common role suffixes so they don't pollute the name
    cleaned = re.sub(r"\b(TRUSTEE|SUBSTITUTE|SUCCESSOR|TRUSTEES|TR)\b", "", raw, flags=re.IGNORECASE).strip(" ,")
    # Try "Last, First" comma form
    if "," in cleaned:
        parts = [p.strip() for p in cleaned.split(",", 1)]
        return parts[0], parts[1] if len(parts) > 1 else ""
    # Otherwise "First [Middle] Last"
    tokens = cleaned.split()
    if len(tokens) >= 2:
        return tokens[-1], tokens[0]
    return tokens[0] if tokens else "", ""


def _infer_doc_type(label: str) -> str:
    label_lower = label.lower()
    if "substitut" in label_lower:
        return "substitution_of_trustee"
    if "trustee" in label_lower and "deed" in label_lower:
        return "trustees_deed"
    if "deed_of_trust" in label_lower or "mortgage" in label_lower:
        return "deed_of_trust"
    if "lien" in label_lower or "judgment" in label_lower:
        return "lien"
    if "auditor" in label_lower:
        return "auditor_report"
    return "deed_of_trust"  # safe default


def _parse_amount(amount_str: str) -> float:
    """Parse a dollar string like '$125,000.00' into a float."""
    if not amount_str:
        return 0.0
    cleaned = re.sub(r"[^0-9.]", "", str(amount_str))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _identify_missing_docs(docket: dict, parsed_docs: dict) -> list[str]:
    """
    Compare docket entries against downloaded/parsed docs and flag gaps.

    Returns a list of document names we know exist in the docket but haven't
    been downloaded/parsed.
    """
    missing = []
    entries = docket.get("docket_entries", [])
    downloaded_types = set()
    for label in parsed_docs:
        downloaded_types.add(_infer_doc_type(label))

    want_types = {
        "auditor_report": "Auditor's Report",
        "substitution_of_trustee": "Substitution of Trustee",
        "trustees_deed": "Trustee's Deed",
    }
    for entry in entries:
        doc_name = entry.get("document_name", "").lower()
        for key, display in want_types.items():
            if key.replace("_", " ") in doc_name.replace("'", "") and key not in downloaded_types:
                if display not in missing:
                    missing.append(display)

    return missing


def _get_clerk_email(county: str) -> str:
    """Look up the circuit court clerk email for *county* from maryland_clerks.json."""
    try:
        config_path = os.path.join(os.path.dirname(__file__), "config", "maryland_clerks.json")
        with open(config_path) as f:
            data = json.load(f)
        county_key = county.replace("'", "").replace(".", "").replace(" ", "").replace("-", "")
        for key, info in data["counties"].items():
            if key.lower() == county_key.lower():
                return info.get("circuit_court_clerk_email", "")
    except Exception:
        pass
    return ""


