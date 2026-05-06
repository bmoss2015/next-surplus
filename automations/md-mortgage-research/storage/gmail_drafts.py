"""
Gmail draft creator for surplus verification outreach.

Responsibilities (to be implemented):
    - Authenticate with the Gmail API using OAuth2 credentials stored in environment
      variables (GMAIL_CREDENTIALS_JSON, GMAIL_TOKEN_JSON).
    - Accept a parsed case summary and generate a professional outreach email draft
      addressed to the identified property owner or heir.
    - Populate the draft with key details: property address, estimated surplus amount,
      claim deadline, and a link to the Google Drive evidence packet.
    - Save the draft to the configured Gmail account without sending — a human reviews
      and sends manually.
    - Return the Gmail draft ID and a preview of the subject line.

Usage example (future):
    draft = await create_surplus_draft(case_summary={...}, drive_links={...})
"""

from googleapiclient.discovery import Resource


def get_gmail_service() -> Resource:
    """Build and return an authenticated Gmail API service client."""
    raise NotImplementedError


async def create_surplus_draft(case_summary: dict, drive_links: dict[str, str]) -> dict:
    """Create a Gmail draft for surplus outreach and return the draft ID and subject."""
    raise NotImplementedError
