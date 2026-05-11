# Moss Equity Portal — v0 Implementation Guide

This guide tells you exactly what to build for v0 and what to leave out. Pair this with `portal_tour.html` (visual spec) and `moss_equity_portal_spec.docx` (functional spec).

**v0 philosophy:** Build only what works. Do not show greyed-out buttons, "Coming Soon" labels, or placeholder cards for unbuilt features. The portal grows when functionality is real, never before.

---

## Sidebar

**Show in v0:** Dashboard, Leads, Tasks, Claims, Imports, Reports, Settings

**Hide in v0:** Inbox, Campaigns, Automations

These three sidebar items appear in later phases when their automations come online.

---

## Dashboard

**Remove**
- "Conversations · 7 unread" metric card (Inbox does not exist in v0)
- "Needs Attention · 9 blocked items" metric card (depends on automated blocked-item detection)

**Keep**
- Pipeline Value metric
- Active Claims metric
- Stages strip (9 stages)
- Leads Needing Action list (manually surfaced based on stage and user notes)
- Active Markets bars
- Upcoming Deadlines panel (manual entry of dates)

**Replace metric cards with two new ones for v0:**
- "Active Conversations" — count of leads in stage = In Conversation (this is database, not Inbox)
- "Needs Verification" — count of leads where user has flagged manual verification items as incomplete

---

## Leads · Daily Work tab

**Remove the entire "Needs Reply" section** (depends on Inbox to detect inbound replies)

**Keep**
- "Needs Your Action" section
- "Awaiting External" section

**Section logic in v0**

Needs Your Action = leads where:
- Stage is Qualifying AND user-flagged verification items are incomplete
- Stage is Contract AND documents marked required are not uploaded
- User manually flagged the lead with "Needs Action" tag

Awaiting External = leads where:
- Stage is With Attorney
- Stage is Claim Filed

Sort each section by days in current stage descending.

---

## Leads · Kanban tab

Keep everything. Drag-and-drop between stages updates the database. Pure CRUD, no automation needed.

---

## Leads · Table tab

Keep everything. Filter, sort, search, export, saved views all work without automation.

---

## Lead Detail screen

### Remove from header

- "Send SMS" button (depends on Twilio integration)
- "Send Agreement" button (depends on e-signature integration)
- "Refresh Research" button (depends on research agent)

### Replace in body

**Remove the Research Report card** (with viability strip, recommendation, blocked items list — all depends on research agent)

**Replace with a Manual Research Notes card** containing:
- Free-text textarea where user types their own research findings
- Manual checkbox list: "Items I need to verify" — user adds, edits, and checks off items themselves
- Manual viability decision: dropdown for "Pursue / Review / Skip" recommendation that user sets
- No automated agent output, no auto-generated viability pills

**Remove the "3 Items Need Verification" alert pill** in the header — replace with a count drawn from the user's manual checklist (e.g., "3 items unchecked")

### Remove tabs

**Remove the Conversations tab** entirely (depends on Inbox)

### Keep these tabs

- Overview (with Manual Research Notes card replacing Research Report)
- Contacts (multi-phone table, manual entry, no skip trace API)
- Documents (manual upload, manual checklist)
- Notes (timestamped notes feed)
- Activity (database activity log)

### Keep these elements

- Stage progress strip — clicks manually advance the stage with a confirmation dialog
- Metric strip with all 6 cells — all values calculated from manually-entered fields
- Surplus Breakdown card with editable Recovery Fee % (single source of truth)
- Mailing Addresses card (manual entry, manual selection of which address was mailed)
- Court Records card (manual entry of case numbers, hearings, etc.)
- Right rail: Decision card (PRS shortcuts work with manual stage transitions), Quick Facts card, Recent Activity card

---

## Tasks page

Keep everything. All tasks are manually created in v0. No auto-generated tasks.

Sections: Today, This Week, Later, No Due Date.

---

## Claims page

Keep as-is. It is a filtered Leads Table view where stage is in [With Attorney, Claim Filed, Won]. Reuses the Leads Table component entirely.

---

## Imports page

**Remove**
- Any "Auto-import from email" or scheduled-import section
- Any reference to N8N or external import automations

**Keep**
- Manual CSV upload via drag-and-drop or browse
- Column mapping wizard
- Dedupe preview by address+zip — user manually picks which rows to skip or import
- Import history table showing past uploads

---

## Reports page

Keep basic queries:
- Pipeline value by state, sale type, and stage
- Conversion funnel with counts at each stage and drop-off percentages
- Average days in each stage
- Won deals: total recovered, total fees earned, average days import-to-won
- Lost reason breakdown

All read-only SQL queries against the database. No predictive analytics. CSV export is the only export.

---

## Settings page

**Remove**
- Sender phone numbers per state (SMS not built yet, no point configuring senders)
- Sender email and signature (email not built yet)

**Keep**
- Default Recovery Fee % (used as default for new leads)
- Default Attorney Cost
- Surplus Floor (configurable per user)
- Custom fields builder (add fields to lead records)
- Attorney directory (name, email, states covered, default cost)
- Templates library (stored for v0; just copy-paste into manual outreach elsewhere)
- State rules table (redemption period and filing window per state — read-only reference)

---

## Empty states to design

These are the only "placeholder" screens v0 needs. Each should be a polished empty state, not a Coming Soon label.

- No leads yet (Imports page CTA)
- No tasks today (helpful empty state on Tasks page)
- No imports yet (CTA to upload first CSV)
- No notes on this lead (empty state inside Notes tab)
- No documents on this lead (empty state inside Documents tab)
- No activity yet (empty state inside Activity tab)

---

## Auth pages

Standard Supabase Auth flow:
- Login page
- Signup page (single user for v0, but flow exists for multi-user later)
- Forgot password page
- Reset password page

---

## What v0 ships with

**Sidebar items:** 7 (Dashboard, Leads, Tasks, Claims, Imports, Reports, Settings)

**Major screens:** ~15 (Dashboard, Leads list with 3 tabs, Lead Detail with 5 tabs, Tasks, Claims, Imports, Reports, Settings, plus 4 auth pages)

**Form drawers:** ~6 (New Lead, Edit Lead, Pursue confirmation, Review pause, Mark Lost, Add Task)

**Empty states:** 6

**Total estimated buildable units:** ~30 distinct screens or components

**Realistic build time with Claude Code:** 3-4 weeks of focused work

---

## When automations come online

This portal is designed to grow. Do not pre-build empty UI for future features. Instead:

**v0.5 (SMS + email + Inbox)**
- Add Inbox to sidebar
- Add Conversations tab to Lead Detail
- Add Send SMS / Send Email buttons to Lead Detail header
- Add "Needs Reply" section to Daily Work
- Add "Conversations · X unread" card to Dashboard

**v1.0 (Cadences + Stage progression triggers)**
- Add Campaigns to sidebar
- Add Automations to sidebar
- Add automated tasks in Tasks page (alongside manual tasks)
- Add cadence status indicators on lead cards

**v2.0 (AI + research agent + e-sign)**
- Add Research Report card back to Lead Detail (replacing Manual Research Notes)
- Add Refresh Research button to header
- Add AI Conversation Summary card to Inbox right rail
- Add Send Agreement button (e-sign integration)
- Add viability auto-recommendations

Each phase adds visible UI only when the underlying functionality works. The portal stays clean throughout.

---

## Critical principles for the build

- Recovery Fee % lives ONCE per lead in the leads.recovery_fee_percent column. Every other display reads from there.
- Lead ID is generated ONCE on insert by a database function. Never manually edited.
- Stage changes always log an activity record. Never change stage silently.
- Surplus floor is a soft warning, not a hard block. Users can still pursue below-floor leads.
- No greyed-out buttons. No Coming Soon labels. No placeholder cards. If a feature does not work in v0, it does not appear in the UI.
- Empty states are first-class designs, not error states.
- All headers use Proper Case (e.g., "Recovery Fee" not "recovery fee" or "Recovery fee").
- No emojis anywhere in the portal.
- No dashes in compound words — use spaces (e.g., "non judicial" not "non-judicial" in body copy; URL slugs and code identifiers are exempt).
