# MD Mortgage Research Agent — Local Testing Guide

Test the Maryland mortgage research agent locally on Windows using PowerShell before pushing to Railway.

---

## Prerequisites

- Python 3.11+ installed ([python.org](https://python.org))
- PowerShell 5.1+ (built into Windows 10/11)
- Git (to pull latest)

---

## Quick Start (10 minutes)

### 1. Pull latest and navigate to the folder

```powershell
git pull
cd automations\md-mortgage-research
```

### 2. Set up environment variables

```powershell
Copy-Item .env.template .env
notepad .env
```

Fill in all the values — see the [Credentials Reference](#credentials-reference) section below.

### 3. Run setup (one-time)

```powershell
.\run-local.ps1 setup
```

This creates a `.venv`, installs all Python packages, and installs the Playwright Chromium browser.

### 4. Run your first test

```powershell
.\run-local.ps1 sdat
```

---

## Running Individual Tests

Each test runs standalone against real external services.

| Command | Test | What it does |
|---------|------|-------------|
| `.\run-local.ps1 sdat` | `test_sdat.py` | SDAT property lookup — 4044 Hanson Oaks Dr, Prince George's |
| `.\run-local.ps1 case` | `test_case_search.py` | Maryland Case Search — Sarah Moore, Prince George's |
| `.\run-local.ps1 land` | `test_land_records.py` | mdlandrec.net — Sarah Moore, Prince George's (needs login) |
| `.\run-local.ps1 supabase` | `test_supabase.py` | Creates a test lead, reads it back, deletes it |
| `.\run-local.ps1 drive` | `test_drive.py` | Uploads a sample file to Google Drive, then deletes it |
| `.\run-local.ps1 pipeline` | `test_full_pipeline.py` | Full end-to-end: all scrapers + Supabase + Drive |

### Run all tests in sequence

```powershell
.\run-local.ps1 all
```

### Run a test directly with Python (for faster iteration)

```powershell
.\.venv\Scripts\Activate.ps1
python tests\test_sdat.py
```

---

## Viewing Debug Screenshots

Every test saves Playwright screenshots on failure (and at key steps) to the `debug\` folder.

```powershell
# Open the debug folder in Windows Explorer
explorer debug

# List screenshots from PowerShell
Get-ChildItem debug\*.png | Sort-Object LastWriteTime
```

Screenshots are named with a prefix matching the test step, e.g.:
- `sdat_01_home.png` — SDAT homepage loaded
- `sdat_05_results.png` — Results page
- `sdat_error_timeout.png` — What the page looked like when it timed out

The `debug\` folder is in `.gitignore` — screenshots won't be committed.

---

## Recommended Test Order

Start with the tests that don't require special credentials, then work up to the full pipeline:

1. **`sdat`** — No credentials needed, confirms Playwright + networking works
2. **`case`** — No credentials needed, confirms court data access
3. **`supabase`** — Tests DB connection (needs Supabase creds)
4. **`drive`** — Tests Google auth (needs OAuth creds)
5. **`land`** — Tests mdlandrec.net login (needs MDLANDREC creds)
6. **`pipeline`** — Full run (uses whatever creds are set, skips the rest)

---

## Credentials Reference

Open `.env` and fill in:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_SECRET_KEY` | Supabase dashboard → Project Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `GOOGLE_OAUTH_CREDENTIALS_JSON` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Download JSON → paste as single line |
| `GOOGLE_REFRESH_TOKEN` | Obtained after completing OAuth flow once |
| `MDLANDREC_EMAIL` | Your mdlandrec.net account email |
| `MDLANDREC_PASSWORD` | Your mdlandrec.net account password |

Tests that are missing credentials will print `[SKIP]` and exit with code 0 — they won't fail the suite.

---

## Troubleshooting

**PowerShell execution policy error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Playwright browser not found**
```powershell
.\.venv\Scripts\Activate.ps1
playwright install chromium
```

**`supabase` or other packages missing**
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Test times out / screenshot shows a blank page**
- Check your internet connection
- The target site may be temporarily down
- SDAT and Case Search have rate limits — wait 30 seconds and retry

**Google Drive auth fails**
- Make sure `GOOGLE_REFRESH_TOKEN` is set correctly
- Refresh tokens expire if unused for 6 months — re-run the OAuth flow to get a new one

---

## File Structure

```
automations/md-mortgage-research/
├── run-local.ps1          # Main entry point for all local tests
├── requirements.txt       # Python dependencies
├── .env.template          # Copy → .env and fill in credentials
├── .env                   # Your credentials (never committed)
├── README.md              # This file
├── debug/                 # Playwright screenshots (auto-created, gitignored)
└── tests/
    ├── test_sdat.py           # SDAT property scraper
    ├── test_case_search.py    # Maryland Case Search scraper
    ├── test_land_records.py   # mdlandrec.net scraper
    ├── test_supabase.py       # Supabase read/write test
    ├── test_drive.py          # Google Drive upload test
    └── test_full_pipeline.py  # End-to-end pipeline test
```
