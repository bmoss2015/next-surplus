# Product Build Status & Roadmap - Content

This file is read by the `moss-equity-living-doc` Cloudflare Worker and merged with `CHANGELOG.md` to produce the full Product Build Status & Roadmap. Edit this file when the Roadmap, ADRs, RFCs, or Reference content needs to change. The next auto-rebuild (Monday 9am Central or any `/regenerate` POST) picks up your edits.

The Worker parses this file by `##` section headers. Do not change the four top-level section names. Inside each section, use `###` sub-headers, prose paragraphs, and `- bullet` lists freely.

---

## Roadmap

### Now (Active Work)

- MD research agent: Bright Data or ScrapFly evaluation for DataDome bypass
- MD research agent: replace broken self-healing GitHub Actions workflow
- GitHub Actions build gate / CI pipeline (prompt written 2026-05-12, not yet executed)
- Continue manual outreach phase while gathering conversation data

### Next: Three Priority Workstreams

Each warrants an RFC before building. See the RFCs section below.

**1. Google Drive Auto File Management**
- Auto folder creation per lead under /Moss Equity/Leads/{STATE}/{YEAR}/{LEAD_ID}
- Auto file routing: documents uploaded in the web app mirror to the lead's Drive folder
- Email attachment capture: inbound attachments saved to matching lead's folder when threaded
- Subfolder structure per lead: Agreements, Court Filings, ID and Verification, Research, Settlement Statements, Correspondence
- Bi-directional sync: files dropped into Drive folder appear in web app within 60 seconds
- Stage triggered uploads: on Claim Filed, generate claim packet PDF and save to lead's folder
- Naming convention: LEAD_ID_CATEGORY_YYYYMMDD_ORIGINAL_NAME
- Archive on Won or Lost: lead's folder moves to /Archive/{YEAR}/{LEAD_ID}
- OAuth 2.0 per organization: each org connects its own Drive account
- Background sync worker: Edge function or cron every 60 seconds with idempotency keys

**2. Integrations Tab**
- One-click connect for: Google Drive, Gmail, Google Calendar, Twilio, Mailgun or Postmark, Lob, DocuSign or HelloSign, OpenAI or Anthropic, Excess Elite, Bright Data or ScrapFly, Disify
- Status pills: Connected, Needs Reauth, Failed, Disconnected
- Per organization scope: RLS enforces each org manages its own connections
- Per user permission: Owners and Admins add or remove; Members see only that an integration is connected
- Test connection button: runs small API call and shows pass or fail
- Health monitoring: daily ping; failures flag Needs Reauth and create owner task
- Per org webhook URLs: auto generated for Twilio inbound, Mailgun inbound, Drive push
- Audit log per integration: connect, disconnect, reauth, webhook events logged
- BYO credentials: orgs can bring their own API keys with per-org cost attribution

**3. Multi Tenant Hardening (extends what shipped 2026-05-11)**

Foundation is live (RLS, admin and member roles, email invites). Hardening adds the rest required for safe external signups.

- Sign up flow: new user auto provisioned as Owner of new organization
- Owner and Viewer roles: currently admin and member only; add Owner (full control + billing) and Viewer (read only)
- Multi org membership: user can belong to multiple orgs with switcher
- Per org storage isolation: orgs/{organization_id}/leads/{lead_id}/{filename} path pattern
- Per org webhook URLs
- Per org Gmail or Mailgun sending domain
- Stripe billing: Free (1 user, 50 leads), Pro (5 users, unlimited), Enterprise
- Usage tracking: lead count, message volume, storage GB, AI tokens per org
- Soft and hard limits: 80% warning, 100% block
- Per org encryption keys for stored credentials
- Audit log per org: auth, role, integration, billing, export events
- Data export: Owner can export full org data
- Org deletion: 30 day soft delete with restore, then full purge
- Rate limiting per org and per user
- Structured logging with organization_id and user_id on every log line
- Error tracking with per-org tagging (Sentry or equivalent)

### Soon: Phased Automation Tiers

**Tier 1: Database Only Automations**
- Auto generated Lead ID scoped per org (currently single tenant)
- DNC suppression flag (field exists, suppression logic pending)
- Floor warning tag auto computation
- Stale lead detection
- Redemption date computation from state rules
- Filing deadline computation from state rules

**Tier 2: Single Channel Integrations**
- Manual SMS send via Twilio (composer in Inbox)
- Manual email send via Resend or Mailgun (extend Resend integration)
- Inbox unified threading (match SMS or email to lead_id)
- Document upload checklist auto mark
- Reminder generation (notary 24 hour, claim filed day 30)

**Tier 3: Cadence and Routing**
- SMS outreach cadence: 5 touch with 3, 5, 7 day waits, pauses on reply, Tue-Thu 5-7pm
- Email outreach cadence with bounce handling
- Phone number routing: Phone 1 DNC routes to Phone 2, both DNC creates research task
- Stage progression triggers: reply auto advances Outreach to In Conversation
- Auto task generation: reply 4h no response = priority, notary 24h, With Attorney 7+ days
- Mailer integration via Lob
- 27 touch point cadence: 5 week sequence with SMS, calls, voicemails, social, mail, relatives

**Tier 4: Intelligence and External Workflows**
- AI Conversation Summary (LLM with conversation context, cached)
- Voicemail transcription (Twilio voicemail to transcription service)
- Refresh Research with edit preservation (conflict detection)
- Email to lead ingestion (Gmail or IMAP polling, parser per source)
- E-signature integration via RabbitSign
- Skip trace API integration (pay per lookup, auto populate contacts)
- TruePeopleSearch automated scraping via Zyte or Apify

**Tier 5: Hard / Ongoing / Research Heavy**
- Research Agent for SC, TN, PA, GA inside the web app (4-6 weeks each)
- Real time conversation updates via Supabase Realtime + push notifications
- Mobile design and PWA (responsive, installable, offline read)
- Multi channel campaign engine (SMS + email + mailers with branching)
- AI powered duplicate detection on imports

### Later (Backlog Ideas Not Yet Scoped)

- Multi state per org configuration (different recovery fees per state)
- Client facing claim portal (claimants see status)
- Attorney portal (attorneys see only assigned cases)
- Bulk research from triage view
- Predictive analytics in Reports
- AI suggested replies
- Native mobile apps (PWA first)
- Affiliate program for the web app SaaS
- Public landing for the web app SaaS with feature comparison

---

## Backlog

### Critical (Blockers)

- Add maxDuration or batching for large CSV imports (Vercel Hobby plan function timeout risk)
- GitHub Actions build gate / CI pipeline (prevent broken builds from reaching production)

### High Priority

- RFC: write before building Google Drive Auto File Management
- RFC: write before building Integrations Tab
- RFC: write before completing Multi Tenant Hardening
- Tier 1 database automations remaining
- Reports module beyond basic counts
- Backfill any missing entries in CHANGELOG.md from git history

### Medium Priority

- Inbox with SMS plus email threading (Twilio + Resend for outreach)
- Cadence engines (SMS, email)
- Stage progression triggers
- Auto task generation rules
- Mailer integration via Lob
- Voicemail transcription
- E-signature integration (RabbitSign chosen)
- Twilio per state phone numbers (UI exists, integration pending)

### Known Bugs / Issues

- Stray NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel env vars (unused; safe to remove)
- Vercel Preview environment incomplete (only ANON_KEY set)
- Jest worker crash on import (prompt written 2026-05-12, fix not yet executed)

### UI Polish (Lower Priority)

- Empty states consistency review
- 404 and error pages
- Loading states across all pages
- Mobile responsive pass before v2.0 PWA work

---

## Architecture Decisions

### ADR 001: Use Supabase RLS for Multi-Tenant Isolation (not Schema Per Org)

Decision: Single shared database with Row Level Security policies scoped by organization_id.

Why: Lower cost, simpler ops, faster to ship. Schema per org adds significant maintenance overhead. RLS is the standard Supabase pattern.

Trade off: A misconfigured RLS policy could leak data across orgs. Mitigation: every table has RLS enforced; penetration testing required before public signups.

Decided 2026-05-11.

### ADR 002: Resend API for Email Instead of Supabase SMTP

Decision: Send all transactional email via Resend API directly. Bypass Supabase Auth's built-in SMTP.

Why: Supabase SMTP fails silently in connection to Resend (known bug). Direct API call is reliable and gives visibility into delivery.

Trade off: Custom code path for invite email. Two step: inviteUserByEmail creates the account; Resend sends the email.

Decided 2026-05-12T18:43 via Fix OOOOO.

### ADR 003: Single Database, Two Supabase Projects (Staging + Production)

Decision: Maintain separate Supabase projects for staging (sghfmudgnddybsayfqbd) and production (qvyhdexoicoppgrvvtov). Third project (hkubwxpyyejxffncxrez) is unrelated automations and never touched by web app migrations.

Why: Standard SaaS pattern. Eliminates risk of dev work hitting live data.

Trade off: CLI link state drifts between projects. Solved by adding standing rule to CLAUDE.md to verify link state before every DB command.

Decided 2026-05-11.

### ADR 004: Liens Table Replaces Junior Liens Concept

Decision: Removed the concept of "junior liens" as a separate field. Replaced with a Liens table where each lien has name + amount, multiple liens propagate to total surplus calculation.

Why: Simpler mental model. All liens are liens to be subtracted from the surplus.

Decided 2026-05-12T12:31.

### ADR 005: Recovery Type Is Read-Only From Lookup Table

Decision: state_recovery_rules table determines recovery_type from state + sale_type. Never user editable.

Why: Recovery type (judicial vs non judicial) is determined by state statute, not user preference. SC mortgage foreclosure is always judicial. SC tax sale is always non-judicial.

Decided 2026-05-12T18:43.

### ADR 006: Lead ID Format STATE-SALETYPE-YEAR-SEQUENCE

Decision: SC-TAX-2025-0247 format generated by database function on insert. Currently global; will scope per organization in next phase.

Why: Human readable, sortable, encodes useful metadata.

Decided 2026-04-30.

### ADR 007: Confirmed Surplus Supersedes Calculated Surplus

Decision: active_surplus hierarchy = confirmed_surplus first, then estimated_surplus if closing_bid is not null, then source_surplus. Calculated Surplus dims with strikethrough when Confirmed Surplus is set.

Why: Operator may confirm exact surplus via court records that differs from auto calculation. The confirmed value is authoritative.

Decided 2026-05-12T12:31.

### ADR 008: One Commit Per Fix in Git

Decision: Every fix in a commit with descriptive message (Fix LABEL: Description). Never bundle multiple fixes in one commit.

Why: Surgical reverts. If Fix 12 breaks production, revert only that commit; everything else stays.

Decided 2026-05-12T12:31. Standing rule in CLAUDE.md.

### ADR 009: RabbitSign for E-Signature (Not DocuSign)

Decision: Use RabbitSign when e-signature integration ships.

Why: Free, validated by another operator in the surplus recovery space. DocuSign cost not justified at current volume.

Decided 2026-05-11.

### ADR 010: Three Doc System with Git Hook Auto-Sync

Decision: Maintain three synced documents (CLAUDE.md, CHANGELOG.md, Product Build Status & Roadmap auto-generated by Cloudflare Worker). A git post-commit hook in .git/hooks/post-commit automatically appends every commit to CHANGELOG.md under [Unreleased].

Why: Three docs serve distinct audiences (developer onboarding, public release notes, strategic view). A git hook eliminates manual sync overhead and human forgetfulness. Real timestamps from git make the changelog authoritative.

Trade off: Hook lives in .git/hooks/ which is not versioned by git. Must be re-installed on every fresh clone. Mitigation: install script in repo at scripts/install-hooks.sh; CLAUDE.md instructs to run it after clone.

Decided 2026-05-26.

### ADR 011: Product Name and Legal Entity

Decision: Customer-facing product name is "Moss Equity Partners - Web App". Legal entity is Moss Equity Partners LLC, a separate registered LLC. Mossy Land LLC is an unrelated company and never referenced in any product or web app context.

Why: Eliminates confusion. The Supabase staging project label "Moss Equity Operations Portal" is internal only and predates the product naming decision.

Decided 2026-05-26.

### ADR 012: Product Build Status & Roadmap Uploaded to Google Drive (not just R2)

Decision: The auto-generated Product Build Status & Roadmap is uploaded to a dedicated Google Drive folder ("Moss Equity Partners - Product Build Status & Roadmap") on every rebuild, in addition to being stored in Cloudflare R2.

Why: Claude Cowork connects to Google Drive, not Cloudflare R2. The Drive copy is the one Cowork (and Bree) reference daily. R2 stays as the technical backup and stable URL fallback.

Trade off: One extra dependency (Google Drive API). Mitigation: service account with scoped permissions on a single folder; rotation reminders set.

Decided 2026-05-26.

---

## RFCs Needed

RFC = Request for Comments. A 1-2 page design doc written BEFORE building a major system. Forces clear thinking about data model, edge cases, rollout, trade-offs. Each RFC becomes /docs/rfc/RFC-NNN.md in the repo.

### RFC Template

1. Problem: What problem are we solving? One paragraph.
2. Goals and Non-Goals: What this MUST do. What this WILL NOT do.
3. Proposed Design: Data model. API endpoints. UI changes. Background jobs. External services.
4. Alternatives Considered: At least 2 alternatives with why rejected.
5. Trade-offs and Risks: What does this make worse? What could go wrong? Mitigation?
6. Rollout Plan: Migrations needed. Feature flag? Backfill? Staging test plan?
7. Open Questions: Things you don't know yet.

### RFC 001: Google Drive Auto File Management

Open questions to answer before building:

- How are OAuth refresh tokens encrypted and rotated per org?
- What happens when a user's Drive account hits storage limits?
- How do we detect and resolve conflicts when both web app and Drive have changes?
- What is the failure mode when Drive API is down or rate limited?
- Should the worker be Vercel Cron or Supabase Edge Function?

### RFC 002: Integrations Tab Architecture

Open questions to answer before building:

- Where do per-org encrypted credentials live?
- How do per-org webhook URLs route to the correct organization?
- What is the auth model for the Test button?
- How do BYO API keys attribute cost back to the org?
- What's the disconnect flow when an integration has pending jobs?

### RFC 003: Multi-Tenant Hardening

Open questions to answer before building:

- Owner vs Admin distinction (billing access, org deletion permissions)
- Multi-org user model (one user, many orgs, switcher logic)
- Storage path migration plan for existing org data
- Stripe billing webhooks and subscription lifecycle
- Rate limiting strategy (Vercel-level vs application-level)
- Audit log volume (storage costs at 100 orgs, 1000 orgs)

### RFC 004: Outreach Engine (Inbox, Cadences, Triggers)

Open questions to answer before building:

- Twilio number model: pool per org, per state, or operator-purchased?
- Inbound webhook routing to correct lead
- Cadence state machine: pause, resume, exit triggers
- Compliance: TCPA, DNC, time-of-day per state
- Transition plan to shut GHL off

---

## Reference

### Product Naming

- Customer-facing product name: Moss Equity Partners - Web App
- Legal entity: Moss Equity Partners LLC
- Public URL: portal.mossequitypartners.com
- Repo name: bmoss2015/MossEquityPartners (legacy, not user-facing)
- Vercel project: moss-equity-portal (legacy, not user-facing)
- Internal Supabase staging label: "Moss Equity Operations Portal" (NOT the product name)
- NOT affiliated with Mossy Land LLC (unrelated company)

### Environment Mapping

- Staging Supabase: sghfmudgnddybsayfqbd (test data, source of truth for local dev)
- Production Supabase: qvyhdexoicoppgrvvtov (live database, migrations 0080-0094 applied)
- Automations Project: hkubwxpyyejxffncxrez (MD research agent — NEVER push web app migrations here)
- GitHub Repo: bmoss2015/MossEquityPartners (main branch is source of truth)
- Vercel Production: moss-equity-portal.vercel.app (aliased to portal.mossequitypartners.com)
- Custom Domain: portal.mossequitypartners.com (CNAME via Cloudflare, SSL active 2026-05-12)
- Local Dev: C:\Users\info\moss-equity-portal (npm run dev)
- MD Research Agent: md-mortgage-research-production.up.railway.app (Railway)
- Product Build Status & Roadmap Worker: moss-equity-living-doc.holy-thunder-2538.workers.dev (Cloudflare)
- Product Build Status & Roadmap Google Drive: folder "Moss Equity Partners - Product Build Status & Roadmap"

### Tech Stack

- Frontend: Next.js 16.2.6 (App Router), React 19, Tailwind CSS
- Database + Auth + Storage: Supabase
- Icons: Tabler. Font: Inter. Palette: petrol gradient #0a3d4a to #1a8a9c, charcoal text #0f1729
- Email: Resend API (transactional). GHL still handles outreach SMS / email.
- Hosting: Vercel (web app). Railway (MD research agent). Cloudflare (Product Build Status & Roadmap Worker).
- DNS: Cloudflare
- Storage: Supabase Storage (Google Drive sync planned)
- Build assistant: Claude Code for solo development

### Deployment Process

- Local: cd C:\Users\info\moss-equity-portal && npm run dev. Points at staging.
- Staging push: verify link is staging, npx supabase db push --linked
- Production push: link to production, push, vercel --prod, relink to staging
- Git workflow: one commit per fix with descriptive message
- Timestamp capture: automatic via git post-commit hook
