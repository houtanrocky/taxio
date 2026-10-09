// components/RichTextEditor.tsx
"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2, Pilcrow } from "lucide-react";

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

/**
 * Converts markdown to HTML by first normalizing block boundaries.
 * Block markers (##, ###, >, -, 1.) are extracted even when they appear
 * mid-line, so malformed saved content round-trips cleanly.
 */
function markdownToHtml(value: string) {
  // 1. Normalize: ensure every block-level marker starts on its own line.
  //    Insert a newline before `##`, `###`, `> `, `- `, and `N. ` markers
  //    when they're not already at the start of a line.
  let normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+(#{2,3}\s)/g, "$1\n\n$2")   // heading mid-line
    .replace(/([^\n])\s+(>\s)/g, "$1\n\n$2")         // blockquote mid-line
    .replace(/([^\n])\s+(-\s)/g, "$1\n\n$2")         // bullet mid-line
    .replace(/([^\n])\s+(\d+\.\s)/g, "$1\n\n$2");    // ordered list mid-line

  // 2. Collapse multiple blank lines into exactly one separator.
  normalized = normalized.replace(/\n{3,}/g, "\n\n").trim();

  // 3. Split into blocks and convert each one.
  const blocks = normalized.split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split("\n").filter(l => l.length > 0);

    // Bullet list: every line starts with "- "
    if (lines.length > 0 && lines.every(line => /^-\s/.test(line))) {
      return `<ul>${lines.map(line => `<li>${inlineHtml(line.replace(/^-\s/, ""))}</li>`).join("")}</ul>`;
    }
    // Ordered list: every line starts with "N. "
    if (lines.length > 0 && lines.every(line => /^\d+\.\s/.test(line))) {
      return `<ol>${lines.map(line => `<li>${inlineHtml(line.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`;
    }
    // Heading level 3
    if (block.startsWith("### ")) return `<h3>${inlineHtml(block.slice(4))}</h3>`;
    // Heading level 2
    if (block.startsWith("## ")) return `<h2>${inlineHtml(block.slice(3))}</h2>`;
    // Blockquote
    if (block.startsWith("> ")) return `<blockquote>${inlineHtml(block.slice(2))}</blockquote>`;
    // Paragraph (preserve single line breaks as <br>)
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

/**
 * Converts editor HTML to markdown. Block elements (h2, h3, blockquote,
 * ul, ol, p) are always separated by a blank line so the round-trip
 * through markdownToHtml preserves structure.
 */
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
      // Fallback: treat unknown tags as paragraph content
      const text = inlineToMarkdown(node).trim();
      if (text) blocks.push(text);
    }
  });

  return blocks.filter(Boolean).join("\n\n").trim();
}

export function RichTextEditor({ name, initialValue = "", error }: Props) {
  const [value, setValue] = useState(initialValue);
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
    },
  });

  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <button type="button" className={isActive ? "is-active" : ""} onClick={onClick} title={title} aria-label={title}>
      {children}
    </button>
  );

  return (
    <div className={`rich-editor ${error ? "has-error" : ""}`}>
      <div className="rich-editor-toolbar" aria-label="ابزارهای ویرایش">
        <ToolbarButton
          title="متن ساده"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          isActive={editor?.isActive("paragraph")}
        >
          <Pilcrow size={17} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="عنوان اصلی بخش"
          onClick={() => editor?.chain().focus().setNode("heading", { level: 2 }).run()}
          isActive={editor?.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="عنوان فرعی بخش"
          onClick={() => editor?.chain().focus().setNode("heading", { level: 3 }).run()}
          isActive={editor?.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          title="پررنگ"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive("bold")}
        >
          <Bold size={17} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="کج"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive("italic")}
        >
          <Italic size={17} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="نقل قول"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive("blockquote")}
        >
          نقل قول
        </ToolbarButton>
        <ToolbarButton
          title="فهرست نقطه‌ای"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive("bulletList")}
        >
          <List size={17} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="فهرست شماره‌دار"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive("orderedList")}
        >
          <ListOrdered size={17} aria-hidden />
        </ToolbarButton>
        {/* In RTL, undo arrow points to the right, redo to the left */}
        <ToolbarButton
          title="واگرد"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Redo2 size={17} aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="ازنو"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Undo2 size={17} aria-hidden />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="rich-editor-input" />
      <input type="hidden" name={name} value={value} required minLength={50} />
      <div className="rich-editor-help">برای رفتن به خط بعد، دو بار Enter بزنید. متن ساده، عنوان، پررنگ، نقل قول و فهرست را با یک لمس اضافه کنید.</div>
    </div>
  );
}
