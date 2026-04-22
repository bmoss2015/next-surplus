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
GHL_ASSIGNED_EMAIL = os.getenv("GHL_ASSIGNED_EMAIL")
GHL_BASE_URL = "https://services.leadconnectorhq.com"
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 300))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def ghl_headers():
    return {
        "Authorization": f"Bearer {GHL_API_KEY}",
        "Content-Type": "application/json",
        "Version": "2021-07-28",
    }


def get_assigned_user_id():
    resp = requests.get(
        f"{GHL_BASE_URL}/users/",
        headers=ghl_headers(),
        params={"locationId": GHL_LOCATION_ID},
    )
    if resp.status_code == 200:
        for user in resp.json().get("users", []):
            if user.get("email", "").lower() == GHL_ASSIGNED_EMAIL.lower():
                logger.info(f"Found assigned user ID for {GHL_ASSIGNED_EMAIL}")
                return user["id"]
    logger.warning(f"Could not find GHL user for {GHL_ASSIGNED_EMAIL}")
    return None


def find_or_create_ghl_contact(email_address, sender_name):
    resp = requests.get(
        f"{GHL_BASE_URL}/contacts/",
        headers=ghl_headers(),
        params={"email": email_address, "locationId": GHL_LOCATION_ID},
    )
    if resp.status_code == 200:
        contacts = resp.json().get("contacts", [])
        if contacts:
            return contacts[0]["id"]

    name_parts = sender_name.split(" ", 1)
    payload = {
        "locationId": GHL_LOCATION_ID,
        "email": email_address,
        "firstName": name_parts[0] if name_parts else email_address,
        "lastName": name_parts[1] if len(name_parts) > 1 else "",
    }
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/",
        headers=ghl_headers(),
        json=payload,
    )
    if resp.status_code in (200, 201):
        contact_id = resp.json().get("contact", {}).get("id")
        logger.info(f"Created new GHL contact for {email_address}")
        return contact_id

    logger.error(f"Failed to create contact for {email_address}: {resp.text}")
    return None


def create_ghl_task(contact_id, subject, body, sender, assigned_user_id):
    due_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "title": f"Auction Sale {datetime.now().strftime('%b %d, %Y')}: {subject}",
        "body": f"From: {sender}\n\n{body[:1000]}",
        "dueDate": due_date,
        "completed": False,
        "contactId": contact_id,
    }
    if assigned_user_id:
        payload["assignedTo"] = assigned_user_id

    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/{contact_id}/tasks",
        headers=ghl_headers(),
        json=payload,
    )
    return resp.status_code in (200, 201), resp.json()


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


def extract_sender_info(sender):
    if "<" in sender:
        name = sender.split("<")[0].strip().strip('"')
        email_address = sender.split("<")[1].strip(">").strip()
    else:
        name = sender.strip()
        email_address = sender.strip()
    return name, email_address


def poll_gmail(assigned_user_id):
    logger.info("Connecting to Gmail...")
    mail = connect_to_gmail()
    mail.select(f'"{GMAIL_FOLDER}"')

    _, data = mail.search(None, "UNSEEN")
    email_ids = data[0].split()

    if not email_ids:
        logger.info("No new emails.")
        mail.logout()
        return

    logger.info(f"Found {len(email_ids)} new email(s)")

    for eid in email_ids:
        try:
            _, msg_data = mail.fetch(eid, "(RFC822)")
            if not msg_data or not msg_data[0]:
                logger.warning(f"Could not fetch email ID {eid}, skipping.")
                continue

            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            subject = decode_subject(msg.get("Subject", "(no subject)"))
            sender = msg.get("From", "unknown")
            body = get_email_body(msg)
            sender_name, email_address = extract_sender_info(sender)

            logger.info(f'Processing: "{subject}" from {sender}')

            contact_id = find_or_create_ghl_contact(email_address, sender_name)

            if contact_id:
                success, result = create_ghl_task(contact_id, subject, body, sender, assigned_user_id)
                if success:
                    logger.info(f"Task created in GHL for {email_address}")
                else:
                    logger.error(f"Failed to create GHL task: {result}")
            else:
                logger.error(f"Could not find or create contact for {email_address} — skipping")

            mail.store(eid, "+FLAGS", "\\Seen")
            mail.copy(eid, f'"{GMAIL_PROCESSED_FOLDER}"')
            mail.store(eid, "+FLAGS", "\\Deleted")

        except Exception as e:
            logger.error(f"Error processing email {eid}: {e}")

    mail.expunge()
    mail.logout()


def main():
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        raise EnvironmentError("GMAIL_ADDRESS and GMAIL_APP_PASSWORD must be set in .env")
    if not GHL_API_KEY or not GHL_LOCATION_ID:
        raise EnvironmentError("GHL_API_KEY and GHL_LOCATION_ID must be set in .env")

    logger.info("Starting Gmail -> GoHighLevel automation")
    assigned_user_id = get_assigned_user_id()

    while True:
        try:
            poll_gmail(assigned_user_id)
        except Exception as e:
            logger.error(f"Error during poll: {e}")
        logger.info(f"Sleeping {POLL_INTERVAL}s until next check...")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
