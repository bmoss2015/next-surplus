"""
Supabase client wrapper for persisting pipeline results.

Responsibilities (to be implemented):
    - Initialize the Supabase Python client using SUPABASE_URL and SUPABASE_KEY from
      environment variables.
    - Provide async helper functions to upsert property records, case records, lien
      records, and pipeline run audit logs into the appropriate Supabase tables.
    - Support idempotent upserts keyed on case number + instrument type so that
      re-running the pipeline on the same case does not create duplicate rows.
    - Expose a simple query interface used by the FastAPI status endpoint to retrieve
      current pipeline run state.

Tables (to be created in Supabase separately):
    properties, cases, instruments, pipeline_runs
"""

from supabase import AsyncClient, acreate_client


async def get_client() -> AsyncClient:
    """Return an authenticated Supabase async client."""
    raise NotImplementedError


async def upsert_case(case_data: dict) -> dict:
    """Upsert a foreclosure case record and return the saved row."""
    raise NotImplementedError


async def upsert_instrument(instrument_data: dict) -> dict:
    """Upsert a land record instrument and return the saved row."""
    raise NotImplementedError


async def log_pipeline_run(run_data: dict) -> dict:
    """Insert a pipeline run audit record."""
    raise NotImplementedError
