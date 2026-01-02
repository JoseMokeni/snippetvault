import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";
import { api } from "@/lib/api-client";
import { CodeViewer } from "@/components/code-viewer";
import { VariableEditor } from "@/components/variable-editor";
import { TagBadge } from "@/components/tag-badge";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippet", snippetId] });
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
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
      navigate({ to: "/dashboard/$snippetId", params: { snippetId: newId } });
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
      navigate({
        to: "/dashboard",
        search: { filter: undefined, tag: undefined },
      });
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
    if (!snippetData?.snippet) return;

    const { snippet } = snippetData;
    const exportData = {
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      instructions: snippet.instructions,
      files: snippet.files,
      variables: snippet.variables,
      tags: snippet.tags?.map((t) => t.name),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snippet.title.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          search={{ filter: undefined, tag: undefined }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to Snippets
        </Link>

        <div className="text-center py-16">
          <div className="text-error text-lg mb-4">{error.message}</div>
          <Link
            to="/dashboard"
            search={{ filter: undefined, tag: undefined }}
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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/dashboard"
          search={{ filter: undefined, tag: undefined }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Snippets
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/$snippetId/edit"
            params={{ snippetId }}
            className="flex items-center gap-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </Link>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
          >
            <Download size={16} />
            Export
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
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
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <h1 className="font-display text-3xl font-bold">{snippet.title}</h1>
          {snippet.isFavorite && (
            <Star
              size={24}
              className="text-warning fill-warning flex-shrink-0 mt-1"
            />
          )}
        </div>

        {snippet.description && (
          <p className="text-text-secondary text-lg mb-4">
            {snippet.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
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

      {/* Instructions */}
      {snippet.instructions && (
        <div className="terminal-block rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-accent" />
            <h2 className="font-display font-bold">Instructions</h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-text-secondary font-body text-sm leading-relaxed">
              {snippet.instructions}
            </pre>
          </div>
        </div>
      )}

      {/* Variables */}
      {snippet.variables && snippet.variables.length > 0 && (
        <div className="mb-8">
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
          <h2 className="font-display font-bold mb-4">Files</h2>
          <CodeViewer
            files={snippet.files}
            variables={snippet.variables || []}
            variableValues={variableValues}
          />
        </div>
      )}

      {/* Empty files state */}
      {(!snippet.files || snippet.files.length === 0) && (
        <div className="terminal-block rounded-lg p-8 text-center">
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
    </div>
  );
}
