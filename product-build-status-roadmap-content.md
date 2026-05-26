# Moss Equity Partners - Web App: Product Roadmap Content

This file is the source content for the auto-generated Product Build Status & Roadmap document. The Cloudflare Worker reads this file every Monday at 9am Central (and on demand) and generates the doc that lands in the Shared Drive.

To update this file, use the `/roadmap` or `/docs` slash command in Claude Code rather than editing directly. See `.claude/skills/roadmap/SKILL.md` for how that works.

The Worker parses by `##` headers. Do not change the section names below. Add new bullets under the appropriate section.

---

## Product Overview

Moss Equity Partners - Web App is the operations platform for surplus funds recovery firms. It centralizes lead intake, owner research, outreach, contracts, and claim filing into one workspace so operators can pursue more deals with less manual work. Built for solo operators and small teams, designed to scale to multi-state firms with dozens of users.

---

## Current State

Internal alpha live at portal.mossequitypartners.com. Bree and Rik are using it daily on real leads. Multi-tenant foundation shipped — the platform is structurally ready for additional firms to use, pending hardening and Stripe billing integration before public availability.

Production launched 2026-05-12. Currently shipping fixes and feature additions daily through Claude Code with auto-deploy to Vercel.

---

## Q2 2026

Active priorities for the current quarter (April - June 2026).

- GitHub Actions CI build gate to prevent broken builds from reaching production
- Google Drive auto file management — lead folders created and synced automatically
- Integrations Tab — one-click connect for the third-party services the platform depends on
- Multi-tenant hardening — Owner and Viewer roles, Stripe billing, usage tracking, per-org isolation polish
- Maryland research agent DataDome bypass evaluation (Bright Data vs ScrapFly)

---

## Q3 2026

Planned workstreams for July through September 2026.

- Inbox — SMS and email threading directly in the platform (replaces GoHighLevel for outreach)
- Outreach cadences — automated SMS sequences with reply detection and pause logic
- Phone routing — automatic Phone 1 to Phone 2 fallback on DNC, research task on full DNC
- Stage progression triggers — replies auto-advance leads through the pipeline
- Automated task generation — system creates follow-up tasks based on activity rules
- E-signature integration via RabbitSign
- Skip trace API integration for pay-per-lookup contact enrichment

---

## Q4 2026

Planned workstreams for October through December 2026.

- Direct mail integration via Lob
- Voicemail transcription
- AI conversation summaries on demand
- Research agents inside the platform for SC, TN, PA, GA
- Public beta launch with gated signup and paid plans active
- Multi-channel campaign engine combining SMS, email, and direct mail

---

## 2027+ Vision

Direction items beyond 2026. Subject to change as priorities clarify.

- Mobile and Progressive Web App — installable, offline-friendly for read operations
- Client-facing claim portal so claimants can see status of their case
- Attorney portal so attorneys see only their assigned cases
- Multi-state configuration per organization with different fee structures per state
- Bulk research from triage view
- Affiliate program for the platform
- Public marketing site with feature comparison and signup
