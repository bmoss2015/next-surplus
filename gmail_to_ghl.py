import os
import imaplib
import email
import time
import logging
from email.header import decode_header
from datetime import datetime, timezone
from dotenv import load_dotenv
import requests

load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
GMAIL_FOLDER = os.getenv("GMAIL_FOLDER", "INBOX")
GMAIL_PROCESSED_FOLDER = os.getenv("GMAIL_PROCESSED_FOLDER", "Pushed to GHL")
GHL_API_KEY = os.getenv("GHL_API_KEY")
GHL_LOCATION_ID = os.getenv("GHL_LOCATION_ID")
GHL_BASE_URL = "https://services.leadconnectorhq.com"
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 300))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def connect_to_gmail():
    mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    mail.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
    return mail


def decode_subject(raw_subject):
    parts = decode_header(raw_subject)
    subject = ""
    for part, encoding in parts:
        if isinstance(part, bytes):
            subject += part.decode(encoding or "utf-8", errors="replace")
        else:
            subject += part
    return subject


def get_email_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode("utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode("utf-8", errors="replace")
    return ""


def extract_email_address(sender):
    if "<" in sender:
        return sender.split("<")[1].strip(">").strip()
    return sender.strip()


def ghl_headers():
    return {
        "Authorization": f"Bearer {GHL_API_KEY}",
        "Content-Type": "application/json",
        "Version": "2021-07-28",
    }


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
        "title": f"Auction Sale {datetime.now().strftime('%b %d, %Y')}: {subject}",
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


def poll_gmail():
    logger.info("Connecting to Gmail...")
    mail = connect_to_gmail()
    mail.select(GMAIL_FOLDER)

    _, data = mail.search(None, "UNSEEN")
    email_ids = data[0].split()

    if not email_ids:
        logger.info("No new emails.")
        mail.logout()
        return

    logger.info(f"Found {len(email_ids)} new email(s)")

    for eid in email_ids:
        _, msg_data = mail.fetch(eid, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subject = decode_subject(msg.get("Subject", "(no subject)"))
        sender = msg.get("From", "unknown")
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
            logger.warning(f"No GHL contact found for {email_address} — skipping task creation")

        # Mark as read so it won't be picked up again
        # Mark as read
        mail.store(eid, "+FLAGS", "\\Seen")
        # Move to processed folder
        mail.copy(eid, f'"{GMAIL_PROCESSED_FOLDER}"')
        mail.store(eid, "+FLAGS", "\\Deleted")

    mail.expunge()
    mail.logout()


def main():
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        raise EnvironmentError("GMAIL_ADDRESS and GMAIL_APP_PASSWORD must be set in .env")
    if not GHL_API_KEY or not GHL_LOCATION_ID:
        raise EnvironmentError("GHL_API_KEY and GHL_LOCATION_ID must be set in .env")

    logger.info("Starting Gmail -> GoHighLevel automation")

    while True:
        try:
            poll_gmail()
        except Exception as e:
            logger.error(f"Error during poll: {e}")
        logger.info(f"Sleeping {POLL_INTERVAL}s until next check...")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
