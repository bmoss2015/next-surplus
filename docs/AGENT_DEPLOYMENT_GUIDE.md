# Agent Deployment Guide

Step-by-step reference for deploying a new automation agent on Railway via GitHub Actions.

---

## 1. Create the Agent Folder

```
automations/
└── My_Agent_Name/
    ├── main.py          # FastAPI app — must expose GET /health
    ├── Dockerfile
    ├── requirements.txt
    ├── railway.toml
    └── README.md
```

---

## 2. Dockerfile Template

```dockerfile
FROM python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --with-deps installs all Chromium system dependencies automatically,
# keeping this correct across Debian versions without a hand-maintained apt list.
RUN playwright install --with-deps chromium

COPY . .

ENV PORT=8000
EXPOSE $PORT

CMD ["/bin/sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Why these choices:**
- `python:3.11-slim-bookworm` — stable, small, matches Railway's expected glibc
- No manual `apt-get install` — `playwright install --with-deps` handles everything
- `exec` prefix passes signals properly so Railway can shut down the container cleanly
- `sh -c` with `${PORT:-8000}` allows Railway to inject the `PORT` env var at runtime

---

## 3. railway.toml Template

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "automations/my-agent-name/Dockerfile"

[deploy]
startCommand = "sh -c \"uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}\""
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Common mistake:** Using `CMD ["uvicorn", ..., "--port", "$PORT"]` — shell variable expansion doesn't happen in exec-form JSON arrays. Always use `sh -c "..."` for env var expansion.

---

## 4. requirements.txt — Known-Good Pinned Versions

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
playwright==1.48.0
anthropic==0.40.0
supabase==2.30.0
google-api-python-client==2.154.0
google-auth-httplib2==0.2.0
google-auth-oauthlib==1.2.1
pydantic==2.13.4
httpx==0.28.1
pdfplumber==0.11.4
python-dotenv==1.0.1
```

Pin every package. Unpinned packages cause non-deterministic build failures that are hard to debug.

---

## 5. Railway Environment Variables

Set via Railway dashboard or Railway API. Required for most agents:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not anon) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Set after completing OAuth flow |

**To add env vars via Railway API (when CLI is unavailable):**

```bash
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }",
    "variables": {
      "input": {
        "projectId": "<PROJECT_ID>",
        "environmentId": "<ENVIRONMENT_ID>",
        "serviceId": "<SERVICE_ID>",
        "variables": {
          "MY_VAR": "my_value"
        }
      }
    }
  }'
```

---

## 6. GitHub Actions Workflow Templates

### deploy-status.yml

Triggers on push, waits for Railway to finish deploying, writes `deploy-status.json`.

```yaml
name: Railway Deploy Status

on:
  push:
    branches: [your-branch]
    paths-ignore: ['deploy-status.json', 'test-results.json']

jobs:
  check-deploy:
    if: github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Railway to pick up push
        run: sleep 90

      - name: Query Railway deployment status
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          # Query Railway GraphQL API for latest deployment status
          # See existing .github/workflows/railway-deploy-check.yml for full implementation
          echo "See railway-deploy-check.yml for complete implementation"

      - name: Commit and push deploy-status.json
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add deploy-status.json
          git diff --cached --quiet || git commit -m "chore: update deploy-status.json [skip ci]"
          git push origin your-branch
```

### test-and-fix.yml

Runs comprehensive endpoint tests and writes `test-results.json` for the self-healing loop.

```yaml
name: Test and Fix

on:
  push:
    branches: [your-branch]
    paths-ignore: ['test-results.json', 'deploy-status.json']

jobs:
  test:
    if: github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Run comprehensive endpoint tests
        env:
          SERVICE_URL: https://your-service.up.railway.app
        run: |
          # Test /health
          # Test POST /research/maryland
          # Test GET /status/{job_id}
          # Test POST /oauth/google/start
          # Write detailed results to test-results.json

      - name: Commit test-results.json
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git pull --rebase origin your-branch || true
          git add test-results.json
          git diff --cached --quiet || git commit -m "chore: update test-results.json [skip ci]"
          git push origin your-branch
```

---

## 7. OAuth Setup Steps

### Google OAuth 2.0

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Drive API** and **Gmail API**
3. Create OAuth 2.0 credentials → Desktop application type
4. Set authorized redirect URI to `urn:ietf:wg:oauth:2.0:oob` (for copy-paste flow) **or** your service URL + `/oauth/google/callback`
5. Download `credentials.json` and store values as Railway env vars:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Hit `POST /oauth/google/start` on the running service → get authorization URL
7. Open URL in browser, authorize, copy the code
8. `POST /oauth/google/callback` with `{"code": "<paste-code>"}` → get refresh token
9. Add refresh token as `GOOGLE_REFRESH_TOKEN` Railway env var

**Common OAuth bugs:**
- Using `redirect_uri=http://localhost` when the service is remote — use `urn:ietf:wg:oauth:2.0:oob` for the copy-paste flow
- Forgetting to enable the API in Google Cloud Console (separate from creating credentials)
- Expired or revoked tokens — re-run the OAuth flow to get a new refresh token
- Scopes mismatch — ensure `GOOGLE_OAUTH_SCOPES` matches what you request

---

## 8. Common Pitfalls and Solutions

| Symptom | Root Cause | Fix |
|---|---|---|
| `$PORT` not expanding in CMD | Using exec-form `CMD ["uvicorn", "--port", "$PORT"]` | Use `CMD ["/bin/sh", "-c", "exec uvicorn ... --port ${PORT:-8000}"]` |
| `playwright install` fails with missing deps | Using `apt-get` list that's incomplete or wrong for Bookworm | Remove manual apt installs; use `playwright install --with-deps chromium` only |
| Build succeeds but container exits immediately | `PORT` mismatch — Railway binds a random port | Always use `${PORT}` env var, never hardcode 8000 in CMD |
| `ModuleNotFoundError` for local imports | `COPY . .` is in wrong directory or WORKDIR wrong | Confirm `WORKDIR /app` and `COPY . .` both reference `/app` |
| Supabase `JWT` errors | Using anon key instead of service role key | Set `SUPABASE_SERVICE_ROLE_KEY`, not the anon key |
| OAuth `invalid_grant` on callback | Code already used or expired (codes expire in ~10 minutes) | Re-run `/oauth/google/start` and complete flow without delay |
| Railway shows SUCCESS but `/health` returns 502 | Health check path wrong or app binds wrong port | Confirm `healthcheckPath = "/health"` and app listens on `$PORT` |
| Test loop keeps repeating same failure | Claude fix didn't address root cause | Check `test-results.json` for `endpoint_results` — each endpoint shows exact error |

---

## 9. Self-Healing Loop Behavior

The test-and-fix workflow is designed for autonomous iteration:

1. Push code → Railway builds and deploys
2. `railway-deploy-check.yml` waits for deployment, writes `deploy-status.json`
3. `test-and-fix.yml` tests all endpoints, writes detailed `test-results.json`
4. Claude Code reads `test-results.json`, diagnoses failures, patches code, pushes
5. Loop repeats

**Stop conditions:**
- All tests pass (`"all_passed": true`)
- Same error repeated 3 times (Claude detects loop and escalates)
- 10 total iterations reached

**`test-results.json` structure:**
```json
{
  "all_passed": false,
  "iteration": 3,
  "checked_at": "2025-01-01T00:00:00Z",
  "trigger_sha": "abc123",
  "service_url": "https://...",
  "endpoint_results": {
    "health": { "passed": true, "http_code": "200" },
    "research_maryland": { "passed": false, "error": "HTTP 500: ..." },
    "status": { "passed": true },
    "oauth_start": { "passed": false, "error": "missing authorization_url" }
  },
  "summary": "2/4 endpoints passing"
}
```
