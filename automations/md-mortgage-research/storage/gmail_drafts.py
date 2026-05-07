"""
Gmail draft creator for the Maryland mortgage research pipeline.

Shares OAuth credentials with google_drive.py:
  GOOGLE_OAUTH_CREDENTIALS_JSON  – OAuth 2.0 client credentials JSON string
  GOOGLE_REFRESH_TOKEN           – Long-lived refresh token

Call ``google_drive.authorize_oauth_flow()`` once to generate the refresh
token; it requests both Drive and Gmail scopes together.
"""

import base64
import json
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

_SCOPES = [
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
]

_SENDER = "bree@mossequitypartners.com"
_SENDER_NAME = "Bree Moss"
_COMPANY = "Moss Equity Partners"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def get_gmail_service():
    """
    Build and return an authenticated Gmail API service.

    Reads ``GOOGLE_OAUTH_CREDENTIALS_JSON`` and ``GOOGLE_REFRESH_TOKEN``
    from the environment.
    """
    creds_json = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN", "")

    if not creds_json or not refresh_token:
        raise RuntimeError(
            "GOOGLE_OAUTH_CREDENTIALS_JSON and GOOGLE_REFRESH_TOKEN must be set. "
            "Run google_drive.authorize_oauth_flow() once to generate the refresh token."
        )

    creds_info = json.loads(creds_json)
    client_id = creds_info["installed"]["client_id"]
    client_secret = creds_info["installed"]["client_secret"]
    token_uri = creds_info["installed"]["token_uri"]

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=client_id,
        client_secret=client_secret,
        scopes=_SCOPES,
    )
    creds.refresh(Request())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


# ---------------------------------------------------------------------------
# Draft creation helpers
# ---------------------------------------------------------------------------

def _build_message(
    to: str,
    subject: str,
    body: str,
    cc: Optional[list[str]] = None,
) -> dict:
    """Encode a plain-text email as a Gmail API raw message dict."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{_SENDER_NAME} <{_SENDER}>"
    msg["To"] = to
    msg["Subject"] = subject
    if cc:
        msg["Cc"] = ", ".join(cc)

    msg.attach(MIMEText(body, "plain"))
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {"message": {"raw": raw}}


def create_draft(
    to: str,
    subject: str,
    body: str,
    cc: Optional[list[str]] = None,
) -> str:
    """
    Create a Gmail draft.

    Args:
        to:      Recipient email address.
        subject: Email subject line.
        body:    Plain-text email body.
        cc:      Optional list of CC addresses.

    Returns:
        Gmail web UI URL for the draft (``https://mail.google.com/...``).
    """
    service = get_gmail_service()
    message_dict = _build_message(to, subject, body, cc)
    draft = service.users().drafts().create(userId="me", body=message_dict).execute()
    draft_id = draft["id"]
    url = f"https://mail.google.com/mail/u/0/#drafts/{draft_id}"
    logger.info("Created Gmail draft %s → %s", draft_id, subject)
    return url


# ---------------------------------------------------------------------------
# Canned templates
# ---------------------------------------------------------------------------

def create_clerk_records_request(
    case_number: str,
    court: str,
    document_name: str,
    recipient_email: str,
    lead_address: str,
) -> str:
    """
    Create a Gmail draft for a public records request to a circuit court clerk.

    Args:
        case_number:      Maryland MDEC case number, e.g. ``"C-16-CV-24-005892"``.
        court:            Full court name, e.g. ``"Circuit Court for Prince George's County"``.
        document_name:    Name of the requested document, e.g. ``"Auditor's Report"``.
        recipient_email:  Clerk's email address.
        lead_address:     Property address for context.

    Returns:
        Gmail draft URL.
    """
    subject = f"Public Records Request - Case {case_number}"
    body = (
        f"Hello,\n\n"
        f"I am writing to request a copy of the {document_name} filed in case "
        f"{case_number} in the {court}. The case involves the property at {lead_address}.\n\n"
        f"Please let me know if there are any fees associated with this request and how "
        f"I can pay them. I can be reached at this email address.\n\n"
        f"Thank you for your assistance.\n\n"
        f"Best regards,\n"
        f"{_SENDER_NAME}\n"
        f"{_COMPANY}\n"
        f"{_SENDER}"
    )
    return create_draft(to=recipient_email, subject=subject, body=body)
