# Moss Equity Partners - Web App: Product Roadmap Content

This file is the source content for the auto-generated Product Build Status & Roadmap document. The Cloudflare Worker reads this file every Monday at 9am Central (and on demand) and generates the doc that lands in the Shared Drive.

To update this file, use the `/roadmap` or `/docs` slash command in Claude Code rather than editing directly. See `.claude/skills/roadmap/SKILL.md` for how that works.

The Worker parses by `##` headers. Do not change the section names below. Add new bullets under the appropriate section.

---

## Product Overview

Moss Equity Partners - Web App is the operations platform for surplus funds recovery firms. It centralizes lead intake, owner research, outreach, contracts, and claim filing into one workspace so operators can pursue more deals with less manual work. Built for solo operators and small teams, designed to scale to multi-state firms with dozens of users.

---

## Current State

Internal alpha live at portal.mossequitypartners.com. Bree and Rik are using it daily on real leads. Multi-tenant foundation shipped, the platform is structurally ready for additional firms to use, pending hardening and Stripe billing integration before public availability.

Production launched 2026-05-12. Currently shipping fixes and feature additions daily through Claude Code with auto-deploy to Vercel.

Pricing strategy: launch a Founder / Lite tier at $59 to 69 once Q2 launch readiness ships, bump to $97 to 99 in Q3 when SMS, voice calling, and e-signature land. Founder customers grandfather at $69 for 12 months. This trades upfront revenue clarity for faster validated demand.

---

## Competitor Landscape

Snapshot at the $97 to 99 price band, used to ground roadmap and pricing decisions. Items marked [unverified] need confirmation before being relied on. Pipedrive omitted (not surplus-specific). Last refresh: 2026-05-28.

| Capability | Surplus Funds List ($99 CRM, 3 seats) | Excess Elite ($97 CRM-only) | Surplus Systems (pricing private) | GoHighLevel Starter ($97, 3 sub-accounts) |
|---|---|---|---|---|
| SMS in-app | Yes [unverified at depth] | Yes (~$0.02 per SMS pass-through, owner verified) | Yes (marketed, GHL native) | Yes (usage-priced, LC-Phone or BYO Twilio) |
| Voice dialer (power / click-to-call) | Yes (recording + voicemail drop) | No in CRM-only tier (owner verified) | Yes ("Built-in Dialer" marketed) | Yes (LC-Phone, usage-priced) |
| Phone number purchase | Yes (implied) | Yes (owner verified, even without dialer) | [unverified, GHL inheritance implies yes] | Yes |
| Ringless voicemail | Yes (with dialer) | No | Yes ("RVM" marketed) | Yes (usage-priced) |
| E-signature | Yes (native) | No at any tier (owner verified) | Yes (marketed as "DocuSign alternative") | Yes (template-based, not robust workflow) |
| Direct mail letters / postcards | No | Yes via Rocket Print and Mail or Postcard Mania (owner verified) | Yes ("Direct Mail" marketed, scope unverified) | No native, marketplace integrations only |
| Physical check cutting | No | No [unverified, Rocket Print is not a check service] | No [unverified, no signal in marketing] | No |
| AI assistant in this tier | Yes ("Ivy AI") | Yes (owner verified, form unclear) | [unverified, GHL has paid add-on] | Yes (usage-priced, $97 unlimited add-on) |
| Real Gmail / Outlook OAuth | No (native email only) | No (domain-forwarding shim) | [unverified, GHL inheritance implies yes; SS markets "Video Email" separately] | Yes (real OAuth, Gmail 500/day, Outlook 3MB attach) |
| Lead database | $170+ tier | Higher tier | No | No |
| Skip trace | Yes (built-in) | Higher tiers only [unverified] | Not advertised | No (third-party only) |
| Outreach automation / cadences | No in $99 tier [unverified] | Yes (owner verified) | Yes ("Pre-built Campaigns" + "Follow-up automation" marketed) | Yes (workflows, core) |
| Multi-user seats | 3 included, ~$40 per extra [unverified] | Multi-user, one-time per-seat fee [unverified] | Not specified | Unlimited users at every tier |
| Pricing model | Flat subscription | Flat subscription | Hidden, demo-gated funnel | $97 subscription + usage on top |
| A2P 10DLC handling | [unverified] | [unverified] | [unverified, inherits GHL manual process] | User-driven through Trust Center, manual, common rejections (owner-experienced "treacherous") |

### Where Moss can credibly lead

| Lever | Status today | Notes |
|---|---|---|
| Physical check cutting via Lob | Live in production | No competitor confirmed to offer (Excess Elite uses Rocket Print and Postcard Mania for letters / postcards only; Surplus Systems markets "Direct Mail" but no check cutting signal). Verify Rocket Print scope to lock the claim. |
| Done-for-you A2P 10DLC SMS verification | Planned Q3 | GHL's manual process is the single biggest onboarding complaint. Surplus Systems inherits the same GHL process [unverified]. One-form wizard wins here. |
| State-mapped phone number routing | Planned Q3 | None of the competitors do this. Trust-signal differentiator. |
| Flat all-in pricing without usage surprises | Already planned | GHL's usage billing on top of $97 is a frequent complaint. |
| State-specific playbooks + attorney directory | Live (both shipped) | Domain depth at the entry tier. |
| Public claim status portal for property owners | Planned Q4 | None of the competitors do this. |
| Real Gmail / Outlook OAuth sync | Gmail live, Outlook planned Q2 | Matches GHL on table stakes here, beats Excess Elite and Surplus Funds List. |

### Unverified items to confirm

- Excess Elite: Rocket Print mail scope (letters / postcards only, not checks), one-time per-seat fee model, AI surface form
- Surplus Funds List: automation / cadences in $99 tier, per-additional-seat threshold price
- Surplus Systems: pricing tiers, A2P 10DLC handling, multi-user seat structure, AI assistant tier inclusion, skip trace, lead database, Gmail / Outlook OAuth depth, direct mail scope (postal class, certified, postcards)

### Sources

Surplus Funds List pricing and features pages; Excess Elite App Store listing, support docs subdomain, owner direct observation; Surplus Systems homepage, YouTube channel, and blog post (GHL hosting confirmed via leadconnectorhq.com image CDN and clients. / onboarding. SaaS Mode subdomain pattern); Excess Quest marketing pages; GoHighLevel pricing and support knowledge base (A2P guides, Documents & Contracts docs, LC-Phone overview, two-way email sync setup, marketplace integrations).

---

## Q2 2026

Active priorities for the current quarter (April - June 2026). Ordered by consumer value.

- Google OAuth app verification (removes the "unverified app" warning users see today when connecting Gmail). Google review takes 4 to 8 weeks so the application must be submitted early in the quarter.
- Public launch readiness (Owner / Viewer / Admin / Member roles, Stripe billing with plan picker, new-org onboarding flow as a post-signup wizard, public marketing site at mossequitypartners.com with pricing, features, and signup, per-org isolation polish).
- Additional email providers (Microsoft 365 / Outlook two-way OAuth sync plus generic IMAP fallback alongside the existing Gmail integration).
- In-app feedback widget (persistent floating button on every page for "send feedback", "request a feature", or "chat with us" without leaving the workflow).
- Customer newsletter system (weekly send via Resend with feature highlights, how-to walkthroughs, and an embedded feedback prompt).

---

## Q3 2026

Planned workstreams for July through September 2026. The telephony and monetization layer.

- SMS messaging via Twilio or Telnyx, A2P 10DLC carrier registration completed before launch, send and receive text messages with leads directly in the platform.
- Done-for-you A2P 10DLC SMS verification wizard, one customer-facing form collects every required input and auto-submits to the chosen provider's API with pre-filled surplus-operator brand and campaign templates. Customer never touches a provider dashboard.
- Voice calling, click-to-call from any phone field, automatic call logging via the same telephony provider.
- State-mapped phone number purchasing. When a customer adds a state to their workspace the system suggests numbers in that state's area codes, outbound SMS and calls to a lead automatically route through the matching state-area-code number for higher answer rates.
- Ringless voicemail, drop pre-recorded messages directly into the lead's voicemail box without ringing the phone.
- TCPA-compliant calling windows and automatic opt-out keyword handling. The system enforces state-specific quiet hours and respects STOP / UNSUBSCRIBE replies automatically.
- E-signature integration (provider to be determined, target capability beyond simple template e-signature). Status events fire workflow triggers when documents are sent, viewed, or signed.
- Plaid instant bank verification, connect a funding account in seconds to skip the 1 to 3 business day microdeposit wait on the existing Lob mail flow.
- AI assistant surface (case summaries on demand, outreach message drafts based on lead context, document review helpers, conversation summarization across email and SMS threads).

---

## Q4 2026

Planned workstreams for October through December 2026. Moat and automation.

- Outreach cadences with default automation templates for surplus operators (multi-step SMS / email / call sequences with reply detection, pause logic, and pre-built templates for initial contact, follow-up after silence, reactivation).
- Public claim status portal (read-only share link the operator sends to the property owner so they can see claim filed date, court date, expected disbursement). Reduces "is this real" calls and converts skeptical leads.
- Voicemail transcription (missed inbound calls become readable text in the per-lead conversation thread).
- Multi-state expansion (research agents inside the platform for SC, TN, PA, GA, plus per-state fee structures and per-state filing checklists driven by the existing playbook system).
- Certified mail via Lob (requires Lob plan upgrade to unlock the certified mail API tier; gives operators a trackable, signature-required option for time-sensitive owner notifications alongside the existing first-class mail flow).

---

## 2027+ Vision

Direction items beyond 2026. Subject to change as priorities clarify.

- Mobile and Progressive Web App (installable, offline-friendly for read operations).
- Attorney portal so attorneys see only their assigned cases.
- Bulk research from triage view.
- Affiliate program for the platform.

---

## Parking Lot

Items deprioritized or held for later evaluation. Not committed to a specific quarter.

- Integrations Tab (single admin page to connect Gmail, Drive, phone, mail funding, e-sign, and other services in one place). Revisit when planned integrations stack up beyond two or three.
- Inbox extends to multi channel threading (SMS replies surface inside the same per-lead conversation view as Gmail today). Implied by the Q3 SMS work, separate line not needed until an inbox redesign warrants it.
- Skip trace API integration for pay-per-lookup contact enrichment. Lower priority than core outreach features.
- Phone routing for DNC-aware fallback between Phone 1 and Phone 2. Wait until calling is built to layer this on.
- Stage progression triggers (replies auto-advance leads through the pipeline). Revisit after cadences ship.
- Automated task generation based on activity rules. Revisit after cadences ship.
- Attorney marketplace (operators routed to filers per state with referral revenue share). Interesting product extension once the core platform is launched and monetized.
- Nationwide county-office directory bundled inside the platform (Surplus Systems markets one as part of their bundle; could fit as a researcher-facing reference layer in Moss). Lower priority than core outreach features.
