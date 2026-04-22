import os
import base64
import time
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
GMAIL_LABEL = os.getenv("GMAIL_LABEL", "INBOX")
GHL_API_KEY = os.getenv("GHL_API_KEY")
GHL_LOCATION_ID = os.getenv("GHL_LOCATION_ID")
GHL_BASE_URL = "https://services.leadconnectorhq.com"
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 300))
PROCESSED_LABEL_NAME = "GHL-Processed"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_gmail_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def get_or_create_label(service, name):
    labels = service.users().labels().list(userId="me").execute().get("labels", [])
    for label in labels:
        if label["name"] == name:
            return label["id"]
    result = service.users().labels().create(
        userId="me",
        body={
            "name": name,
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show",
        },
    ).execute()
    logger.info(f"Created Gmail label: {name}")
    return result["id"]


def get_header(headers, name):
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def get_email_body(msg):
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])
    if parts:
        for part in parts:
            if part.get("mimeType") == "text/plain":
                data = part["body"].get("data", "")
                if data:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
    data = payload.get("body", {}).get("data", "")
    if data:
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
    return ""


def extract_email_address(sender):
    if "<" in sender:
        return sender.split("<")[1].strip(">").strip()
    return sender.strip()


def find_ghl_contact(email_address):
    resp = requests.get(
        f"{GHL_BASE_URL}/contacts/",
        headers=ghl_headers(),
        params={"email": email_address, "locationId": GHL_LOCATION_ID},
    )
    if resp.status_code == 200:
        contacts = resp.json().get("contacts", [])
        if contacts:
            return contacts[0]["id"]
    return None


def create_ghl_task(contact_id, subject, body, sender):
    due_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "title": f"Email: {subject}",
        "body": f"From: {sender}\n\n{body[:1000]}",
        "dueDate": due_date,
        "completed": False,
        "contactId": contact_id,
    }
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/{contact_id}/tasks",
        headers=ghl_headers(),
        json=payload,
    )
    return resp.status_code in (200, 201), resp.json()


def ghl_headers():
    return {
        "Authorization": f"Bearer {GHL_API_KEY}",
        "Content-Type": "application/json",
        "Version": "2021-07-28",
    }


def poll_gmail(service, processed_label_id):
    logger.info("Checking for new emails...")
    query = f"label:{GMAIL_LABEL} is:unread -label:{PROCESSED_LABEL_NAME}"
    results = service.users().messages().list(userId="me", q=query).execute()
    messages = results.get("messages", [])

    if not messages:
        logger.info("No new emails.")
        return

    logger.info(f"Found {len(messages)} new email(s)")

    for meta in messages:
        msg = service.users().messages().get(
            userId="me", id=meta["id"], format="full"
        ).execute()

        headers = msg["payload"]["headers"]
        subject = get_header(headers, "Subject") or "(no subject)"
        sender = get_header(headers, "From") or "unknown"
        body = get_email_body(msg)
        email_address = extract_email_address(sender)

        logger.info(f'Processing: "{subject}" from {sender}')

        contact_id = find_ghl_contact(email_address)

        if contact_id:
            success, result = create_ghl_task(contact_id, subject, body, sender)
            if success:
                logger.info(f"Task created in GHL for contact {contact_id}")
            else:
                logger.error(f"Failed to create GHL task: {result}")
        else:
            logger.warning(
                f"No GHL contact found for {email_address} — email logged but no task created"
            )

        # Mark processed so it won't be picked up again
        service.users().messages().modify(
            userId="me",
            id=meta["id"],
            body={
                "addLabelIds": [processed_label_id],
                "removeLabelIds": ["UNREAD"],
            },
        ).execute()


def main():
    if not GHL_API_KEY or not GHL_LOCATION_ID:
        raise EnvironmentError("GHL_API_KEY and GHL_LOCATION_ID must be set in .env")

    logger.info("Starting Gmail -> GoHighLevel automation")
    service = get_gmail_service()
    processed_label_id = get_or_create_label(service, PROCESSED_LABEL_NAME)

    while True:
        try:
            poll_gmail(service, processed_label_id)
        except Exception as e:
            logger.error(f"Error during poll: {e}")
        logger.info(f"Sleeping {POLL_INTERVAL}s until next check...")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
