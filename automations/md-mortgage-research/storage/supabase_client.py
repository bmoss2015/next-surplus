"""
Supabase client wrapper for the Maryland mortgage research pipeline.

Environment variables required:
  SUPABASE_URL          – project URL  (e.g. https://xyz.supabase.co)
  SUPABASE_SECRET_KEY   – service-role key (not anon)

All public functions are async.  Blocking supabase-py calls are wrapped in
asyncio.run_in_executor so they can be awaited from FastAPI endpoints.

Actual Supabase schema
----------------------
leads
  id, created_at, updated_at, source, external_id,
  property_address, property_city, property_state, property_zip,
  county, owner_first_name, owner_middle_initial, owner_last_name,
  owner_full_name, owner_deceased, sale_type, sale_date,
  opening_bid, closing_bid, case_number, case_status, case_filed_date,
  trustee_names, lender_name, original_mortgage_amount,
  estimated_mortgage_payoff, estimated_surplus_low, estimated_surplus_high,
  confirmed_surplus, status, decision, decision_reason,
  drive_folder_url, notes

liens
  id, lead_id, created_at, lien_type, lien_holder, lien_amount,
  recorded_date, document_url

research_runs
  id, lead_id, started_at, completed_at, status, error_message, output_summary
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_client = None  # module-level singleton

# Valid columns per table — used to strip unknown fields before inserts/updates
_LEAD_COLUMNS = {
    "id", "created_at", "updated_at", "source", "external_id",
    "property_address", "property_city", "property_state", "property_zip",
    "county", "owner_first_name", "owner_middle_initial", "owner_last_name",
    "owner_full_name", "owner_deceased", "sale_type", "sale_date",
    "opening_bid", "closing_bid", "case_number", "case_status", "case_filed_date",
    "trustee_names", "lender_name", "original_mortgage_amount",
    "estimated_mortgage_payoff", "estimated_surplus_low", "estimated_surplus_high",
    "confirmed_surplus", "status", "decision", "decision_reason",
    "drive_folder_url", "notes",
}

_LIEN_COLUMNS = {
    "id", "lead_id", "created_at",
    "lien_type", "lien_holder", "lien_amount", "recorded_date", "document_url",
}

_RUN_COLUMNS = {
    "id", "lead_id", "started_at", "completed_at",
    "status", "error_message", "output_summary",
}


def get_supabase_client():
    """
    Return a Supabase client using the service-role key.

    The client is a module-level singleton.  Raises ``RuntimeError`` if the
    required environment variables are not set.
    """
    global _client
    if _client is not None:
        return _client

    from supabase import create_client

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SECRET_KEY", "") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SECRET_KEY must be set in environment variables."
        )

    _client = create_client(url, key)
    return _client


def _run(coro_or_fn):
    """Run a synchronous supabase-py call in a thread executor."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(None, coro_or_fn)


def _filter(data: dict, allowed: set) -> dict:
    """Strip keys not in the table schema to prevent insert/update errors."""
    return {k: v for k, v in data.items() if k in allowed}


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

async def create_lead(lead_data: dict) -> str:
    """
    Insert a new lead record.

    Args:
        lead_data: Dict using actual column names from the leads schema.
                   Must include at minimum ``property_address``.

    Returns:
        UUID string of the created lead.
    """
    client = get_supabase_client()
    payload = _filter({
        "id": str(uuid.uuid4()),
        "created_at": _now(),
        "updated_at": _now(),
        "status": "new",
        **lead_data,
    }, _LEAD_COLUMNS)
    result = await _run(lambda: client.table("leads").insert(payload).execute())
    row = result.data[0] if result.data else payload
    logger.info("Created lead %s", row["id"])
    return row["id"]


async def update_lead(lead_id: str, updates: dict) -> dict:
    """Update an existing lead by ID and return the updated row."""
    client = get_supabase_client()
    updates["updated_at"] = _now()
    payload = _filter(updates, _LEAD_COLUMNS)
    result = await _run(
        lambda: client.table("leads").update(payload).eq("id", lead_id).execute()
    )
    row = result.data[0] if result.data else {}
    logger.debug("Updated lead %s", lead_id)
    return row


async def get_lead(lead_id: str) -> dict:
    """Fetch a lead by ID."""
    client = get_supabase_client()
    result = await _run(
        lambda: client.table("leads").select("*").eq("id", lead_id).execute()
    )
    return result.data[0] if result.data else {}


async def get_lead_by_address(address: str) -> Optional[dict]:
    """
    Fetch a lead by property_address (for deduplication).

    Returns ``None`` if no match found.
    """
    client = get_supabase_client()
    normalized = address.strip().lower()
    result = await _run(
        lambda: client.table("leads")
            .select("*")
            .ilike("property_address", normalized)
            .limit(1)
            .execute()
    )
    return result.data[0] if result.data else None


async def list_leads(filters: Optional[dict] = None) -> list[dict]:
    """
    List leads, optionally filtered by column equality.

    Args:
        filters: Optional dict of column→value equality filters.
    """
    client = get_supabase_client()

    def _query():
        q = client.table("leads").select("*")
        if filters:
            for col, val in filters.items():
                q = q.eq(col, val)
        return q.order("created_at", desc=True).execute()

    result = await _run(_query)
    return result.data or []


# ---------------------------------------------------------------------------
# Liens
# ---------------------------------------------------------------------------

async def add_lien(lead_id: str, lien_data: dict) -> str:
    """
    Insert a lien record associated with a lead.

    Args:
        lead_id:   UUID of the parent lead.
        lien_data: Dict with lien fields. Unknown keys are silently dropped.

    Returns:
        UUID string of the created lien record.
    """
    client = get_supabase_client()
    payload = _filter({
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "created_at": _now(),
        **lien_data,
    }, _LIEN_COLUMNS)
    result = await _run(lambda: client.table("liens").insert(payload).execute())
    row = result.data[0] if result.data else payload
    logger.debug("Added lien %s for lead %s", row["id"], lead_id)
    return row["id"]


# ---------------------------------------------------------------------------
# Research runs
# ---------------------------------------------------------------------------

async def create_research_run(
    lead_id: str,
    status: str = "running",
    run_id: Optional[str] = None,
) -> str:
    """
    Create a new research run record.

    Args:
        lead_id: UUID of the parent lead.
        status:  Initial status string.
        run_id:  Optional explicit UUID; generated if not provided.
                 Pass the API job_id here so GET /status/{job_id} resolves correctly.

    Returns:
        The run_id used.
    """
    client = get_supabase_client()
    run_id = run_id or str(uuid.uuid4())
    payload = {
        "id": run_id,
        "lead_id": lead_id,
        "status": status,
        "started_at": _now(),
    }
    await _run(lambda: client.table("research_runs").insert(payload).execute())
    logger.info("Created research run %s for lead %s", run_id, lead_id)
    return run_id


async def complete_research_run(
    run_id: str,
    status: str,
    summary: dict,
    error: Optional[str] = None,
) -> None:
    """
    Mark a research run as complete (or failed).

    Args:
        run_id:  UUID of the run to update.
        status:  Final status string, e.g. ``"completed"`` or ``"failed"``.
        summary: Dict of research findings stored in output_summary (JSONB).
        error:   Optional error message stored in error_message.
    """
    client = get_supabase_client()
    payload: dict = {
        "status": status,
        "output_summary": summary,
        "completed_at": _now(),
    }
    if error:
        payload["error_message"] = error
    await _run(
        lambda: client.table("research_runs").update(payload).eq("id", run_id).execute()
    )
    logger.info("Completed research run %s with status=%s", run_id, status)


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
