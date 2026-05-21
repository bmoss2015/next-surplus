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
  // Pin the iframe to a light color-scheme so dark-mode browsers (and senders
  // who set `@media (prefers-color-scheme: dark)` rules) don't render the
  // email's text on top of a dark surface. Without this, our forced
  // color: #0f1729 + the sender's dark bg = unreadable dark-on-dark.
  const wrapped = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <base target="_blank">
  <style>
    :root { color-scheme: light; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      padding: 2px 4px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    img { max-width: 100%; height: auto; }
    a { color: #13644e; text-decoration: underline; }
    table { max-width: 100%; border-collapse: collapse; }
    blockquote {
      border-left: 3px solid #e5e7eb;
      margin: 8px 0 8px 0;
      padding: 0 0 0 12px;
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
