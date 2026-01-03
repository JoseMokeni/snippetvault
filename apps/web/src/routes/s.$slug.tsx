import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Markdown from "react-markdown";
import {
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  Globe,
  Eye,
} from "lucide-react";
import { FileTreeViewer } from "@/components/file-tree-viewer";
import { VariableEditor } from "@/components/variable-editor";
import { TagBadge } from "@/components/tag-badge";
import { ExportModal } from "@/components/export-modal";

export const Route = createFileRoute("/s/$slug")({
  component: PublicSnippetPage,
});

function PublicSnippetPage() {
  const { slug } = Route.useParams();
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch public snippet
  const {
    data: snippetData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-snippet", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/snippets/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Snippet not found");
        throw new Error("Failed to fetch snippet");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            Go to Home
          </Link>

          <div className="text-center py-16">
            <Globe size={48} className="mx-auto text-text-tertiary mb-4" />
            <div className="text-error text-lg mb-4">{error.message}</div>
            <p className="text-text-secondary">
              This snippet may be private or no longer exists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const snippet = snippetData?.snippet;
  if (!snippet) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border bg-bg-secondary">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              <ArrowLeft size={18} />
              <span>Home</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded font-mono text-xs">
                <Eye size={12} />
                <span>READ-ONLY VIEW</span>
              </div>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors text-sm"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Title & Meta */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            <h1 className="font-display text-2xl sm:text-3xl font-bold break-words">
              {snippet.title}
            </h1>
            <Globe
              size={20}
              className="text-accent flex-shrink-0 mt-0.5 sm:mt-1 sm:w-6 sm:h-6"
            />
          </div>

          {snippet.description && (
            <p className="text-text-secondary text-base sm:text-lg mb-3 sm:mb-4">
              {snippet.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs uppercase tracking-wider text-text-tertiary bg-bg-secondary px-3 py-1 rounded font-display">
              {snippet.language}
            </span>

            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {snippet.tags.map((tag: { id: string; name: string; color: string | null }) => (
                  <TagBadge key={tag.id} tag={tag} size="sm" />
                ))}
              </div>
            )}

            <span className="text-xs text-text-tertiary">
              {snippet.files?.length || 0} files
            </span>
          </div>
        </div>

        {/* Instructions */}
        {snippet.instructions && (
          <div className="terminal-block rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <FileText size={16} className="text-accent" />
              <h2 className="font-display font-bold text-base sm:text-lg">
                Instructions
              </h2>
            </div>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-headings:font-display prose-p:text-text-secondary prose-a:text-accent prose-strong:text-text-primary prose-code:text-accent prose-code:bg-bg-code prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-code prose-pre:border prose-pre:border-border prose-ul:text-text-secondary prose-ol:text-text-secondary prose-li:marker:text-accent overflow-x-auto">
              <Markdown>{snippet.instructions}</Markdown>
            </div>
          </div>
        )}

        {/* Variables */}
        {snippet.variables && snippet.variables.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="font-display text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Variables
            </h2>
            <VariableEditor
              variables={snippet.variables}
              values={variableValues}
              onChange={setVariableValues}
            />
          </div>
        )}

        {/* Files / Code */}
        {snippet.files && snippet.files.length > 0 && (
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Files
            </h2>
            <FileTreeViewer
              files={snippet.files}
              variables={snippet.variables || []}
              variableValues={variableValues}
            />
          </div>
        )}

        {/* Empty files state */}
        {(!snippet.files || snippet.files.length === 0) && (
          <div className="terminal-block rounded-lg p-6 sm:p-8 text-center">
            <p className="text-text-tertiary">No files in this snippet</p>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        snippetTitle={snippet.title}
        files={snippet.files || []}
        variables={snippet.variables || []}
        initialValues={variableValues}
      />

      {/* Footer */}
      <div className="border-t border-border bg-bg-secondary mt-12">
        <div className="max-w-6xl mx-auto p-6 text-center">
          <p className="text-text-tertiary text-sm mb-2">
            Shared via SnippetVault
          </p>
          <Link
            to="/"
            className="text-accent hover:text-accent-hover transition-colors text-sm"
          >
            Create your own snippets →
          </Link>
        </div>
      </div>
    </div>
  );
}
