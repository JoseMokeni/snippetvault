import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Markdown from "react-markdown";
import {
  ArrowLeft,
  Edit2,
  Star,
  Copy,
  Trash2,
  Loader2,
  Download,
  MoreVertical,
  FileText,
  Share2,
  Globe,
  GitFork,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { FileTreeViewer } from "@/components/file-tree-viewer";
import { VariableEditor } from "@/components/variable-editor";
import { TagBadge } from "@/components/tag-badge";
import { ExportModal } from "@/components/export-modal";
import { showSuccess, handleApiError } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/dashboard/$snippetId")({
  component: SnippetDetailPage,
});

function SnippetDetailPage() {
  const { snippetId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [showMenu, setShowMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch snippet
  const {
    data: snippetData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["snippet", snippetId],
    queryFn: async () => {
      const res = await api.snippets[":id"].$get({
        param: { id: snippetId },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Snippet not found");
        throw new Error("Failed to fetch snippet");
      }
      return res.json();
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.snippets[":id"].favorite.$patch({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snippet", snippetId] });
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      showSuccess(
        data.snippet.isFavorite
          ? "Added to favorites"
          : "Removed from favorites"
      );
    },
    onError: (error) => {
      handleApiError(error, "Failed to update favorite");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.snippets[":id"].duplicate.$post({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to duplicate snippet");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      const newId = (data as { snippet: { id: string } }).snippet.id;
      showSuccess("Snippet duplicated");
      navigate({ to: "/dashboard/$snippetId", params: { snippetId: newId } });
    },
    onError: (error) => {
      handleApiError(error, "Failed to duplicate snippet");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.snippets[":id"].$delete({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to delete snippet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      showSuccess("Snippet deleted");
      navigate({
        to: "/dashboard",
        search: {
          filter: undefined,
          tag: undefined,
          sortBy: undefined,
          sortOrder: undefined,
          language: undefined,
        },
      });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete snippet");
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this snippet? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleShare = () => {
    if (snippet?.slug) {
      const url = `${window.location.origin}/s/${snippet.slug}`;
      navigator.clipboard.writeText(url).catch(() => {
        // Clipboard permission denied, but URL is still shown in the UI
      });
      showSuccess("Public link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Link
          to="/dashboard"
          search={{
            filter: undefined,
            tag: undefined,
            sortBy: undefined,
            sortOrder: undefined,
            language: undefined,
          }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to Snippets
        </Link>

        <div className="text-center py-16">
          <div className="text-error text-lg mb-4">{error.message}</div>
          <Link
            to="/dashboard"
            search={{
              filter: undefined,
              tag: undefined,
              sortBy: undefined,
              sortOrder: undefined,
              language: undefined,
            }}
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const snippet = snippetData?.snippet;
  if (!snippet) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <Link
          to="/dashboard"
          search={{
            filter: undefined,
            tag: undefined,
            sortBy: undefined,
            sortOrder: undefined,
            language: undefined,
          }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Snippets</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/dashboard/$snippetId/edit"
            params={{ snippetId }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors text-sm"
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </Link>

          {snippet.isPublic && snippet.slug && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-accent bg-accent/5 text-accent hover:bg-accent/10 hover:border-accent transition-colors text-sm"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">Share</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 border border-border text-text-primary hover:text-accent hover:border-accent transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-10 w-40 bg-bg-elevated border border-border rounded shadow-lg">
                <button
                  onClick={() => {
                    toggleFavoriteMutation.mutate();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <Star
                    size={14}
                    className={
                      snippet.isFavorite ? "fill-warning text-warning" : ""
                    }
                  />
                  {snippet.isFavorite ? "Unfavorite" : "Favorite"}
                </button>
                <button
                  onClick={() => {
                    duplicateMutation.mutate();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Meta */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start gap-3 mb-3 sm:mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold break-words">
            {snippet.title}
          </h1>
          {snippet.isPublic && (
            <Globe
              size={20}
              className="text-accent flex-shrink-0 mt-0.5 sm:mt-1 sm:w-6 sm:h-6"
            />
          )}
          {snippet.isFavorite && (
            <Star
              size={20}
              className="text-warning fill-warning flex-shrink-0 mt-0.5 sm:mt-1 sm:w-6 sm:h-6"
            />
          )}
        </div>

        {/* Forked from indicator */}
        {snippet.forkedFrom && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
            <GitFork size={14} />
            <span>Forked from</span>
            {snippet.forkedFrom.slug ? (
              <Link
                to="/explore/$slug"
                params={{ slug: snippet.forkedFrom.slug }}
                className="text-accent hover:underline"
              >
                {snippet.forkedFrom.title}
              </Link>
            ) : (
              <span className="text-text-tertiary">
                {snippet.forkedFrom.title}
              </span>
            )}
            {snippet.forkedFrom.user && (
              <span className="text-text-tertiary">
                by @{snippet.forkedFrom.user.username}
              </span>
            )}
          </div>
        )}

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
              {snippet.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}

          <span className="text-xs text-text-tertiary">
            {snippet.files?.length || 0} files
          </span>
        </div>
      </div>

      {/* Public Link */}
      {snippet.isPublic && snippet.slug && (
        <div className="terminal-block rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-accent" />
            <h2 className="font-display font-bold text-base sm:text-lg">
              Public Link
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mb-3">
            Share this link with anyone. They can view this snippet without
            signing in.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/s/${snippet.slug}`}
              className="flex-1 bg-bg-secondary border border-border px-3 py-2 text-text-primary font-mono text-xs sm:text-sm focus:outline-none focus:border-accent"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-accent bg-accent/5 text-accent hover:bg-accent/10 hover:border-accent transition-colors text-sm whitespace-nowrap"
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {snippet.instructions && (
        <div className="terminal-block rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <FileText size={16} className="text-accent" />
            <h2 className="font-display font-bold text-base sm:text-lg">
              Instructions
            </h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-headings:font-display prose-p:text-text-secondary prose-a:text-accent prose-strong:text-text-primary prose-code:text-accent prose-code:bg-bg-code prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-code prose-pre:border prose-pre:border-border prose-ul:text-text-secondary prose-ul:list-inside prose-ol:text-text-secondary prose-ol:list-inside prose-li:marker:text-accent overflow-x-auto">
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
          <Link
            to="/dashboard/$snippetId/edit"
            params={{ snippetId }}
            className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors mt-4"
          >
            <Edit2 size={16} />
            Add files
          </Link>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        snippetTitle={snippet.title}
        files={snippet.files || []}
        variables={snippet.variables || []}
        initialValues={variableValues}
      />
    </div>
  );
}
