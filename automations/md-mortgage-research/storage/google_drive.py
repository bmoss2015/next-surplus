"""
Google Drive storage helper for uploading evidence packets.

Responsibilities (to be implemented):
    - Authenticate with Google Drive using a service account key (GOOGLE_SERVICE_ACCOUNT_JSON
      environment variable) and the google-api-python-client library.
    - For each completed pipeline run, create a folder structure under a configured
      root Drive folder: <County>/<Case Number>/<Run Date>/.
    - Upload raw scraped HTML/text files, downloaded PDFs, and a JSON summary of parsed
      results into the case folder.
    - Return shareable Drive links for each uploaded file, which are then stored in
      Supabase and included in Gmail drafts.

Folder structure (example):
    Moss Equity / MD Surplus / Baltimore City / C-03-CV-23-000123 / 2026-05-06 /
        sdat_record.json
        case_docket.json
        instruments.json
        summary.json
"""

from googleapiclient.discovery import Resource


def get_drive_service() -> Resource:
    """Build and return an authenticated Google Drive API service client."""
    raise NotImplementedError


async def upload_evidence_packet(case_number: str, county: str, files: dict[str, bytes]) -> dict[str, str]:
    """Upload all evidence files for a case and return a mapping of filename -> Drive URL."""
    raise NotImplementedError
