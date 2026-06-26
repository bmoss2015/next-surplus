"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Image } from "@tiptap/extension-image";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconLink,
  IconPalette,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconPhoto,
  IconArrowBack,
  IconArrowForward,
  IconClearFormatting,
  IconChevronDown,
} from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null as string | null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: { fontSize?: string | null }) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

const COLORS = [
  "#0f1729", "#374151", "#6b7280", "#9ca3af",
  "#0d4b3a", "#13644e", "#1a8a9c", "#0a3d4a",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#2563eb", "#7c3aed", "#9d174d", "#000000",
];
const SIZES: { label: string; value: string }[] = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "14px" },
  { label: "Medium", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "Heading", value: "22px" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minRows = 6,
  editorRef,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
  editorRef?: { current: Editor | null };
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [customColor, setCustomColor] = useState("#0d4b3a");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const colorRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<HTMLDivElement | null>(null);
  const linkRef = useRef<HTMLDivElement | null>(null);
  const imageRefEl = useRef<HTMLDivElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#0d4b3a] underline" },
      }),
      FontSize,
      Color,
      Underline,
      TextAlign.configure({ types: ["paragraph"] }),
      Image.configure({
        HTMLAttributes: { class: "rounded-md max-w-full h-auto" },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-[13.5px] leading-[1.65] text-[#0f1729]",
        style: `min-height:${minRows * 1.65}em;font-family:Inter,sans-serif;`,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (colorRef.current && !colorRef.current.contains(t)) setColorOpen(false);
      if (sizeRef.current && !sizeRef.current.contains(t)) setSizeOpen(false);
      if (linkRef.current && !linkRef.current.contains(t)) setLinkOpen(false);
      if (imageRefEl.current && !imageRefEl.current.contains(t)) setImageOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (editorRef) editorRef.current = editor;
    return () => {
      if (editorRef) editorRef.current = null;
    };
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  function openLinkPopover() {
    const prior = editor!.getAttributes("link").href as string | undefined;
    setLinkUrl(prior ?? "");
    setLinkOpen((v) => !v);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor!.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    }
    setLinkOpen(false);
  }

  function removeLink() {
    editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }

  function applyImage() {
    const url = imageUrl.trim();
    if (!url) return;
    const normalized = /^(https?:|data:)/i.test(url) ? url : `https://${url}`;
    editor!.chain().focus().setImage({ src: normalized }).run();
    setImageUrl("");
    setImageOpen(false);
  }

  function onPickImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const MAX_BYTES = 1_500_000;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      if (!src) return;
      if (src.length > MAX_BYTES * 1.4) {
        window.alert(
          "That image is large (>1.5MB). It will work but bloats every email. Consider compressing first."
        );
      }
      editor!.chain().focus().setImage({ src }).run();
      setImageOpen(false);
    };
    reader.readAsDataURL(file);
  }

  function applySize(size: string) {
    editor!
      .chain()
      .focus()
      .setMark("textStyle", { fontSize: size })
      .run();
    setSizeOpen(false);
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50/40 px-2 py-1.5">
        <div ref={sizeRef} className="relative">
          <button
            type="button"
            onClick={() => setSizeOpen((v) => !v)}
            className={
              "inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11.5px] " +
              (sizeOpen ? "bg-gray-200 text-[#0f1729]" : "text-gray-600 hover:bg-gray-100")
            }
            title="Text size"
          >
            Size
            <IconChevronDown size={10} stroke={2} />
          </button>
          {sizeOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-[140px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => applySize(s.value)}
                  className="block w-full cursor-pointer px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50"
                  style={{ fontSize: s.value }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Sep />
        <ToolBtn
          icon={IconBold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolBtn
          icon={IconItalic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolBtn
          icon={IconUnderline}
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolBtn
          icon={IconStrikethrough}
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <Sep />
        <ToolBtn
          icon={IconAlignLeft}
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <ToolBtn
          icon={IconAlignCenter}
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <ToolBtn
          icon={IconAlignRight}
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
        <Sep />
        <ToolBtn
          icon={IconList}
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolBtn
          icon={IconListNumbers}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Sep />
        <div ref={linkRef} className="relative">
          <ToolBtn
            icon={IconLink}
            label="Insert link"
            active={linkOpen || editor.isActive("link")}
            onClick={openLinkPopover}
          />
          {linkOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-[280px] rounded-md border border-gray-200 bg-white p-2 shadow-lg">
              <label className="text-[10.5px] uppercase tracking-[0.08em] text-gray-500">URL</label>
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") setLinkOpen(false);
                }}
                placeholder="paste or type a URL"
                className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-[12.5px] outline-none focus:border-[#0d4b3a]"
              />
              <div className="mt-2 flex items-center justify-end gap-1">
                {editor.isActive("link") && (
                  <button
                    type="button"
                    onClick={removeLink}
                    className="mr-auto cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLinkOpen(false)}
                  className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyLink}
                  className="cursor-pointer rounded-md bg-[#0d4b3a] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#0f5544]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        <div ref={imageRefEl} className="relative">
          <ToolBtn
            icon={IconPhoto}
            label="Insert image"
            active={imageOpen}
            onClick={() => setImageOpen((v) => !v)}
          />
          {imageOpen && (
            <div className="absolute left-0 top-full z-40 mt-1 w-[320px] rounded-md border border-gray-200 bg-white p-3 shadow-[0_16px_40px_-8px_rgba(15,23,41,0.18)]">
              <label className="block cursor-pointer rounded-md border-2 border-dashed border-gray-200 px-3 py-4 text-center transition-colors hover:border-[#0d4b3a]/40 hover:bg-gray-50/60">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  onChange={onPickImageFile}
                  className="hidden"
                />
                <IconPhoto size={18} stroke={1.5} className="mx-auto text-gray-400" />
                <div className="mt-1.5 text-[12px] font-medium text-[#0f1729]">
                  Choose an image from your computer
                </div>
                <div className="mt-0.5 text-[10.5px] text-gray-500">
                  PNG, JPG, GIF, WebP or SVG — embedded in the email
                </div>
              </label>
              <div className="my-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                or paste a URL
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyImage();
                  }
                  if (e.key === "Escape") setImageOpen(false);
                }}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-[12.5px] outline-none focus:border-[#0d4b3a]"
              />
              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setImageOpen(false)}
                  className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyImage}
                  disabled={!imageUrl.trim()}
                  className="cursor-pointer rounded-md bg-[#0d4b3a] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#0f5544] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Insert URL
                </button>
              </div>
            </div>
          )}
        </div>
        <div ref={colorRef} className="relative">
          <ToolBtn icon={IconPalette} label="Text color" active={colorOpen} onClick={() => setColorOpen((v) => !v)} />
          {colorOpen && (
            <div className="absolute left-0 top-full z-40 mt-1 w-[240px] rounded-md border border-gray-200 bg-white p-3 shadow-[0_16px_40px_-8px_rgba(15,23,41,0.18)]">
              <div className="grid grid-cols-8 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c).run();
                      setColorOpen(false);
                    }}
                    className="h-5 w-5 cursor-pointer rounded-full border border-gray-200 transition-transform hover:scale-110"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="mt-3 border-t border-gray-200 pt-2.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-gray-500">Custom hex</label>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <label
                    className="relative inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-gray-200"
                    style={{ background: customColor }}
                    title="Pick a color"
                  >
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#0d4b3a"
                    className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-[11.5px] outline-none focus:border-[#0d4b3a]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const c = customColor.trim();
                      if (!/^#[0-9a-f]{3,8}$/i.test(c)) return;
                      editor.chain().focus().setColor(c).run();
                      setColorOpen(false);
                    }}
                    className="shrink-0 cursor-pointer rounded-md bg-[#0d4b3a] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#0f5544]"
                  >
                    Set
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorOpen(false);
                }}
                className="mt-2 w-full cursor-pointer rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
              >
                Reset color
              </button>
            </div>
          )}
        </div>
        <ToolBtn
          icon={IconClearFormatting}
          label="Clear formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
        <div className="ml-auto flex items-center gap-0.5">
          <ToolBtn
            icon={IconArrowBack}
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <ToolBtn
            icon={IconArrowForward}
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </div>
      </div>
      <div className="relative px-3 py-2.5">
        {(!editor.getText() || editor.getText().trim() === "") && placeholder && (
          <div className="pointer-events-none absolute left-3 top-2.5 text-[13.5px] text-gray-400">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; stroke: number }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "cursor-pointer rounded-md p-1.5 transition-colors " +
        (disabled
          ? "text-gray-300"
          : active
            ? "bg-gray-200 text-[#0f1729]"
            : "text-gray-500 hover:bg-gray-100 hover:text-[#0f1729]")
      }
    >
      <Icon size={13} stroke={1.75} />
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-gray-200" />;
}
