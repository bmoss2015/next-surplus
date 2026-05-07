# Project Conventions for Claude Code

## Stack Defaults

| Layer | Technology |
|---|---|
| Runtime | Python 3.11 |
| API framework | FastAPI |
| Database / storage | Supabase |
| Browser automation | Playwright (Chromium) |
| AI | Anthropic API (claude-sonnet-4-6 default) |
| External data | Google APIs (Drive, Gmail) |
| Hosting | Railway |

## Folder Structure

```
MossEquityPartners/
├── automations/
│   └── [Agent_Name]/          # One folder per automation agent
│       ├── main.py
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── railway.toml        # or railway.json
│       └── README.md
├── shared/                    # Shared utilities imported across agents
├── docs/                      # Human-readable guides and references
└── .github/workflows/         # CI/CD — deploy-status, test-and-fix loops
```

## Naming

- **Folders**: Proper case for automation names (`Md_Mortgage_Research` → use kebab-case for Railway service names, e.g. `md-mortgage-research`)
- **Python files**: `snake_case.py`
- **GitHub Actions workflows**: `kebab-case.yml`
- **Environment variables**: `SCREAMING_SNAKE_CASE`

## Before Starting Any New Agent

Read `docs/AGENT_DEPLOYMENT_GUIDE.md` first. It contains:
- Working Dockerfile and `railway.toml` templates
- Known-good pinned dependency versions
- GitHub Actions workflow templates for deploy-status and self-healing test loops
- OAuth setup steps and common pitfalls

## Deployment Pattern

**Always use the self-healing GitHub Actions test loop.** The loop:
1. Pushes code to the branch
2. `railway-deploy-check.yml` waits for Railway to finish deploying and writes `deploy-status.json`
3. `test-and-fix.yml` runs comprehensive endpoint tests and writes `test-results.json`
4. On failure, Claude Code reads `test-results.json`, patches the code, and pushes again
5. Loop repeats until all tests pass, the same error appears 3 times, or 10 iterations are reached

Never manually verify deployments by curling endpoints or watching Railway logs during a self-healing loop unless the loop itself is broken. The loop handles it.
