# MD Mortgage Surplus Verification Agent

Automated research pipeline that identifies and verifies Maryland foreclosure surplus
funds using public record sources, AI-assisted document parsing, and structured storage.

## What it does

1. **Scrapes** SDAT (property assessment), Maryland Judiciary Case Search (court dockets),
   and county land records (recorded instruments) using Playwright.
2. **Parses** retrieved documents with Claude to extract lien amounts, priority, parties,
   surplus figures, and claim deadlines.
3. **Stores** results in Supabase for case tracking and pipeline auditing.
4. **Uploads** an evidence packet (raw + parsed documents) to a structured Google Drive folder.
5. **Drafts** a personalised outreach email in Gmail for human review before sending.

## Structure

```
automations/md-mortgage-research/
├── main.py                     # FastAPI app and webhook endpoints
├── scrapers/
│   ├── sdat.py                 # SDAT real property search
│   ├── case_search.py          # Maryland Judiciary Case Search
│   └── land_records.py         # County land record systems
├── parsers/
│   └── document_parser.py      # Claude-powered structured extraction
├── storage/
│   ├── supabase_client.py      # Supabase persistence helpers
│   ├── google_drive.py         # Drive evidence packet upload
│   └── gmail_drafts.py         # Gmail draft creation
├── config/
│   └── maryland_clerks.json    # County clerk contact reference data
├── requirements.txt
├── Dockerfile
├── railway.json
└── .env.example
```

## Setup

```bash
cd automations/md-mortgage-research
cp .env.example .env
# Fill in all values in .env

pip install -r requirements.txt
playwright install chromium

uvicorn main:app --reload
```

## Deployment

Deploy to Railway using the provided `railway.json`. Set all `.env.example` variables
as Railway environment variables before deploying.

## Environment variables

See `.env.example` for the full list of required variables.
