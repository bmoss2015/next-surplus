import os
import imaplib
import email
import re
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


def extract_full_address(subject):
    match = re.search(r'Transaction Update:\s*(.+?)\s*-\s*Sold', subject, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""


def extract_street_address(subject):
    full = extract_full_address(subject)
    if "," in full:
        return full.split(",")[0].strip()
    return full


def extract_sold_amount(body):
    match = re.search(r'for \$([0-9,]+)', body, re.IGNORECASE)
    if match:
        return f"${match.group(1)}"
    return "Not found"


def create_ghl_contact(subject):
    today = datetime.now().strftime("%b %d, %Y")
    street = extract_street_address(subject) or "Auction Property"
    payload = {
        "locationId": GHL_LOCATION_ID,
        "firstName": today,
        "lastName": street,
    }
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/",
        headers=ghl_headers(),
        json=payload,
    )
    if resp.status_code in (200, 201):
        contact_id = resp.json().get("contact", {}).get("id")
        logger.info(f"Created GHL contact: {today} {street}")
        return contact_id
    logger.error(f"Failed to create contact: {resp.text}")
    return None


def create_ghl_task(contact_id, subject, assigned_user_id):
    due_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "title": f"Auction Sale {datetime.now().strftime('%b %d, %Y')}: {subject}",
        "dueDate": due_date,
        "completed": False,
    }
    if assigned_user_id:
        payload["assignedTo"] = assigned_user_id
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/{contact_id}/tasks",
        headers=ghl_headers(),
        json=payload,
    )
    return resp.status_code in (200, 201), resp.json()


def build_activity_body(subject, body):
    today = datetime.now().strftime("%b %d, %Y")
    full_address = extract_full_address(subject)
    sold_amount = extract_sold_amount(body)
    return (
        f"Sold Date: {today}\n"
        f"Address: {full_address}\n"
        f"Sold Amount: {sold_amount}\n"
        f"Link: https://www.auction.com"
    )


def create_ghl_note(contact_id, subject, body, user_id):
    payload = {"body": build_activity_body(subject, body)}
    if user_id:
        payload["userId"] = user_id
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/{contact_id}/notes",
        headers=ghl_headers(),
        json=payload,
    )
    return resp.status_code in (200, 201), resp.json()


def create_ghl_activity(contact_id, subject, body):
    today = datetime.now().strftime("%b %d, %Y")
    full_address = extract_full_address(subject)
    payload = {
        "contactId": contact_id,
        "activityType": "CustomActivity",
        "title": f"Property Sold: {full_address}",
        "body": build_activity_body(subject, body),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    resp = requests.post(
        f"{GHL_BASE_URL}/contacts/{contact_id}/activity",
        headers=ghl_headers(),
        json=payload,
    )
    logger.info(f"Activity API response: {resp.status_code} {resp.text}")
    return resp.status_code in (200, 201), resp.json() if resp.text else {}


def connect_to_gmail():
    mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    mail.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
    return mail


def decode_subject(raw_subject):
    if not raw_subject:
        return "(no subject)"
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


def poll_gmail(assigned_user_id):
    logger.info("Connecting to Gmail...")
    mail = connect_to_gmail()
    mail.select(f'"{GMAIL_FOLDER}"')

    _, data = mail.uid("search", None, "UNSEEN")
    uids = data[0].split()

    if not uids:
        logger.info("No new emails.")
        mail.logout()
        return

    logger.info(f"Found {len(uids)} new email(s)")

    for uid in uids:
        try:
            _, msg_data = mail.uid("fetch", uid, "(RFC822)")
            if not msg_data or not msg_data[0]:
                logger.warning(f"Could not fetch UID {uid}, skipping.")
                continue

            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            subject = decode_subject(msg.get("Subject", ""))
            body = get_email_body(msg)

            logger.info(f'Processing: "{subject}"')

            contact_id = create_ghl_contact(subject)

            if contact_id:
                task_ok, task_result = create_ghl_task(contact_id, subject, assigned_user_id)
                if task_ok:
                    logger.info("Task created in GHL")
                else:
                    logger.error(f"Failed to create task: {task_result}")

                note_ok, note_result = create_ghl_note(contact_id, subject, body, assigned_user_id)
                if note_ok:
                    logger.info("Note added to GHL contact")
                else:
                    logger.error(f"Failed to create note: {note_result}")

                activity_ok, activity_result = create_ghl_activity(contact_id, subject, body)
                if activity_ok:
                    logger.info("Activity added to GHL contact")
                else:
                    logger.warning(f"Activity endpoint returned: {activity_result}")
            else:
                logger.error("Could not create contact — skipping")

            mail.uid("store", uid, "+FLAGS", "\\Seen")
            copy_result = mail.uid("copy", uid, f'"{GMAIL_PROCESSED_FOLDER}"')
            if copy_result[0] == "OK":
                mail.uid("store", uid, "+FLAGS", "\\Deleted")
                logger.info(f"Email moved to {GMAIL_PROCESSED_FOLDER}")
            else:
                logger.warning(f"Could not move email to {GMAIL_PROCESSED_FOLDER}: {copy_result}")

        except Exception as e:
            logger.error(f"Error processing UID {uid}: {e}")

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
