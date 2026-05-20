"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
  IconTable,
  IconPhoto,
  IconLink,
  IconH1,
  IconH2,
  IconPalette,
  IconUpload,
} from "@tabler/icons-react";
import { useRef, useState, useTransition } from "react";
import { fieldsByGroup, MERGE_GROUP_LABELS } from "@/lib/mail/merge";
import { convertDocxToHtml } from "../_actions";

const PETROL_COLORS = ["#0f1729", "#04261c", "#0d4b3a", "#13644e", "#dc2626"];

export function MailTemplateEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docxRef = useRef<HTMLInputElement | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [docxPending, startDocx] = useTransition();
  const [docxMsg, setDocxMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] max-h-[600px] overflow-auto rounded-md border border-gray-200 bg-white px-4 py-3 text-[13px] text-ink focus:outline-none focus:border-petrol-500",
      },
    },
  });

  if (!editor) return null;

  function insertMergeField(key: string) {
    editor?.chain().focus().insertContent(`{{${key}}}`).run();
    setMergeOpen(false);
  }

  function insertImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editor?.chain().focus().setImage({ src: dataUrl }).run();
    };
    reader.readAsDataURL(file);
  }

  function importDocx(file: File) {
    setDocxMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    startDocx(async () => {
      const res = await convertDocxToHtml(fd);
      if (res.ok) {
        editor?.commands.setContent(res.html);
        setDocxMsg({
          kind: "ok",
          text: "Imported. Touch up formatting and insert merge fields as needed.",
        });
      } else {
        setDocxMsg({ kind: "err", text: res.error });
      }
    });
  }

  const btn =
    "inline-flex h-7 cursor-pointer items-center justify-center rounded border border-transparent px-2 text-[11px] text-ink hover:bg-petrol-50 hover:text-petrol-700";
  const btnActive = "bg-petrol-100 text-petrol-700";
  const sep = "mx-1 h-5 w-px bg-gray-200";

  const grouped = fieldsByGroup();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btn} ${editor.isActive("bold") ? btnActive : ""}`}
        >
          <IconBold size={14} stroke={2} />
        </button>
        <button
          type="button"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btn} ${editor.isActive("italic") ? btnActive : ""}`}
        >
          <IconItalic size={14} stroke={2} />
        </button>
        <span className={sep} />
        <button
          type="button"
          aria-label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${btn} ${editor.isActive("heading", { level: 1 }) ? btnActive : ""}`}
        >
          <IconH1 size={14} stroke={2} />
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btn} ${editor.isActive("heading", { level: 2 }) ? btnActive : ""}`}
        >
          <IconH2 size={14} stroke={2} />
        </button>
        <span className={sep} />
        <button
          type="button"
          aria-label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btn} ${editor.isActive("bulletList") ? btnActive : ""}`}
        >
          <IconList size={14} stroke={2} />
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btn} ${editor.isActive("orderedList") ? btnActive : ""}`}
        >
          <IconListNumbers size={14} stroke={2} />
        </button>
        <span className={sep} />
        <button
          type="button"
          aria-label="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
              .run()
          }
          className={btn}
        >
          <IconTable size={14} stroke={2} />
        </button>
        <button
          type="button"
          aria-label="Insert image"
          onClick={() => fileRef.current?.click()}
          className={btn}
        >
          <IconPhoto size={14} stroke={2} />
        </button>
        <button
          type="button"
          aria-label="Insert link"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={`${btn} ${editor.isActive("link") ? btnActive : ""}`}
        >
          <IconLink size={14} stroke={2} />
        </button>
        <span className={sep} />
        <div className="relative">
          <button
            type="button"
            aria-label="Text color"
            onClick={() => setColorOpen((v) => !v)}
            className={btn}
          >
            <IconPalette size={14} stroke={2} />
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-elevated">
              {PETROL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Set color ${c}`}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                  className="h-5 w-5 cursor-pointer rounded border border-gray-200"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorOpen(false);
                }}
                className="cursor-pointer rounded border border-gray-200 px-1.5 text-[10px] text-gray-600 hover:border-petrol-500"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <span className={sep} />
        <button
          type="button"
          onClick={() => docxRef.current?.click()}
          disabled={docxPending}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] font-medium text-ink hover:border-petrol-500 disabled:opacity-50"
          title="Import a .docx file as the starting point for this template"
        >
          <IconUpload size={12} stroke={2} />
          {docxPending ? "Importing..." : "Import .docx"}
        </button>
        {docxMsg && (
          <span
            className={`ml-1 text-[10px] ${
              docxMsg.kind === "ok" ? "text-success" : "text-danger"
            }`}
          >
            {docxMsg.text}
          </span>
        )}
        <span className={sep} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMergeOpen((v) => !v)}
            className="cursor-pointer rounded-md border border-petrol-200 bg-petrol-50 px-2 py-[3px] text-[11px] font-medium text-petrol-700 hover:bg-petrol-100"
          >
            Insert Merge Field
          </button>
          {mergeOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-[360px] w-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-elevated">
              {(Object.keys(grouped) as Array<keyof typeof grouped>).map(
                (group) =>
                  grouped[group].length > 0 && (
                    <div key={group}>
                      <div className="border-b border-petrol-100 bg-petrol-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-petrol-700">
                        {MERGE_GROUP_LABELS[group]}
                      </div>
                      {grouped[group].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          title={`e.g. ${f.example}`}
                          onClick={() => insertMergeField(f.key)}
                          className="block w-full cursor-pointer px-2 py-1.5 text-left hover:bg-petrol-50"
                        >
                          <div className="text-[12px] leading-tight text-ink">{f.label}</div>
                          <div className="truncate text-[10px] italic leading-tight text-gray-400">
                            e.g. {f.example}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImageFromFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={docxRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importDocx(file);
          e.target.value = "";
        }}
      />
      <style jsx global>{`
        .ProseMirror table { border-collapse: collapse; margin: 8px 0; width: 100%; table-layout: fixed; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; min-width: 1em; position: relative; }
        .ProseMirror th { background: #f3f4f6; font-weight: 600; }
        .ProseMirror img { max-width: 100%; height: auto; }
        .ProseMirror h1 { font-size: 20px; font-weight: 600; margin: 12px 0 8px; color: #04261c; }
        .ProseMirror h2 { font-size: 16px; font-weight: 600; margin: 10px 0 6px; color: #04261c; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0 0 8px; }
        .ProseMirror a { color: #0d4b3a; text-decoration: underline; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}
