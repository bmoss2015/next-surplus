"use client";

// Small portrait thumbnail of a sent letter for the lead Mail tab
// DetailPane. Three cases:
//   1. body_html stored on the mail_jobs row (HTML body / HTML template
//      sends) → iframe-srcdoc scaled to 200x260.
//   2. body_html empty (docx-template sends) → lazy-call previewMailJob
//      which returns either a PDF (Gotenberg path) or HTML (mammoth
//      fallback). PDFs render via pdfjs-dist first-page canvas; HTML
//      renders via iframe-srcdoc.
//   3. Preview fetch fails → "No preview" plain text.
//
// The PDF canvas approach is used because PDF-in-iframe doesn't reliably
// honor CSS transform: scale() across browsers, and the modal already
// uses pdfjs-dist for the full preview so the worker is already wired.

import { useEffect, useState } from "react";
import { previewMailJob } from "@/lib/mail/actions";

type ThumbState =
  | { kind: "html"; html: string }
  | { kind: "image"; dataUrl: string }
  | { kind: "loading" }
  | { kind: "empty" };

export function LetterThumbnail({
  jobId,
  bodyHtml,
}: {
  jobId: string;
  bodyHtml: string | null;
}) {
  const hasInlineHtml = !!bodyHtml && bodyHtml.trim().length > 0;

  const [state, setState] = useState<ThumbState>(() =>
    hasInlineHtml
      ? { kind: "html", html: bodyHtml as string }
      : { kind: "loading" }
  );

  useEffect(() => {
    if (hasInlineHtml) {
      setState({ kind: "html", html: bodyHtml as string });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });

    (async () => {
      const res = await previewMailJob({ mail_job_id: jobId });
      if (cancelled) return;
      if (!res.ok) {
        setState({ kind: "empty" });
        return;
      }
      if (res.kind === "html") {
        setState({ kind: "html", html: res.html });
        return;
      }
      // PDF path — render first page to a data URL so the thumbnail
      // is a regular <img> that scales cleanly via CSS object-fit.
      try {
        const pdfjs = await import("pdfjs-dist");
        (
          pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }
        ).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = Uint8Array.from(atob(res.base64), (c) =>
          c.charCodeAt(0)
        );
        const doc = await (
          pdfjs as unknown as {
            getDocument: (opts: { data: Uint8Array }) => {
              promise: Promise<{
                numPages: number;
                getPage: (n: number) => Promise<{
                  getViewport: (o: { scale: number }) => {
                    width: number;
                    height: number;
                  };
                  render: (o: {
                    canvasContext: CanvasRenderingContext2D;
                    viewport: { width: number; height: number };
                  }) => { promise: Promise<void> };
                }>;
              }>;
            };
          }
        ).getDocument({ data: bytes }).promise;
        if (cancelled) return;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setState({ kind: "empty" });
          return;
        }
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        setState({ kind: "image", dataUrl: canvas.toDataURL("image/png") });
      } catch {
        setState({ kind: "empty" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, hasInlineHtml, bodyHtml]);

  if (state.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
        Loading...
      </div>
    );
  }
  if (state.kind === "empty") {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
        No preview
      </div>
    );
  }
  if (state.kind === "html") {
    return (
      <iframe
        title="Letter preview"
        sandbox=""
        srcDoc={state.html}
        className="absolute left-0 top-0 origin-top-left h-[792px] w-[612px] scale-[0.327] bg-white"
      />
    );
  }
  // Image (rendered PDF first page) — fills the thumbnail box.
  return (
    <img
      src={state.dataUrl}
      alt="Letter preview"
      className="absolute inset-0 h-full w-full object-cover object-top"
    />
  );
}
