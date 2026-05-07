# MD Mortgage Surplus Verification Agent

Automated research pipeline that identifies and verifies Maryland foreclosure surplus
funds using public record sources, AI-assisted document parsing, and structured storage.

## What it does

1. **Scrapes** SDAT (property assessment), Maryland Judiciary Case Search (court dockets),
   and county land records (recorded instruments) using Playwright.
2. **Parses** retrieved PDFs with Claude (`claude-sonnet-4-6`) to extract lien amounts,
   priority, parties, and surplus figures.
3. **Stores** results in Supabase for case tracking and pipeline auditing.
4. **Uploads** an evidence packet to a structured Google Drive folder.
5. **Drafts** clerk records-request emails in Gmail for any missing court documents.
6. **Decides** KEEP / HOLD / SKIP based on surplus threshold and case status.

## Project structure

```
automations/md-mortgage-research/
├── main.py                     # FastAPI app — all endpoints + research pipeline
├── scrapers/
│   ├── sdat.py                 # SDAT real property search (Playwright)
│   ├── case_search.py          # Maryland Judiciary Case Search (Playwright)
│   └── land_records.py         # MDLandRec grantor-index search (Playwright)
├── parsers/
│   └── document_parser.py      # Claude-powered PDF parsing for 5 document types
├── storage/
│   ├── supabase_client.py      # Supabase helpers — leads, liens, research_runs
│   ├── google_drive.py         # OAuth Drive upload with folder-path management
│   └── gmail_drafts.py         # Gmail draft creation for clerk records requests
├── config/
│   └── maryland_clerks.json    # Circuit court clerk contacts for all 24 counties
├── requirements.txt
├── Dockerfile
├── railway.json
└── .env.example
```

## Setup

### 1. Install dependencies

```bash
cd automations/md-mortgage-research
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in all values (see Environment variables below)
```

### 3. Set up Google OAuth (one-time)

```bash
uvicorn main:app --reload &
curl -X POST http://localhost:8000/oauth/google/start
# Follow the browser prompt, then copy the refresh token into GOOGLE_REFRESH_TOKEN
```

### 4. Set up MDLandRec session (one-time)

```python
import asyncio
from scrapers.land_records import login
cookies = asyncio.run(login("your@email.com", "yourpassword"))
# Session cookies are saved to ~/.md-research/session-cookies.json automatically
```

### 5. Run the server

```bash
uvicorn main:app --reload
# or
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## API endpoints

### `GET /health`

Liveness probe. Returns `{"status": "ok"}`.

### `POST /research/maryland`

Submit a lead for research. Returns a `job_id` immediately; poll `/status/{job_id}` for results.

**Request body:**

```json
{
  "property_address": "4044 Hanson Oaks Drive",
  "county": "Prince George's",
  "owner_last_name": "Moore",
  "owner_first_name": "Sarah",
  "owner_middle_initial": "P",
  "sale_type": "mortgage_foreclosure",
  "closing_bid": 285000,
  "sale_date_estimate": "2024-06-15",
  "owner_living": true,
  "trustee_last": "Smith",
  "trustee_first": "John"
}
```

**Response:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Research pipeline started. Poll /status/{job_id} for updates."
}
```

### `GET /status/{job_id}`

Returns the Supabase `research_runs` row for the given job, including `status`,
`summary` (full research findings), and `error` if failed.

**Final summary shape:**

```json
{
  "sdat": { "current_owner": "...", "last_sale_date": "...", ... },
  "instruments": [ { "instrument_type": "DEED OF TRUST", "book": "...", ... } ],
  "cases": [ { "case_number": "C-16-CV-24-005892", "filing_date": "...", ... } ],
  "docket": { "docket_entries": [ { "date": "...", "document_name": "...", ... } ] },
  "parsed_docs": { "deed_of_trust_12345_678.pdf": { "original_loan_amount": "$185,000", ... } },
  "surplus_estimate": {
    "closing_bid": 285000,
    "trustee_commission": 28500,
    "attorney_fees": 5000,
    "mortgage_payoff": 197500,
    "total_junior_liens": 0,
    "net_surplus": 54000,
    "note": "Estimate only. Verify against filed Auditor's Report."
  },
  "decision": "HOLD",
  "decision_reason": "Estimated surplus $54,000 — awaiting final auditor report",
  "missing_documents": ["Auditor's Report"],
  "drive_urls": { "/tmp/deed_of_trust_...pdf": "https://drive.google.com/..." },
  "draft_urls": ["https://mail.google.com/mail/u/0/#drafts/..."]
}
```

### `POST /oauth/google/start`

Launches the Google OAuth 2.0 installed-app flow. Run from a local environment
(not Railway) to obtain the initial refresh token.

## Decision logic

| Condition | Decision | Reason |
|-----------|----------|--------|
| Exceptions filed | SKIP | Contested sale |
| Auditor report pending | HOLD | Recheck in 60 days |
| Surplus < $35k (living owner) | SKIP | Below floor |
| Surplus < $50k (estate) | SKIP | Below floor |
| Auditor report filed, surplus ≥ floor | KEEP | Ready to pursue |
| Default | HOLD | Awaiting auditor report |

## Surplus estimation

Uses Maryland Rule 14-305 schedule:

```
net_surplus = closing_bid
            − trustee_commission (10% of closing_bid)
            − attorney_fees (from auditor report or $5,000 estimate)
            − mortgage_payoff (from deed of trust, accrued at 6%/yr simple interest)
            − all identified junior liens
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | Service-role key (backend only) |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/public key |
| `GOOGLE_OAUTH_CREDENTIALS_JSON` | Yes | OAuth 2.0 client credentials JSON |
| `GOOGLE_REFRESH_TOKEN` | Yes | Long-lived refresh token (from OAuth flow) |
| `MDLANDREC_EMAIL` | Optional | MDLandRec login email |
| `MDLANDREC_PASSWORD` | Optional | MDLandRec login password |
| `LAND_RECORDS_DEBUG_SCREENSHOTS` | Optional | Set `1` to save page screenshots |
| `CASE_SEARCH_DEBUG_SCREENSHOTS` | Optional | Set `1` to save page screenshots |

## Supabase schema

Run the following SQL in Supabase to create the required tables:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  county text,
  owner_last_name text,
  owner_first_name text,
  sale_type text,
  status text default 'new',
  surplus_estimate numeric,
  decision text,
  decision_reason text,
  drive_folder_url text,
  current_run_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table liens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  lien_holder text,
  lien_amount numeric,
  lien_type text,
  recorded_date text,
  debtor_name text,
  created_at timestamptz default now()
);

create table research_runs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  status text default 'running',
  summary jsonb,
  error text,
  started_at timestamptz default now(),
  completed_at timestamptz
);
```

## Deployment (Railway)

1. Connect this repo to Railway.
2. Set all environment variables from the table above.
3. Railway will use `Dockerfile` to build and `railway.json` for config.
4. The service exposes port 8000 (or `$PORT` if Railway overrides it).

## Network restrictions

The Playwright scrapers require outbound HTTPS access to:
- `sdat.dat.maryland.gov` (SDAT)
- `casesearch.courts.state.md.us` (Case Search)
- `mdlandrec.net` (Land Records)

These are blocked in the development sandbox; all live testing must be done
from Railway or an unrestricted network.  Set `*_DEBUG_SCREENSHOTS=1` to
capture page screenshots at each navigation step for debugging.
