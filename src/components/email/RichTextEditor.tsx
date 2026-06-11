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

const COLORS = ["#0f1729", "#0d4b3a", "#13644e", "#dc2626", "#2563eb", "#6b7280", "#000000", "#ffffff"];
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
  const colorRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<HTMLDivElement | null>(null);

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
      TextStyle,
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

  if (!editor) return null;

  function setLink() {
    const prior = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prior ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function setImage() {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor!.chain().focus().setImage({ src: url }).run();
  }

  function applySize(size: string) {
    editor!.chain().focus().setMark("textStyle", { ...editor!.getAttributes("textStyle"), fontSize: size }).run();
    if (typeof document !== "undefined") {
      const { from, to } = editor!.state.selection;
      const dom = document.querySelectorAll(".ProseMirror span[style*='font-size']");
      dom.forEach((el) => {
        const html = el as HTMLElement;
        if (!html.style.fontSize) html.style.fontSize = size;
      });
      void from;
      void to;
    }
    setSizeOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
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
        <ToolBtn icon={IconLink} label="Insert link" active={editor.isActive("link")} onClick={setLink} />
        <ToolBtn icon={IconPhoto} label="Insert image" onClick={setImage} />
        <div ref={colorRef} className="relative">
          <ToolBtn icon={IconPalette} label="Text color" active={colorOpen} onClick={() => setColorOpen((v) => !v)} />
          {colorOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-4 gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                  className="h-5 w-5 cursor-pointer rounded-full border border-gray-200"
                  style={{ background: c }}
                  title={c}
                />
              ))}
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
