"""
Google Drive storage for the Maryland mortgage research pipeline.

Authentication uses OAuth 2.0 (not a service account) so that files appear in
Bree's personal Drive.  On first run, call ``authorize_oauth_flow()`` to get a
refresh token, then store it in the ``GOOGLE_REFRESH_TOKEN`` environment
variable.  Subsequent calls use the refresh token automatically.

Environment variables:
  GOOGLE_OAUTH_CREDENTIALS_JSON  – JSON string of the OAuth client credentials
                                   (downloaded from Google Cloud Console as
                                   "OAuth 2.0 Client ID → Desktop app").
  GOOGLE_REFRESH_TOKEN           – Long-lived refresh token obtained via
                                   ``authorize_oauth_flow()``.

Folder structure created in Drive:
  Moss Equity Partners / Lead Research / [State] / [County] / [Last_FirstMI]
"""

import json
import logging
import os
import secrets
from typing import Optional

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.compose",
]
_DRIVE_ROOT_FOLDER = "Moss Equity Partners"
_RESEARCH_SUBFOLDER = "Lead Research"

# In-memory folder ID cache to avoid repeated Drive API lookups
_folder_cache: dict[str, str] = {}


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def get_oauth_authorization_url() -> str:
    """
    Generate the Google OAuth 2.0 authorization URL for the user to open.

    Uses the OOB (out-of-band) redirect URI so the user receives an auth code
    to copy/paste rather than being redirected to a server callback.

    Returns:
        Authorization URL string.
    """
    creds_json = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
    if not creds_json:
        raise RuntimeError("GOOGLE_OAUTH_CREDENTIALS_JSON environment variable not set")

    creds_info = json.loads(creds_json)
    flow = Flow.from_client_config(
        creds_info,
        scopes=_SCOPES,
        redirect_uri="urn:ietf:wg:oauth:2.0:oob",
    )
    state = secrets.token_urlsafe(32)
    auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent", state=state)
    return auth_url


def complete_oauth_flow(code: str) -> str:
    """
    Exchange an authorization code for tokens and return the refresh token.

    Args:
        code: The authorization code the user copied from Google's consent page.

    Returns:
        Refresh token string. Store in GOOGLE_REFRESH_TOKEN environment variable.
    """
    creds_json = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
    if not creds_json:
        raise RuntimeError("GOOGLE_OAUTH_CREDENTIALS_JSON environment variable not set")

    creds_info = json.loads(creds_json)
    flow = Flow.from_client_config(
        creds_info,
        scopes=_SCOPES,
        redirect_uri="urn:ietf:wg:oauth:2.0:oob",
    )
    flow.fetch_token(code=code)
    refresh_token = flow.credentials.refresh_token
    return refresh_token


def get_drive_service():
    """
    Build and return an authenticated Google Drive API service.

    Reads ``GOOGLE_OAUTH_CREDENTIALS_JSON`` and ``GOOGLE_REFRESH_TOKEN`` from
    the environment.  Raises ``RuntimeError`` if either is missing.
    """
    creds_json = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN", "")

    if not creds_json or not refresh_token:
        raise RuntimeError(
            "GOOGLE_OAUTH_CREDENTIALS_JSON and GOOGLE_REFRESH_TOKEN must be set. "
            "Run authorize_oauth_flow() once to generate the refresh token."
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
    return build("drive", "v3", credentials=creds, cache_discovery=False)


# ---------------------------------------------------------------------------
# Folder management
# ---------------------------------------------------------------------------

def _get_or_create_folder(service, name: str, parent_id: Optional[str] = None) -> str:
    """Return the Drive folder ID for *name* under *parent_id*, creating it if needed."""
    cache_key = f"{parent_id or 'root'}:{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]

    query_parts = [
        f"name = '{name}'",
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
    ]
    if parent_id:
        query_parts.append(f"'{parent_id}' in parents")

    response = service.files().list(
        q=" and ".join(query_parts),
        spaces="drive",
        fields="files(id, name)",
        pageSize=1,
    ).execute()

    files = response.get("files", [])
    if files:
        folder_id = files[0]["id"]
    else:
        metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]
        folder = service.files().create(body=metadata, fields="id").execute()
        folder_id = folder["id"]
        logger.debug("Created Drive folder %r (id=%s)", name, folder_id)

    _folder_cache[cache_key] = folder_id
    return folder_id


def ensure_folder_path(path_parts: list[str]) -> str:
    """
    Ensure a nested folder path exists in Drive and return the final folder ID.

    Creates any missing intermediate folders.

    Args:
        path_parts: List of folder name segments, e.g.
                    ``["Moss Equity Partners", "Lead Research", "Maryland", "Prince Georges"]``.

    Returns:
        Drive folder ID of the deepest folder.
    """
    service = get_drive_service()
    parent_id: Optional[str] = None
    for part in path_parts:
        parent_id = _get_or_create_folder(service, _title_case(part), parent_id)
    return parent_id  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# File upload
# ---------------------------------------------------------------------------

def upload_file(
    local_path: str,
    drive_folder_id: str,
    filename: Optional[str] = None,
) -> str:
    """
    Upload a local file to a Drive folder.

    Args:
        local_path:      Absolute path to the local file.
        drive_folder_id: Drive folder ID to upload into.
        filename:        Override the filename; defaults to the local basename.

    Returns:
        Shareable web-view URL of the uploaded file.
    """
    service = get_drive_service()
    name = filename or os.path.basename(local_path)
    mime = _guess_mime(local_path)

    metadata = {"name": name, "parents": [drive_folder_id]}
    media = MediaFileUpload(local_path, mimetype=mime, resumable=True)
    uploaded = service.files().create(
        body=metadata,
        media_body=media,
        fields="id, webViewLink",
    ).execute()

    file_id = uploaded["id"]
    # Make the file readable by anyone with the link
    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    url = uploaded.get("webViewLink", f"https://drive.google.com/file/d/{file_id}/view")
    logger.info("Uploaded %s → %s", name, url)
    return url


def upload_lead_documents(
    state: str,
    county: str,
    lead_name: str,
    files: list[str],
) -> dict[str, str]:
    """
    Upload all documents for a lead into the standard folder structure.

    Folder path:
      Moss Equity Partners / Lead Research / [State] / [County] / [Last_FirstMI]

    Args:
        state:     State abbreviation or full name, e.g. ``"Maryland"``.
        county:    County name, e.g. ``"Prince George's"``.
        lead_name: Formatted lead name for folder, e.g. ``"Moore_SarahP"``.
        files:     List of local file paths to upload.

    Returns:
        Dict mapping each local path to its Drive URL.
    """
    county_safe = county.replace("'", "").replace(".", "")
    folder_id = ensure_folder_path([
        _DRIVE_ROOT_FOLDER,
        _RESEARCH_SUBFOLDER,
        _title_case(state),
        _title_case(county_safe),
        lead_name,
    ])

    results: dict[str, str] = {}
    for path in files:
        try:
            url = upload_file(path, folder_id)
            results[path] = url
        except Exception as exc:
            logger.error("Failed to upload %s: %s", path, exc)
            results[path] = f"error: {exc}"

    return results


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _title_case(text: str) -> str:
    return " ".join(w.capitalize() for w in text.split())


def _guess_mime(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    return {
        ".pdf": "application/pdf",
        ".json": "application/json",
        ".txt": "text/plain",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }.get(ext, "application/octet-stream")
