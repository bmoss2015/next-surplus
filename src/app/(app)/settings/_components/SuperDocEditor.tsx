"use client";

// SuperDoc-based .docx editor. SuperDoc bundles Vue + ProseMirror + a docx
// parser, so it's strictly browser-side — we use a dynamic import with
// ssr: false to keep it out of the Next.js server bundle. The component
// accepts a File (fresh upload), a Blob (loaded from storage), or a URL,
// and exposes onSave so the parent can persist the exported .docx.

import { useRef } from "react";
import dynamic from "next/dynamic";

const SuperDocEditorInner = dynamic(
  () =>
    import("@superdoc-dev/react").then((m) => ({
      default: m.SuperDocEditor,
    })),
  { ssr: false }
);

import "@superdoc-dev/react/style.css";

export type SuperDocSource = File | Blob | string;

type SuperDocControls = {
  export: () => Promise<Blob>;
  insertText: (text: string) => void;
};

export function SuperDocEditor({
  source,
  onReady,
  onChange,
  fullScreen,
  autoHeight,
  documentMode = "editing",
}: {
  source: SuperDocSource | null;
  // Fired once SuperDoc has loaded the document. The provided `export`
  // function returns the current document as a .docx Blob, and
  // `insertText` drops literal text (e.g. a {merge_field} token) at the
  // current cursor position.
  onReady?: (controls: SuperDocControls) => void;
  onChange?: () => void;
  // When true, the editor stretches to fill its container — used by the
  // popout modal. Default sizing applies otherwise.
  fullScreen?: boolean;
  // When true, the wrapper grows to fit its content — used by the
  // unified preview modal so every page flows inline and the whole
  // modal scrolls as one. Mutually exclusive with fullScreen.
  autoHeight?: boolean;
  // Pass-through to SuperDoc. "viewing" gives a read-only render with
  // full fidelity — used by the carousel preview so the user sees the
  // actual document, not a "browser can't render this" placeholder.
  documentMode?: "editing" | "viewing" | "suggesting";
}) {
  type Editor = {
    commands: {
      focus?: () => void;
      insertContent: (text: string) => void;
    };
  };
  type SDInstance = {
    export: (opts?: {
      isFinalDoc?: boolean;
      triggerDownload?: boolean;
      exportType?: string[];
      exportedName?: string;
    }) => Promise<Blob | void>;
    activeEditor?: Editor | null;
  };
  const superdocRef = useRef<SDInstance | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Build and emit the controls once we have BOTH the superdoc instance
  // and at least one editor. onReady fires first; onEditorCreate fires
  // shortly after (once SuperDoc finishes parsing the .docx).
  function emitControlsIfReady() {
    const sd = superdocRef.current;
    const editor = editorRef.current;
    const cb = onReadyRef.current;
    if (!sd || !cb) return;
    cb({
      // CRITICAL: triggerDownload MUST be false. SuperDoc's export()
      // defaults to triggerDownload=true, which fires a browser Save As
      // dialog via FileSaver — that's the "file explorer pops up when
      // I click Save Template" bug. We just want the Blob; the parent
      // uploads it to Supabase storage itself.
      export: () => sd.export({ triggerDownload: false }) as Promise<Blob>,
      insertText: (text: string) => {
        const live = editor ?? sd.activeEditor ?? null;
        if (!live) {
          console.error("[SuperDoc] No editor available to insert into.");
          return;
        }
        try {
          live.commands.focus?.();
          live.commands.insertContent(text);
        } catch (e) {
          console.error("[SuperDoc] insertContent failed:", e);
        }
      },
    });
  }

  if (!source) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-[12px] text-gray-500">
        Upload a .docx to start editing.
      </div>
    );
  }

  return (
    <div
      className={`superdoc-wrap relative rounded-md border border-gray-200 ${
        // Viewing mode reads as a paper preview — white wrap so blank
        // areas around the page don't tint the rendered document pale.
        // Editing mode keeps the workspace gray so the page edges read.
        documentMode === "viewing" ? "bg-white" : "bg-gray-100"
      } ${autoHeight ? "" : "overflow-auto"} ${
        documentMode === "viewing" ? "superdoc-viewing" : ""
      }`}
      style={
        autoHeight
          ? { height: "auto", width: "100%" }
          : fullScreen
            ? { height: "100%", width: "100%" }
            : { height: "min(700px, 75vh)" }
      }
    >
      {/* SuperDoc renders its own toolbar somewhere inside its tree.
          These overrides target common class patterns to pin the
          toolbar at the top of the scroll container and to center the
          page within the visible area. They use !important because
          SuperDoc ships with inline / scoped styles we can't easily
          win against with specificity alone. */}
      <style jsx global>{`
        /* Stick SuperDoc's toolbar to the top of its scroll container.
           No border — the toolbar ships with its own backing color so
           an extra rule looked like an underline. overflow: visible
           keeps icon dropdowns from getting clipped by the sticky
           container. */
        .superdoc-wrap [class*="toolbar"],
        .superdoc-wrap [class*="Toolbar"] {
          position: sticky !important;
          top: 0 !important;
          z-index: 5;
          background: #ffffff;
          overflow: visible !important;
        }
        .superdoc-wrap [class*="toolbar"] *,
        .superdoc-wrap [class*="Toolbar"] * {
          overflow: visible !important;
        }
        .superdoc-wrap [class*="page"],
        .superdoc-wrap [class*="Page"] {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .superdoc-wrap [class*="editor-container"],
        .superdoc-wrap [class*="editorContainer"] {
          display: flex;
          justify-content: center;
        }
        /* In viewing mode (used by the preview carousel) hide the
           editor toolbar entirely — there's nothing to edit, no need
           for menu chrome cluttering the frame. */
        .superdoc-wrap.superdoc-viewing [class*="toolbar"],
        .superdoc-wrap.superdoc-viewing [class*="Toolbar"] {
          display: none !important;
        }
        /* autoHeight mode: let the OUTER scrolling surfaces grow so the
           whole document flows inline (modal scrolls, not a nested
           scrollbar). Critically we do NOT strip max-height from every
           descendant — individual page elements rely on max-height to
           know where one page ends and the next begins. Killing it
           caused multi-page content to overlap. We only override
           overflow / max-height on the outermost SuperDoc shell
           containers, not page bodies. */
        .superdoc-wrap:not(.overflow-auto) {
          overflow: visible !important;
        }
        .superdoc-wrap:not(.overflow-auto) [class*="superdoc"],
        .superdoc-wrap:not(.overflow-auto) [class*="editor-container"],
        .superdoc-wrap:not(.overflow-auto) [class*="page-container"],
        .superdoc-wrap:not(.overflow-auto) [class*="layout"] {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
      `}</style>
      <SuperDocEditorInner
        document={source as File | Blob | string}
        documentMode={documentMode}
        onReady={(event: { superdoc: SDInstance }) => {
          superdocRef.current = event.superdoc;
          emitControlsIfReady();
        }}
        onEditorCreate={(event: { editor: Editor }) => {
          editorRef.current = event.editor;
          emitControlsIfReady();
        }}
        onEditorUpdate={() => onChange?.()}
      />
    </div>
  );
}
