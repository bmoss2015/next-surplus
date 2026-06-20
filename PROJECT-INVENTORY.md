# Moss Equity Portal — Project Inventory

What's actually built and shipped today. Source of truth for "is this feature already in the product?" questions. Used by the `/roadmap` and `/architecture` skills to ground their recommendations and prevent proposing features that already exist or that conflict with what's deployed.

**Last refreshed:** 2026-05-28

**Refresh policy:** Update this file alongside `CHANGELOG.md` and `pending-living-doc-updates.txt` whenever a Fix LABEL commit ships a new user-visible feature, removes a feature, or changes an existing user-facing capability in a way the inventory needs to reflect. Do not refresh for pure bug fixes, copy tweaks, or internal refactors.

For a full re-survey, the assistant should run an Explore agent across `src/app/(app)/`, settings actions, and recent CHANGELOG entries, then rewrite this file.

---

## Top-level routes

All under `src/app/(app)/`.

- `/` — Dashboard
- `/leads` — Leads kanban (default), table view at `/leads/table`
- `/leads/[id]` — Lead detail
- `/claims` — Subset of leads in stages `with_attorney`, `claim_filed`, `won`
- `/tasks` — Task list across all leads
- `/inbox` — Email + SMS inbox with threading
- `/mail` — Mail dashboard (sent checks and letters)
- `/mail/templates` — Mail template editor
- `/playbooks` — Research template kanban boards
- `/reports` — Pipeline, conversion, and mail metrics
- `/imports` — CSV lead imports and import history
- `/settings` — Settings hub (admin-only sections + per-user sections)
- `/owner` — Owner-only billing and pricing view
- `/admin/*` — Internal utilities (mail mockups, phone validation test, error preview)

---

## Leads

- Kanban board with drag-to-change-stage
- Table / list view
- Custom stages (configurable per org)
- Stage change activity log
- Lost reasons (custom codes via Settings)
- CSV import flow

## Lead detail

Tabs available on `/leads/[id]`:

- Overview
- Property Info
- Contacts (owners, phones, emails, relatives, custom contacts, attorney assignment)
- Playbook (research template step tracker)
- Documents (uploaded PDFs, images, categorized)
- Mail (history of sent checks and letters to this lead)
- Notes (thread)
- Tasks (open and completed, linked to lead)
- Conversation (Gmail threads + QUO SMS scaffolded, per-thread unread counts)
- Activity (timestamped log of all lead changes)

Inline editable fields on Overview: confirmed surplus, recovery fee percent, attorney cost.

Surplus calc: Est. Net To You = (estimated surplus × recovery fee percent) − attorney cost.

---

## Mail Module

- Send check via Lob — live in production since May 2026
- Send letter via Lob — live, Click2Mail code retained as rollback but not on active path
- Templates with merge fields, editable in `/mail/templates`
- Bank accounts (Lob), managed in Settings, microdeposit verification flow
- Address validation via Lob, real-time during compose
- Provider webhooks (Lob delivery status reconciliation)
- Mail dashboard with 30-day sent history and stats by type

## Email / Inbox

- Gmail OAuth (per-user, connected in Settings → Email Accounts)
- Gmail thread fetch and threading in `/inbox`
- `/inbox` is per-user. Each teammate sees only conversations from their own connected accounts. Threads linked to a lead are still visible to every teammate on that lead's Conversations tab.
- Send / receive via Gmail API
- Vercel cron `/api/cron/email-sync`, pinged externally by Cloudflare worker "Moss Equity Email Poller" every 2 minutes for near-real-time updates
- SMS — Inbox UI scaffolded (channel exists, send path wired against an internal-only QUO/OpenPhone test setup the owner used to prototype). The production customer-facing SMS provider has not been chosen yet and will NOT be QUO. Likely Twilio or Telnyx; A2P 10DLC registration is the long pole regardless of provider.
- Filters: All / Unread / Email / SMS / Unlinked

## Calling / SMS

- Phone numbers displayed in Contacts (formatted as (555) 555-5555)
- Click-to-call: not built
- SMS send path: wired
- SMS inbound: poller not live
- Call logging: not built
- Phone validation via Clearout HLR Lookup v2, env-gated by `PHONE_VALIDATION_ENABLED`, credit pool model

## Playbooks (research templates)

- `/playbooks` lists every template with active lead count
- `/playbooks/[id]` renders kanban per template, one column per step, cards for each lead currently on that step
- Per-lead step tracking with days-in-step (>7 days flagged red)
- Template configuration in Settings → Research Templates

---

## Settings sections

All under `/settings`. Admin-only unless noted.

- Profile (all users) — name, email, password
- Team (admin) — invite members, admin / member roles
- Attorneys (all users) — list, default costs, states covered, assign on leads
- Lost Reasons (admin) — custom loss codes
- Stages (admin) — custom pipeline stages (name, position, kind)
- Custom Roles (admin) — custom contact role labels
- Mail Settings (admin) — sender name, reply-to, test mode toggle
- Mail Bank Accounts (admin) — Lob bank accounts, microdeposit verification
- Mail Templates (admin) — letter and check templates with merge field picker
- Lob Pricing (admin) — sync live pricing from Lob, track spend per mail type
- Customer Pricing (admin) — org-wide fee structure
- Company Profile (admin) — org name, logo, signature image
- Billing (admin) — view customer pricing summary
- Defaults (admin) — default recovery fee percent, lost reason, attorney
- Email Accounts (all users) — Gmail OAuth connections (per-user)
- Notification Preferences (all users) — email alerts configuration
- Research Templates (admin) — playbook step definitions

## Dashboard and reports

- `/` Dashboard — auto-funnel by stage kind, KPI strip
- `/reports`:
  - Pipeline by State (count + total surplus per state)
  - Conversion Funnel (leads per stage, conversion percentages)
  - Mail Stats (30-day sent volume across checks and letters)
  - Outcome Summary (won, lost, closed)
- `/owner` — billing-focused (customer pricing, 30-day mail costs)
- Lead-detail metric strip — estimated surplus, confirmed surplus, est. net to you, recovery fee percent

## Tasks

- Create via lead detail Tasks tab or standalone `/tasks` + New
- Assign to any team member
- Due dates
- Open / completed status
- Filter by lead or overdue-only
- Open count badges on Tasks tab and Conversation tab

## Multi-tenancy

- Org isolation via Supabase RLS (auth.uid + org_id on every table)
- Roles: Admin, Member, Owner (Owner role exists for billing view only)
- Permission boundary: Admins manage team / settings / pricing, Members see leads + templates
- Invites sent via Resend transactional email

---

## Background workers and external services (in production)

- Gmail API — OAuth + Vercel cron `/api/cron/email-sync`, also pinged by Moss Equity Email Poller (CF Worker) every 2 minutes
- Lob — checks AND letters since May 2026, API + webhooks for delivery status reconciliation
- Click2Mail — letter code retained for rollback, not on active path
- Resend — team invite emails, notification emails
- Clearout — phone HLR validation (env-gated, credit pool)
- Gotenberg — docx→PDF rendering (GCP Cloud Run)
- Internal-only QUO (OpenPhone) prototype — phone number used by the owner for prototyping, SMS send path wired against it. NOT the production direction. The customer-facing SMS / voice provider will be chosen separately (Twilio or Telnyx are the candidates).
- Vercel Cron jobs — email-sync, lob-pricing-sync, mail reconcile (auth via `CRON_SECRET` header)
- Cloudflare Workers:
  - Moss Equity Email Poller (pings Gmail sync)
  - Moss Equity Living Doc (weekly roadmap rebuild from `product-build-status-roadmap-content.md`)
- Maryland research agent — separate FastAPI service on Railway, separate Supabase project `hkubwxpyyejxffncxrez`, uses Bright Data Web Unlocker for DataDome bypass on Maryland Judiciary Case Search

---

## Partial / Ambiguous / Not built

- **SMS (customer-facing):** Inbox UI threads display, send path wired against an internal QUO prototype only. Production provider is not chosen yet (Twilio or Telnyx are the candidates) and QUO will NOT be the customer-facing provider. A2P 10DLC registration is required before launch regardless of provider.
- **Scripts:** A Settings section was scaffolded once but no user-facing editor exists today
- **Click-to-call:** Phone numbers are display-only, no dialer wired
- **Plaid bank verification:** Planned, not built (would layer on Lob's existing microdeposit flow to skip the 1–3 business day wait)
- **Stripe billing:** Code shipped (checkout session, signed webhook handler, customer portal handoff, founder-lock daily cron). Going live requires the Stripe Dashboard product + two recurring prices (beta_founder monthly $49, beta_founder annual $470) and the corresponding Vercel env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, the two price IDs).
- **Public marketing website:** `nextsurplus.com` serves the marketing site; `app.nextsurplus.com` is the authenticated portal
- **Onboarding flow for new orgs / new users:** Shipped Fix 15 (2026-06-17). 4-step `/onboarding/[step]` wizard (Firm / Import / Inbox / Team) with skip allowed on 2-4, runs once after a fresh signup, never after login. Paired with new `/signup` page, `/signup/verify` Stripe polling page, and 10 anchored auth mockup variants at `/signup-mockups` and `/login-mockups`.
- **E-signature:** Not built, provider not yet chosen
- **Outreach cadences (automated SMS sequences):** Not built
- **Phone routing (DNC-aware fallback):** Not built
- **Skip trace API integration:** Not built
- **Stage progression triggers (reply auto-advance):** Not built
- **Automated task generation rules:** Not built
- **Google OAuth app verification:** Not done; users see the "unverified app" warning when connecting Gmail
- **Additional email providers (Microsoft 365, Outlook, IMAP):** Not built; Gmail is the only mailbox connection today

---

## Direct competitor reference (for roadmap pricing decisions)

- **Excess Elite** and **surplusfundslist.com** — both price a CRM-only tier at $97–99/month that bundles calling + SMS + AI + e-sign. Premium tiers ($300–$1,299) add a lead database (Moss Equity does not offer a lead database).
- The Moss Equity SaaS target launch price point is $97–99 to compete head-on.
