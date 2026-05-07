"""
Supabase client wrapper for the Maryland mortgage research pipeline.

Environment variables required:
  SUPABASE_URL              – project URL  (e.g. https://xyz.supabase.co)
  SUPABASE_PUBLISHABLE_KEY  – anon/public key
  SUPABASE_SECRET_KEY       – service-role key (used for all backend writes)

All public functions are async.  Blocking supabase-py calls are wrapped in
asyncio.run_in_executor so they can be awaited from FastAPI endpoints.

Expected Supabase tables
------------------------
leads
  id uuid PK, address text, county text, owner_last_name text,
  owner_first_name text, status text, sale_type text,
  surplus_estimate numeric, decision text, decision_reason text,
  drive_folder_url text, created_at timestamptz, updated_at timestamptz

liens
  id uuid PK, lead_id uuid FK→leads.id, lien_holder text,
  lien_amount numeric, lien_type text, recorded_date text,
  debtor_name text, created_at timestamptz

research_runs
  id uuid PK, lead_id uuid FK→leads.id, status text,
  summary jsonb, error text, started_at timestamptz, completed_at timestamptz
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_client = None  # module-level singleton


def get_supabase_client():
    """
    Return a Supabase client using the service-role key.

    The client is a module-level singleton.  Raises ``RuntimeError`` if the
    required environment variables are not set.
    """
    global _client
    if _client is not None:
        return _client

    from supabase import create_client, Client

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SECRET_KEY", "") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_PUBLISHABLE_KEY) "
            "must be set in environment variables."
        )

    _client = create_client(url, key)
    return _client


def _run(coro_or_fn):
    """Run a synchronous supabase-py call in a thread executor."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(None, coro_or_fn)


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

async def create_lead(lead_data: dict) -> str:
    """
    Insert a new lead record.

    Args:
        lead_data: Dict with at minimum ``address``, ``county``,
                   ``owner_last_name``, ``sale_type``.

    Returns:
        UUID string of the created lead.
    """
    client = get_supabase_client()
    payload = {
        "id": str(uuid.uuid4()),
        "created_at": _now(),
        "updated_at": _now(),
        "status": "new",
        **lead_data,
    }
    result = await _run(lambda: client.table("leads").insert(payload).execute())
    row = result.data[0] if result.data else payload
    logger.info("Created lead %s", row["id"])
    return row["id"]


async def update_lead(lead_id: str, updates: dict) -> dict:
    """Update an existing lead by ID and return the updated row."""
    client = get_supabase_client()
    updates["updated_at"] = _now()
    result = await _run(
        lambda: client.table("leads").update(updates).eq("id", lead_id).execute()
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
    Fetch a lead by normalized property address (for deduplication).

    Returns ``None`` if no match found.
    """
    client = get_supabase_client()
    normalized = address.strip().lower()
    result = await _run(
        lambda: client.table("leads")
            .select("*")
            .ilike("address", normalized)
            .limit(1)
            .execute()
    )
    return result.data[0] if result.data else None


async def list_leads(filters: Optional[dict] = None) -> list[dict]:
    """
    List leads, optionally filtered.

    Args:
        filters: Optional dict of column→value equality filters,
                 e.g. ``{"county": "Prince George's", "status": "active"}``.
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
        lien_data: Dict with ``lien_holder``, ``lien_amount``, ``lien_type``,
                   ``recorded_date``, ``debtor_name``.

    Returns:
        UUID string of the created lien record.
    """
    client = get_supabase_client()
    payload = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "created_at": _now(),
        **lien_data,
    }
    result = await _run(lambda: client.table("liens").insert(payload).execute())
    row = result.data[0] if result.data else payload
    logger.debug("Added lien %s for lead %s", row["id"], lead_id)
    return row["id"]


# ---------------------------------------------------------------------------
# Research runs
# ---------------------------------------------------------------------------

async def create_research_run(lead_id: str, status: str = "running") -> str:
    """
    Create a new research run record.

    Returns:
        UUID run_id string.
    """
    client = get_supabase_client()
    run_id = str(uuid.uuid4())
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
        summary: Dict of research findings to store as JSONB.
        error:   Optional error message if the run failed.
    """
    client = get_supabase_client()
    payload = {
        "status": status,
        "summary": summary,
        "completed_at": _now(),
    }
    if error:
        payload["error"] = error
    await _run(
        lambda: client.table("research_runs").update(payload).eq("id", run_id).execute()
    )
    logger.info("Completed research run %s with status=%s", run_id, status)


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
