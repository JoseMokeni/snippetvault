import { useState, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import { Eye, Edit2 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "## How to use\n\n1. Copy the files to your project\n2. Install dependencies\n3. ...",
  rows = 6,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;

      // Tab - insert 2 spaces
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const newValue = before + "  " + after;
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        });
        return;
      }

      // Shift+Tab - remove indentation
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const lineContent = value.slice(lineStart, selectionStart);
        const spacesToRemove = lineContent.match(/^( {1,2})/)?.[1].length || 0;
        if (spacesToRemove > 0) {
          const newValue =
            value.slice(0, lineStart) +
            value.slice(lineStart + spacesToRemove);
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd =
              selectionStart - spacesToRemove;
          });
        }
        return;
      }

      // Ctrl+B - bold
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const selected = value.slice(selectionStart, selectionEnd);
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const newValue = before + "**" + selected + "**" + after;
        onChange(newValue);
        requestAnimationFrame(() => {
          if (selected) {
            textarea.selectionStart = selectionStart;
            textarea.selectionEnd = selectionEnd + 4;
          } else {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
          }
        });
        return;
      }

      // Ctrl+I - italic
      if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const selected = value.slice(selectionStart, selectionEnd);
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const newValue = before + "*" + selected + "*" + after;
        onChange(newValue);
        requestAnimationFrame(() => {
          if (selected) {
            textarea.selectionStart = selectionStart;
            textarea.selectionEnd = selectionEnd + 2;
          } else {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          }
        });
        return;
      }

      // Enter - smart list continuation
      if (e.key === "Enter" && !e.shiftKey) {
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const currentLine = value.slice(lineStart, selectionStart);

        // Check for unordered list (- or *)
        const unorderedMatch = currentLine.match(/^(\s*)([-*])\s+(.*)$/);
        if (unorderedMatch) {
          const [, indent, bullet, content] = unorderedMatch;
          // Empty list item - exit list
          if (!content.trim()) {
            e.preventDefault();
            const newValue = value.slice(0, lineStart) + "\n" + value.slice(selectionEnd);
            onChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
            });
            return;
          }
          // Continue list
          e.preventDefault();
          const continuation = `\n${indent}${bullet} `;
          const newValue = value.slice(0, selectionStart) + continuation + value.slice(selectionEnd);
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + continuation.length;
          });
          return;
        }

        // Check for ordered list (1. 2. etc)
        const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (orderedMatch) {
          const [, indent, num, content] = orderedMatch;
          // Empty list item - exit list
          if (!content.trim()) {
            e.preventDefault();
            const newValue = value.slice(0, lineStart) + "\n" + value.slice(selectionEnd);
            onChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
            });
            return;
          }
          // Continue list with incremented number
          e.preventDefault();
          const nextNum = parseInt(num, 10) + 1;
          const continuation = `\n${indent}${nextNum}. `;
          const newValue = value.slice(0, selectionStart) + continuation + value.slice(selectionEnd);
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + continuation.length;
          });
          return;
        }
      }
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      {/* Toggle buttons */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-display rounded transition-colors ${
            !isPreview
              ? "bg-accent/20 text-accent"
              : "text-text-tertiary hover:text-text-primary"
          }`}
        >
          <Edit2 size={14} />
          Write
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-display rounded transition-colors ${
            isPreview
              ? "bg-accent/20 text-accent"
              : "text-text-tertiary hover:text-text-primary"
          }`}
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div
          className="min-h-[150px] bg-bg-secondary border border-border px-4 py-3 rounded"
          style={{ minHeight: `${rows * 24 + 24}px` }}
        >
          {value ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-headings:font-display prose-headings:mt-4 prose-headings:mb-2 prose-headings:first:mt-0 prose-h1:text-xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h2:text-lg prose-h3:text-base prose-p:text-text-secondary prose-p:my-2 prose-a:text-accent prose-strong:text-text-primary prose-code:text-accent prose-code:bg-bg-code prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-code prose-pre:border prose-pre:border-border prose-pre:my-2 prose-ul:text-text-secondary prose-ul:my-2 prose-ul:pl-4 prose-ol:text-text-secondary prose-ol:my-2 prose-ol:pl-4 prose-li:marker:text-accent prose-li:my-0.5">
              <Markdown>{value}</Markdown>
            </div>
          ) : (
            <p className="text-text-tertiary text-sm italic">
              Nothing to preview
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-mono resize-y min-h-[150px] text-sm rounded"
        />
      )}

      {/* Markdown hint */}
      {!isPreview && (
        <p className="text-xs text-text-tertiary">
          Markdown supported. Shortcuts: <kbd className="px-1 py-0.5 bg-bg-elevated rounded text-text-secondary">Ctrl+B</kbd> bold, <kbd className="px-1 py-0.5 bg-bg-elevated rounded text-text-secondary">Ctrl+I</kbd> italic, <kbd className="px-1 py-0.5 bg-bg-elevated rounded text-text-secondary">Tab</kbd> indent
        </p>
      )}
    </div>
  );
}
