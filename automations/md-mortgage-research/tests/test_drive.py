"""
test_drive.py - Test Google Drive integration: upload a small sample file and verify it.
Requires: GOOGLE_OAUTH_CREDENTIALS_JSON and GOOGLE_REFRESH_TOKEN in .env
"""

import os
import sys
import json
import traceback
import tempfile
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GOOGLE_OAUTH_CREDENTIALS_JSON = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
GOOGLE_REFRESH_TOKEN = os.environ.get("GOOGLE_REFRESH_TOKEN", "")

UPLOAD_FOLDER_NAME = "MossEquityPartners-LocalTest"
TEST_FILE_NAME = f"test-upload-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
TEST_FILE_CONTENT = f"""Moss Equity Partners - Google Drive Test
Uploaded: {datetime.now().isoformat()}
Source: test_drive.py (local test runner)
Status: If you see this file, Drive integration is working!
"""


def check_credentials():
    missing = []
    placeholder_creds = "REPLACE_ME" in GOOGLE_OAUTH_CREDENTIALS_JSON
    if not GOOGLE_OAUTH_CREDENTIALS_JSON or placeholder_creds:
        missing.append("GOOGLE_OAUTH_CREDENTIALS_JSON")
    if not GOOGLE_REFRESH_TOKEN or GOOGLE_REFRESH_TOKEN == "your-google-refresh-token-here":
        missing.append("GOOGLE_REFRESH_TOKEN")
    if missing:
        print(f"[SKIP] Missing/placeholder credentials: {', '.join(missing)}")
        print("       Update them in .env and re-run.")
        return False
    return True


def build_drive_service():
    """Build an authenticated Google Drive service using stored refresh token."""
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    creds_data = json.loads(GOOGLE_OAUTH_CREDENTIALS_JSON)
    # Handle both 'installed' and 'web' app credential formats
    client_info = creds_data.get("installed") or creds_data.get("web") or creds_data

    creds = Credentials(
        token=None,
        refresh_token=GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_info["client_id"],
        client_secret=client_info["client_secret"],
        # Match the scopes the refresh token was originally issued with.
        # Per project handoff: Drive file + Gmail compose + Gmail readonly.
        # Asking for a superset (e.g. auth/drive) yields invalid_scope: Bad Request.
        scopes=[
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/gmail.readonly",
        ],
    )

    service = build("drive", "v3", credentials=creds)
    return service


def get_or_create_folder(service, folder_name: str) -> str:
    """Find existing folder or create it, return folder ID."""
    query = (
        f"name='{folder_name}' "
        "and mimeType='application/vnd.google-apps.folder' "
        "and trashed=false"
    )
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get("files", [])

    if files:
        folder_id = files[0]["id"]
        print(f"    Found existing folder: {folder_name} (ID: {folder_id})")
        return folder_id

    folder_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    folder = service.files().create(body=folder_metadata, fields="id").execute()
    folder_id = folder.get("id")
    print(f"    Created folder: {folder_name} (ID: {folder_id})")
    return folder_id


def test_google_drive():
    print("\n=== Google Drive Upload Test ===")
    print(f"Test file  : {TEST_FILE_NAME}")
    print(f"Folder     : {UPLOAD_FOLDER_NAME}")
    print(f"Credentials: {'SET' if GOOGLE_OAUTH_CREDENTIALS_JSON else 'NOT SET'}")
    print(f"Refresh tok: {'SET' if GOOGLE_REFRESH_TOKEN else 'NOT SET'}")
    print()

    if not check_credentials():
        sys.exit(0)

    try:
        from googleapiclient.http import MediaFileUpload
    except ImportError:
        print("[FAIL] google-api-python-client not installed.")
        print("       Run: pip install google-api-python-client google-auth")
        sys.exit(1)

    uploaded_file_id = None
    service = None

    try:
        print("[1] Building authenticated Drive service...")
        service = build_drive_service()
        print("    Service built successfully")

        print("[2] Verifying authentication (listing root)...")
        about = service.about().get(fields="user").execute()
        user_email = about.get("user", {}).get("emailAddress", "unknown")
        print(f"    Authenticated as: {user_email}")

        print(f"[3] Finding/creating folder: {UPLOAD_FOLDER_NAME}...")
        folder_id = get_or_create_folder(service, UPLOAD_FOLDER_NAME)

        print(f"[4] Creating temporary file to upload...")
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as tmp:
            tmp.write(TEST_FILE_CONTENT)
            tmp_path = tmp.name
        print(f"    Temp file: {tmp_path}")

        print(f"[5] Uploading '{TEST_FILE_NAME}' to Drive...")
        file_metadata = {
            "name": TEST_FILE_NAME,
            "parents": [folder_id],
        }
        media = MediaFileUpload(tmp_path, mimetype="text/plain")
        uploaded = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, name, size, webViewLink",
        ).execute()
        uploaded_file_id = uploaded.get("id")
        print(f"    Uploaded: {uploaded.get('name')} (ID: {uploaded_file_id})")
        print(f"    View at : {uploaded.get('webViewLink', 'N/A')}")

        print("[6] Reading file metadata back to verify...")
        verified = service.files().get(
            fileId=uploaded_file_id,
            fields="id, name, size",
        ).execute()
        print(f"    Verified: name={verified['name']}, size={verified.get('size', '?')} bytes")

        print("[7] Cleaning up: deleting test file from Drive...")
        service.files().delete(fileId=uploaded_file_id).execute()
        print(f"    Deleted test file from Drive")
        uploaded_file_id = None

        # Clean up local temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

        print("\n[PASS] Google Drive test completed successfully")
        return True

    except Exception as e:
        print(f"\n[FAIL] Google Drive error: {e}")
        traceback.print_exc()
        # Attempt cleanup
        if service and uploaded_file_id:
            try:
                service.files().delete(fileId=uploaded_file_id).execute()
                print("    Cleanup: deleted test file from Drive")
            except Exception:
                pass
        return False


if __name__ == "__main__":
    success = test_google_drive()
    sys.exit(0 if success else 1)
