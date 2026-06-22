import PostalMime from "postal-mime";

interface Env {
  PORTAL_WEBHOOK_URL: string;
  EMAIL_INBOUND_SECRET: string;
}

interface ForwardableEmailMessage {
  readonly from: string;
  readonly to: string;
  readonly raw: ReadableStream<Uint8Array>;
  setReject(reason: string): void;
  forward(rcptTo: string, headers?: Headers): Promise<void>;
}

async function readStreamToBytes(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext
  ) {
    try {
      const raw = await readStreamToBytes(message.raw);
      const parser = new PostalMime();
      const email = await parser.parse(raw);

      const payload = {
        type: "email.received",
        data: {
          id: email.messageId ?? null,
          from: {
            email: email.from?.address ?? message.from,
            name: email.from?.name ?? null,
          },
          to:
            email.to && email.to.length > 0
              ? email.to.map((t) => t.address ?? "").filter(Boolean)
              : [message.to],
          subject: email.subject ?? "",
          text: email.text ?? "",
          html: email.html ?? "",
        },
      };

      const res = await fetch(env.PORTAL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.EMAIL_INBOUND_SECRET}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(
          `[reply-router] webhook POST failed: ${res.status} ${detail}`
        );
      }
    } catch (err) {
      console.error("[reply-router] handler error:", err);
    }
  },
};
