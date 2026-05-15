"use client";

import { useEffect, useRef, useState } from "react";

// Renders email HTML inside a sandboxed iframe so we keep the original
// formatting without letting senders' inline scripts run or their CSS leak
// into the host page.
//
// Sandbox flags: `allow-same-origin` lets us read the iframe's scrollHeight
// to size it; `allow-popups` + `allow-popups-to-escape-sandbox` lets `<a
// target="_blank">` open links in a new tab. `allow-scripts` is INTENTIONALLY
// omitted — that's what blocks any <script> in the email payload.
export function HtmlMessage({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);

  // Wrap the email HTML with a base stylesheet that matches the portal:
  // Inter, ink color, petrol-tinted links, max-width images, gentler
  // blockquotes. `<base target="_blank">` opens every link in a new tab.
  const wrapped = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      color: #0f1729;
      padding: 2px 4px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    img { max-width: 100%; height: auto; }
    a { color: #0d6c7d; text-decoration: underline; }
    table { max-width: 100%; border-collapse: collapse; }
    blockquote {
      border-left: 3px solid #e5e7eb;
      margin: 8px 0 8px 0;
      padding: 0 0 0 12px;
      color: #6b7280;
    }
    pre {
      background: #f8f9fa;
      padding: 8px;
      border-radius: 6px;
      overflow-x: auto;
    }
  </style>
</head>
<body>${html}</body>
</html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function resize() {
      const doc = iframe?.contentDocument;
      if (!doc?.body) return;
      const h = doc.body.scrollHeight;
      setHeight(Math.max(40, h + 8));
    }

    // First measurement after the iframe paints.
    const onLoad = () => {
      resize();
      const doc = iframe?.contentDocument;
      if (!doc) return;
      // Late-loading images can change body height; remeasure as they arrive.
      doc.querySelectorAll("img").forEach((img) => {
        if (!(img as HTMLImageElement).complete) {
          img.addEventListener("load", resize);
          img.addEventListener("error", resize);
        }
      });
      // Any reflow inside the doc bumps the iframe.
      const ro = new ResizeObserver(resize);
      ro.observe(doc.body);
      // Cleanup is handled when the component unmounts via the outer cleanup.
      (iframe as HTMLIFrameElement & { _ro?: ResizeObserver })._ro = ro;
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
      const ro = (iframe as HTMLIFrameElement & { _ro?: ResizeObserver })._ro;
      if (ro) ro.disconnect();
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrapped}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{ width: "100%", border: "none", height }}
      className="bg-transparent"
      title="Email content"
    />
  );
}
