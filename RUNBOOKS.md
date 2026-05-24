# Runbooks

What to do when something breaks. Add a new section the first time a real failure happens. Don't pre-write speculative runbooks; they rot.

Each entry should answer four questions:

1. **Symptom** — what does the failure look like from a user's perspective?
2. **Where to look** — exact dashboards, log paths, files, in order
3. **Manual recovery** — how to bring the system back without writing new code
4. **Follow-up** — what to file or fix so it doesn't recur

---

## Email poller stopped (inbox stops refreshing)

**Symptom**: the portal Inbox hasn't shown new Gmail messages for more than 5 minutes, even when new mail is visible in the connected Gmail account.

**Where to look**:

1. Cloudflare dashboard → Workers → `moss-equity-email-poller` → Logs. Cron should fire every 2 minutes. Look for missing invocations or non-2xx responses from the portal.
2. Vercel logs for `/api/email/sync` on the production deployment. Look for auth failures (`INTERNAL_TRIGGER_SECRET` mismatch), Supabase errors, or Gmail API token refresh failures.
3. If the worker is running and the portal endpoint is returning 200 but the inbox still isn't updating, the per-user Gmail OAuth token may have been revoked. Check `email_accounts` in the staging or prod Supabase, looking for a stale `historyId` or a long-ago `last_synced_at`.

**Manual recovery**:

- In the portal: Settings → Email → "Sync now" forces a one-shot pull.
- If the OAuth token is dead: the affected user must disconnect and reconnect Gmail in Settings.
- If the worker itself is broken: `cd C:\Users\info\moss-equity-email-poller && npx wrangler deploy` to redeploy.

**Follow-up**: if the worker cron silently stops more than once, wire a dead-man switch (a `last_synced_at` watchdog query, or an UptimeRobot ping on a status endpoint).

---

## (template — copy below and fill in for new entries)

## <short symptom title>

**Symptom**:

**Where to look**:

**Manual recovery**:

**Follow-up**:
