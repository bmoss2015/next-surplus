"""
FastAPI application entry point for the Maryland mortgage foreclosure surplus verification agent.

This service exposes webhook endpoints that trigger the research pipeline. When called,
it orchestrates scraping of Maryland public records (SDAT, case search, land records),
parsing of retrieved documents via Claude, persisting results to Supabase, uploading
evidence packets to Google Drive, and drafting summary emails via Gmail.

Endpoints (to be implemented):
    POST /webhook/trigger   - Accepts a property address or case number and kicks off
                              the full verification pipeline asynchronously.
    GET  /health            - Liveness probe used by Railway.
    GET  /status/{job_id}   - Returns the current status of an in-flight pipeline run.
"""

from fastapi import FastAPI

app = FastAPI(
    title="MD Mortgage Surplus Verification Agent",
    description="Automates verification of Maryland foreclosure surplus funds.",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {"status": "ok"}
