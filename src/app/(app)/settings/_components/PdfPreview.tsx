"use client";

// Renders a PDF as a stack of inline canvas elements — one per page. No
// iframe, no native PDF viewer chrome, no internal scrollbar. The
// containing modal becomes the only scroll surface, which is what the
// "single scrollbar for the whole envelope" UX requires.

import { useEffect, useRef, useState } from "react";

export function PdfPreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Worker source pinned to the exact installed version so a
        // future pdfjs-dist upgrade doesn't silently mismatch with the
        // worker. Using jsDelivr because Turbopack's ?url import suffix
        // doesn't resolve cleanly for the worker file.
        const VERSION = (pdfjs as { version?: string }).version ?? "5.7.284";
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          canvas.style.margin = i === 1 ? "0 auto" : "12px auto 0";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render PDF");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="px-4 py-6 text-center text-[12px] text-danger">
        Couldn&apos;t render the PDF: {error}
      </div>
    );
  }
  return (
    <div className="p-3">
      {pageCount === null && (
        <div className="py-6 text-center text-[12px] text-gray-500">
          Rendering PDF...
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
