import { useState } from "react";
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
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-headings:font-display prose-p:text-text-secondary prose-a:text-accent prose-strong:text-text-primary prose-code:text-accent prose-code:bg-bg-code prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-code prose-pre:border prose-pre:border-border prose-ul:text-text-secondary prose-ol:text-text-secondary prose-li:marker:text-accent">
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-mono resize-none text-sm rounded"
        />
      )}

      {/* Markdown hint */}
      {!isPreview && (
        <p className="text-xs text-text-tertiary">
          Supports Markdown: **bold**, *italic*, `code`, ## headings, - lists
        </p>
      )}
    </div>
  );
}
