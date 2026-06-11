"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconLink,
  IconPalette,
  IconArrowBack,
  IconArrowForward,
} from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";

const COLORS = ["#0f1729", "#0d4b3a", "#13644e", "#dc2626", "#2563eb", "#6b7280"];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minRows = 6,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement | null>(null);

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
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="flex items-center gap-0.5 border-b border-gray-150 bg-gray-50/40 px-2 py-1.5">
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
          onClick={() => editor.chain().focus().toggleStrike().run()}
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
        <div ref={colorRef} className="relative">
          <ToolBtn icon={IconPalette} label="Text color" active={colorOpen} onClick={() => setColorOpen((v) => !v)} />
          {colorOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 flex gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
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
      <div className="px-3 py-2.5">
        {(!editor.getText() || editor.getText().trim() === "") && placeholder && (
          <div className="pointer-events-none absolute text-[13.5px] text-gray-400">{placeholder}</div>
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
