import "server-only";

// Minimal error-logging shim. Today this is a thin wrapper around
// console.error that adds a structured prefix so server logs in Vercel
// are searchable. When you wire up Sentry (or any other error tracker)
// later, swap the implementation here and every reportError call across
// the codebase picks up the new sink without further edits.
//
// Usage:
//   import { reportError } from "@/lib/errors";
//   try { ... } catch (err) { reportError(err, { tag: "send-mail", input }); throw err; }
//
// Context object is arbitrary; only strings/numbers/booleans survive
// serialization. PII is acceptable in the context object because logs
// already contain it via stack traces; just don't paste raw secrets.

export type ErrorContext = Record<string, unknown>;

export function reportError(err: unknown, ctx: ErrorContext = {}): void {
  const sink = process.env.SENTRY_DSN ? "sentry" : "console";
  const payload = {
    sink,
    timestamp: new Date().toISOString(),
    message:
      err instanceof Error ? err.message : String(err ?? "unknown error"),
    stack: err instanceof Error ? err.stack : undefined,
    context: ctx,
  };
  // TODO: when SENTRY_DSN is configured, lazy-import @sentry/nextjs and
  // call Sentry.captureException(err, { extra: ctx }) instead of
  // console.error. Keeping this branch noisy in console for now since
  // the project has no error tracker wired up yet.
  // eslint-disable-next-line no-console
  console.error("[moss-error]", JSON.stringify(payload));
}
