"""
Gmail integration for the Maryland mortgage research pipeline.

Shares OAuth credentials with google_drive.py:
  GOOGLE_OAUTH_CREDENTIALS_JSON  – OAuth 2.0 client credentials JSON string
  GOOGLE_REFRESH_TOKEN           – Long-lived refresh token

Provides:
  - Draft creation for clerk records requests
  - Inbox polling for MDLandRec access-code emails
"""

import base64
import json
import logging
import os
import re
import time
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
    "https://www.googleapis.com/auth/gmail.readonly",
]

_SENDER = "bree@mossequitypartners.com"
_SENDER_NAME = "Bree Moss"
_COMPANY = "Moss Equity Partners"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def _parse_creds_info(creds_json: str) -> dict:
    """Extract the credential fields from either a 'web' or 'installed' credentials blob."""
    data = json.loads(creds_json)
    app = data.get("web") or data.get("installed")
    if not app:
        raise RuntimeError("GOOGLE_OAUTH_CREDENTIALS_JSON must have a 'web' or 'installed' key")
    return app


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
            "Call POST /oauth/google/start to begin the authorization flow."
        )

    app = _parse_creds_info(creds_json)
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=app["token_uri"],
        client_id=app["client_id"],
        client_secret=app["client_secret"],
        scopes=_SCOPES,
    )
    creds.refresh(Request())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


# ---------------------------------------------------------------------------
# Inbox polling for MDLandRec access codes
# ---------------------------------------------------------------------------

def poll_for_mdlandrec_code(max_wait: int = 60, poll_interval: int = 10) -> str:
    """
    Poll Gmail inbox for an MDLandRec access-code email and return the code.

    Args:
        max_wait:      Maximum seconds to wait before raising TimeoutError.
        poll_interval: Seconds between Gmail poll attempts.

    Returns:
        6-character alphanumeric access code string.

    Raises:
        TimeoutError: If no code email arrives within max_wait seconds.
    """
    service = get_gmail_service()
    query = 'from:maryland.gov "access code" newer_than:10m'

    deadline = time.time() + max_wait
    attempt = 0

    while True:
        attempt += 1
        logger.info("Gmail poll attempt %d for MDLandRec access code...", attempt)

        result = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=5,
        ).execute()

        for msg_ref in result.get("messages", []):
            msg = service.users().messages().get(
                userId="me",
                id=msg_ref["id"],
                format="full",
            ).execute()

            # Check subject first (code appears there too), then body
            headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
            subject = headers.get("subject", "")
            body = _extract_body(msg)

            for text in (subject, body):
                code = _extract_code(text)
                if code:
                    logger.info("Found MDLandRec access code in message %s", msg_ref["id"])
                    return code

        if time.time() >= deadline:
            break

        remaining = deadline - time.time()
        sleep_for = min(poll_interval, remaining)
        if sleep_for > 0:
            logger.debug("Access code not found yet; sleeping %.0fs", sleep_for)
            time.sleep(sleep_for)

    raise TimeoutError(
        f"No MDLandRec access code email found within {max_wait} seconds."
    )


def _extract_body(msg: dict) -> str:
    """Recursively extract plain-text body from a Gmail message payload."""
    def _walk(part: dict) -> str:
        mime = part.get("mimeType", "")
        if mime == "text/plain":
            data = part.get("body", {}).get("data", "")
            if data:
                return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        for sub in part.get("parts", []):
            result = _walk(sub)
            if result:
                return result
        return ""

    return _walk(msg.get("payload", {}))


def _extract_code(text: str) -> str:
    """Extract a 6-character alphanumeric access code following 'access code' or 'code:'."""
    m = re.search(r'(?:access\s*code[:\s]+)([A-Z0-9]{6})', text, re.IGNORECASE)
    return m.group(1).upper() if m else ""


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
