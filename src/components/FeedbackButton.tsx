"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconMessage2 } from "@tabler/icons-react";
import { Drawer } from "@/app/(app)/settings/_components/Drawer";

type FeedbackType = "bug" | "idea" | "question";

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "bug", label: "Bug" },
  { value: "question", label: "Question" },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType("idea");
      setTitle("");
      setBody("");
      setError(null);
      setDone(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim(),
          pageUrl: pathname,
        }),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not send feedback. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Could not send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-ink"
        aria-label="Send Feedback"
      >
        <IconMessage2 size={16} stroke={1.7} />
        Feedback
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Feedback"
        title={done ? "Got It" : "Send Feedback"}
        footer={
          done ? (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!canSubmit}
                onClick={submit}
              >
                {sending ? "Sending…" : "Send Feedback"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={sending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              {error && (
                <span style={{ color: "var(--color-danger)", fontSize: 12.5 }}>
                  {error}
                </span>
              )}
            </div>
          )
        }
      >
        {done ? (
          <div className="drawer-field">
            <p style={{ fontSize: 13.5, color: "var(--color-gray-700)", lineHeight: 1.55 }}>
              Your feedback is logged. Bree reads every one and usually replies
              within two days.
            </p>
          </div>
        ) : (
          <>
            <div className="drawer-field">
              <label className="drawer-label">Type</label>
              <div className="segmented">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={type === opt.value ? "selected" : ""}
                    onClick={() => setType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer-field">
              <label className="drawer-label" htmlFor="feedback-title">
                Title
              </label>
              <input
                id="feedback-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="One line summary"
                autoFocus
              />
            </div>
            <div className="drawer-field">
              <label className="drawer-label" htmlFor="feedback-body">
                Description
              </label>
              <textarea
                id="feedback-body"
                className="input drawer-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What is on your mind?"
              />
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
