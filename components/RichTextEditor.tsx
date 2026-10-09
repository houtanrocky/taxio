// components/RichTextEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  Pilcrow,
  Heading2,
  Heading3,
  Quote,
} from "lucide-react";

type Props = { name: string; initialValue?: string; error?: boolean };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function inlineHtml(value: string) {
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(value: string) {
  let normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+(#{2,3}\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(>\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(-\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(\d+\.\s)/g, "$1\n\n$2");

  normalized = normalized.replace(/\n{3,}/g, "\n\n").trim();

  const blocks = normalized.split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split("\n").filter(l => l.length > 0);

    if (lines.length > 0 && lines.every(line => /^-\s/.test(line))) {
      return `<ul>${lines.map(line => `<li>${inlineHtml(line.replace(/^-\s/, ""))}</li>`).join("")}</ul>`;
    }
    if (lines.length > 0 && lines.every(line => /^\d+\.\s/.test(line))) {
      return `<ol>${lines.map(line => `<li>${inlineHtml(line.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`;
    }
    if (block.startsWith("### ")) return `<h3>${inlineHtml(block.slice(4))}</h3>`;
    if (block.startsWith("## ")) return `<h2>${inlineHtml(block.slice(3))}</h2>`;
    if (block.startsWith("> ")) return `<blockquote>${inlineHtml(block.slice(2))}</blockquote>`;
    return `<p>${inlineHtml(block).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function inlineToMarkdown(el: Element): string {
  let out = "";
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const child = node as Element;
    const tag = child.tagName.toLowerCase();
    const inner = inlineToMarkdown(child);
    if (tag === "strong" || tag === "b") {
      out += `**${inner}**`;
    } else if (tag === "em" || tag === "i") {
      out += `*${inner}*`;
    } else if (tag === "a") {
      const href = child.getAttribute("href") ?? "";
      out += `[${inner}](${href})`;
    } else if (tag === "br") {
      out += "\n";
    } else {
      out += inner;
    }
  });
  return out;
}

function htmlToMarkdown(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  const blocks: string[] = [];

  Array.from(root.children).forEach(node => {
    const tag = node.tagName.toLowerCase();
    if (tag === "ul") {
      blocks.push(
        Array.from(node.children).map(item => `- ${inlineToMarkdown(item).trim()}`).join("\n")
      );
    } else if (tag === "ol") {
      blocks.push(
        Array.from(node.children).map((item, index) => `${index + 1}. ${inlineToMarkdown(item).trim()}`).join("\n")
      );
    } else if (tag === "h2") {
      blocks.push(`## ${inlineToMarkdown(node).trim()}`);
    } else if (tag === "h3") {
      blocks.push(`### ${inlineToMarkdown(node).trim()}`);
    } else if (tag === "blockquote") {
      blocks.push(`> ${inlineToMarkdown(node).trim()}`);
    } else if (tag === "p") {
      blocks.push(inlineToMarkdown(node));
    } else {
      const text = inlineToMarkdown(node).trim();
      if (text) blocks.push(text);
    }
  });

  return blocks.filter(Boolean).join("\n\n").trim();
}

type BlockKind = "paragraph" | "h2" | "h3" | "blockquote" | "bulletList" | "orderedList";

export function RichTextEditor({ name, initialValue = "", error }: Props) {
  const [value, setValue] = useState(initialValue);
  const [activeBlock, setActiveBlock] = useState<BlockKind>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: markdownToHtml(initialValue),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-editor-prose",
        dir: "rtl",
        role: "textbox",
        "aria-label": "متن مقاله",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => {
      setValue(htmlToMarkdown(editor.getHTML()));
      syncToolbar(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      syncToolbar(editor);
    },
  });

  function syncToolbar(ed: NonNullable<typeof editor>) {
    if (ed.isActive("heading", { level: 2 })) setActiveBlock("h2");
    else if (ed.isActive("heading", { level: 3 })) setActiveBlock("h3");
    else if (ed.isActive("blockquote")) setActiveBlock("blockquote");
    else if (ed.isActive("bulletList")) setActiveBlock("bulletList");
    else if (ed.isActive("orderedList")) setActiveBlock("orderedList");
    else setActiveBlock("paragraph");

    setIsBold(ed.isActive("bold"));
    setIsItalic(ed.isActive("italic"));
  }

  // Ensure the toolbar reflects the initial cursor position on first render.
  useEffect(() => {
    if (editor) syncToolbar(editor);
  }, [editor]);

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    label,
    hint,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    label: string;
    hint?: string;
  }) => (
    <button
      type="button"
      className={`rich-editor-btn ${isActive ? "is-active" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      data-tooltip={hint ? `${label} — ${hint}` : label}
    >
      {children}
    </button>
  );

  return (
    <div className={`rich-editor ${error ? "has-error" : ""}`}>
      <div className="rich-editor-toolbar" role="toolbar" aria-label="ابزارهای ویرایش متن">
        <div className="rich-editor-group" aria-label="نوع متن">
          <ToolbarButton
            label="متن ساده"
            hint="پاراگراف معمولی"
            onClick={() => editor?.chain().focus().setParagraph().run()}
            isActive={activeBlock === "paragraph"}
          >
            <Pilcrow size={16} aria-hidden />
            <span>متن</span>
          </ToolbarButton>
          <ToolbarButton
            label="عنوان بزرگ"
            hint="تیتر اصلی بخش"
            onClick={() => editor?.chain().focus().setNode("heading", { level: 2 }).run()}
            isActive={activeBlock === "h2"}
          >
            <Heading2 size={16} aria-hidden />
            <span>عنوان</span>
          </ToolbarButton>
          <ToolbarButton
            label="عنوان کوچک"
            hint="تیتر فرعی"
            onClick={() => editor?.chain().focus().setNode("heading", { level: 3 }).run()}
            isActive={activeBlock === "h3"}
          >
            <Heading3 size={16} aria-hidden />
            <span>زیرعنوان</span>
          </ToolbarButton>
          <ToolbarButton
            label="نقل قول"
            hint="نکته مهم یا جمله برجسته"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={activeBlock === "blockquote"}
          >
            <Quote size={16} aria-hidden />
            <span>نقل قول</span>
          </ToolbarButton>
        </div>

        <span className="rich-editor-sep" aria-hidden />

        <div className="rich-editor-group" aria-label="قالب‌بندی متن">
          <ToolbarButton
            label="پررنگ"
            hint="تأکید روی کلمه‌های مهم"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={isBold}
          >
            <Bold size={16} aria-hidden />
            <span>پررنگ</span>
          </ToolbarButton>
          <ToolbarButton
            label="کج"
            hint="متن مورب"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={isItalic}
          >
            <Italic size={16} aria-hidden />
            <span>کج</span>
          </ToolbarButton>
        </div>

        <span className="rich-editor-sep" aria-hidden />

        <div className="rich-editor-group" aria-label="فهرست‌ها">
          <ToolbarButton
            label="فهرست نقطه‌ای"
            hint="لیست با علامت •"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={activeBlock === "bulletList"}
          >
            <List size={16} aria-hidden />
            <span>لیست</span>
          </ToolbarButton>
          <ToolbarButton
            label="فهرست شماره‌دار"
            hint="لیست با شماره ۱، ۲، ۳"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={activeBlock === "orderedList"}
          >
            <ListOrdered size={16} aria-hidden />
            <span>شماره‌دار</span>
          </ToolbarButton>
        </div>

        <span className="rich-editor-sep" aria-hidden />

        <div className="rich-editor-group" aria-label="تاریخچه">
          <ToolbarButton
            label="واگرد"
            hint="لغو آخرین تغییر"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Redo2 size={16} aria-hidden />
            <span>واگرد</span>
          </ToolbarButton>
          <ToolbarButton
            label="ازنو"
            hint="انجام دوباره تغییر"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Undo2 size={16} aria-hidden />
            <span>ازنو</span>
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} className="rich-editor-input" />

      <input type="hidden" name={name} value={value} required minLength={50} />

      <div className="rich-editor-status" aria-live="polite">
        <span className="rich-editor-status-label">اکنون در:</span>
        <span className="rich-editor-status-value">
          {activeBlock === "paragraph" && "متن ساده"}
          {activeBlock === "h2" && "عنوان بزرگ"}
          {activeBlock === "h3" && "عنوان کوچک"}
          {activeBlock === "blockquote" && "نقل قول"}
          {activeBlock === "bulletList" && "فهرست نقطه‌ای"}
          {activeBlock === "orderedList" && "فهرست شماره‌دار"}
        </span>
        {(isBold || isItalic) && (
          <span className="rich-editor-status-active">
            {isBold && "· پررنگ"}
            {isItalic && "· کج"}
          </span>
        )}
      </div>

      <div className="rich-editor-help">
        کل متن را انتخاب کنید و از دکمه‌های بالا برای تغییر نوع آن استفاده کنید. برای رفتن به خط جدید، دکمه Enter را دو بار بزنید.
      </div>
    </div>
  );
}
