# Mail Failure Handling

A real plan for every way a mail send can go wrong, with what the system
should do for each. Anchored on how Lob, USPS, and modern mail-house
tools structure their error handling.

## Failure modes & responses

| Failure | Owner | Detection | Response |
|---|---|---|---|
| **Provider outage (C2M / Lob)** | Provider | `sendMail` returns `ok: false` with HTTP 5xx | Surface "Provider unavailable, try again" in modal. **No retry loop in the action** — user retries manually. Background: auto-retry queue (future) with exponential backoff capped at 3 tries. |
| **Auth failure (API key revoked / rotated / expired)** | Moss admin | `sendMail` returns 401/403 from provider | Surface in modal. **Email alert to admin** (`info@mossyland.com`) — they need to rotate the key in Vercel env. Don't auto-retry; the failure persists across attempts until key is rotated. |
| **Rate limit hit** | Provider quota | HTTP 429 with `Retry-After` header | Surface "Send throttled, try again in N seconds" in modal. Future: queue with `Retry-After`-respecting auto-retry. |
| **Bad address (USPS undeliverable)** | Recipient data | Provider returns 422 with validation error, OR webhook fires `returned_to_sender` after physical send | Pre-send: USPS address validation (see below) catches most before send. Post-send: webhook → `mail_returned` → Needs Attention card on the lead → Update Address & Resend flow. |
| **Provider billing issue (account suspended)** | Moss admin | 403 with billing-specific error | Surface in modal. **Email alert to admin** with the exact provider message. Block further sends until resolved. |
| **Network timeout** | Network | Fetch throws / `AbortController` fires | Surface "Send timed out, try again" in modal. No auto-retry (idempotency risk — provider may have processed the request). Manual retry. |
| **Lob bank account decertified** | Bank | Webhook `bank_account.un_verified` OR check create returns 422 | Mark `mail_bank_accounts.status = 'unverified'`. **Block all check sends** with that bank until re-verified. Email alert to admin. |
| **Template render failure** | Internal | `fillDocxTemplate` returns error before provider call | Surface in modal with the docxtemplater error message. User fixes template merge fields and retries. No persist. |
| **Org settings missing (no address, no company name)** | Org admin | Validation gate in `sendMail` returns early | Block send. Surface "Complete Company Address / Name in Settings" with link. (Already implemented.) |
| **Empty recipients / body** | User input | Validation gate in `sendMail` returns early | Block send with clear error in modal. (Already implemented.) |

## Pre-send validation (the most important leg)

The biggest avoidable cost is sending mail to bad addresses. Industry
standard: validate every address before submitting to the provider.

### USPS address validation (free, ~50ms per address)

USPS Address Information API ([docs](https://www.usps.com/business/web-tools-apis/address-information-v3-1a.pdf))
returns:
- `DPV Confirmation` — does the address physically exist
- Normalized address (so we send what USPS expects)
- ZIP+4

Recommended flow:
1. User opens Send Mail modal, fills/picks recipient address
2. Before "Send" button is enabled, hit USPS API for validation
3. If DPV confirms: show green checkmark, allow send
4. If DPV fails or partial: show warning with the normalized
   suggestion and let user accept or override
5. If override + send fails downstream, that's on the user

Alternative: Lob has their own address validation endpoint
(`POST /v1/us_verifications`) — same DPV data, simpler integration since
we already authenticate to Lob. Cost: ~$0.20 per verification (Developer
tier). USPS is free but harder to integrate.

**Recommendation:** start with Lob US Verifications since auth is already
in place. Switch to USPS direct only if verification volume justifies
the integration work.

## Alerting matrix

| Severity | Channel | Who | Examples |
|---|---|---|---|
| **P0 — blocks all mail** | Email to admin + portal banner | `info@mossyland.com` | Auth failure, billing suspension, bank decertified |
| **P1 — blocks single piece** | Drawer error message + bell notification | Sender | Provider rejection, USPS undeliverable |
| **P2 — informational** | Activity log + bell notification | Sender | Delivered, Returned, In Transit transitions |

Today: P1 + P2 are wired. P0 (admin email + portal banner for system-level
failures) is the next gap to close. Implementation: a `mail_health` table
with `status` + `last_error` + `last_checked_at`, updated by a daily cron
that pings provider health endpoints. Banner on `/mail` if status is not
'healthy'.

## Retry policy

| Failure | Auto-retry? | Backoff | Max attempts |
|---|---|---|---|
| 5xx from provider | Yes (future) | Exponential, 30s / 2min / 10min | 3 |
| 429 rate limit | Yes (future) | Honor `Retry-After` header | 3 |
| Network timeout | No | — | Manual |
| 4xx validation | No | — | Manual (user must fix data) |
| Auth (401/403) | No | — | Admin fixes key |

**Current state:** no auto-retry. All failures surface to the user
immediately. This is the safer default — auto-retry on the wrong failure
type causes duplicate sends. Build the retry queue only after we
understand the failure distribution from real traffic.

## Monitoring & dashboards

Recommend a `/admin/mail-health` page (admin-only) that surfaces:
- Provider health pings (last 24h success rate per provider)
- Recent failed sends with full error trace
- Webhook delivery stats (are we receiving the events?)
- Cost vs. expected for the month

Adjacent to the harness page Bree already uses. Not required for v1
but useful once volume grows.

## The minimum viable subset

If we ship one thing from this doc, it's **pre-send Lob address
verification**. That single integration eliminates ~80% of returned
pieces (industry estimate for direct mail to surplus-recovery lead
lists, which tend to have stale county-record addresses). Everything
else in this doc is fine to ship incrementally as failures surface.

The flow:
1. Add `lobVerifyAddress({ line1, city, state, postal_code })` →
   returns `{ deliverable: bool, normalized?: { line1, city, state, zip4 } }`
2. Send Mail modal hits it after the user picks an address
3. Block "Send" button with a clear message until address is deliverable
4. Show the normalized form so the user accepts the USPS-canonical version

This is a discrete piece of work (~3-4 files, ~150 LOC). Worth doing
before any high-volume sending starts.
