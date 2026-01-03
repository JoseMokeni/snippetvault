import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Globe, Lock } from "lucide-react";
import { api } from "@/lib/api-client";
import { FileTreeEditor } from "@/components/file-tree-editor";
import { VariableForm } from "@/components/variable-editor";
import { TagSelector } from "@/components/tag-badge";
import { MarkdownEditor } from "@/components/markdown-editor";
import { showSuccess, showError, handleApiError } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/dashboard/new")({
  component: NewSnippetPage,
});

interface FileData {
  filename: string;
  content: string;
  language: string;
  order: number;
}

interface VariableData {
  name: string;
  defaultValue: string;
  description: string;
}

function NewSnippetPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<FileData[]>([
    { filename: "index.ts", content: "", language: "typescript", order: 0 },
  ]);
  const [variables, setVariables] = useState<VariableData[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  // Fetch tags
  const { data: tagsData, refetch: refetchTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.tags.$get();
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });

  // Create tag handler
  const handleCreateTag = async (name: string, color: string) => {
    try {
      const res = await api.tags.$post({
        json: { name, color },
      });
      if (!res.ok) {
        const data = await res.json();
        const errorMsg = (data as { error?: string }).error;
        if (errorMsg?.includes("already exists")) {
          showError(`Tag "${name}" already exists`);
        } else {
          showError("Failed to create tag");
        }
        return null;
      }
      const data = await res.json();
      await refetchTags();
      showSuccess(`Tag "${name}" created`);
      return (
        data as { tag: { id: string; name: string; color: string | null } }
      ).tag;
    } catch (err) {
      handleApiError(err, "Failed to create tag");
      return null;
    }
  };

  // Create snippet mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.snippets.$post({
        json: {
          title,
          description: description || undefined,
          language,
          instructions: instructions || undefined,
          isPublic,
          files: files.map((f, i) => ({
            filename: f.filename,
            content: f.content,
            language: f.language || language,
            order: i,
          })),
          variables: variables
            .filter((v) => v.name)
            .map((v, i) => ({
              name: v.name,
              defaultValue: v.defaultValue || "",
              description: v.description || undefined,
              order: i,
            })),
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to create snippet"
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      const newId = (data as { snippet: { id: string } }).snippet.id;
      showSuccess("Snippet created");
      navigate({ to: "/dashboard/$snippetId", params: { snippetId: newId } });
    },
    onError: (err) => {
      setError(err.message);
      handleApiError(err, "Failed to create snippet");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    createMutation.mutate();
  };

  const tags = tagsData?.tags || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <Link
          to="/dashboard"
          search={{ filter: undefined, tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Cancel
        </Link>

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !title.trim()}
          className="hidden sm:flex items-center gap-2 bg-accent text-bg-primary px-6 py-2 font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {createMutation.isPending ? "Saving..." : "Save Snippet"}
        </button>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Create New Snippet
      </h1>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Info */}
        <div className="terminal-block rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="font-display font-bold mb-3 sm:mb-4 text-base sm:text-lg">
            Basic Info
          </h2>

          <div>
            <label className="block text-sm text-text-secondary mb-2 font-display">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Snippet"
              className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2 font-display">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of what this snippet does..."
              rows={2}
              className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-text-secondary mb-2 font-display">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="ruby">Ruby</option>
                <option value="php">PHP</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="dockerfile">Dockerfile</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2 font-display">
                Tags
              </label>
              <TagSelector
                availableTags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
                onCreateTag={handleCreateTag}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="terminal-block rounded-lg p-4 sm:p-6">
          <h2 className="font-display font-bold mb-3 sm:mb-4 text-base sm:text-lg">
            Instructions
          </h2>
          <p className="text-xs sm:text-sm text-text-tertiary mb-3 sm:mb-4">
            Add usage instructions, setup steps, or any notes for using this
            snippet.
          </p>
          <MarkdownEditor
            value={instructions}
            onChange={setInstructions}
            rows={8}
          />
        </div>

        {/* Files */}
        <div>
          <h2 className="font-display font-bold mb-3 sm:mb-4 text-base sm:text-lg">
            File Structure
          </h2>
          <p className="text-xs sm:text-sm text-text-tertiary mb-3 sm:mb-4">
            Add files with full paths to create folder structure (e.g.,
            src/components/Button.tsx)
          </p>
          <FileTreeEditor files={files} onChange={setFiles} />
        </div>

        {/* Variables */}
        <div className="terminal-block rounded-lg p-4 sm:p-6">
          <VariableForm variables={variables} onChange={setVariables} />
        </div>

        {/* Visibility Settings */}
        <div className="terminal-block rounded-lg p-4 sm:p-6">
          <h2 className="font-display font-bold mb-3 sm:mb-4 text-base sm:text-lg">
            Visibility Settings
          </h2>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-1 w-4 h-4 border border-border bg-bg-secondary checked:bg-accent checked:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-text-primary group-hover:text-accent transition-colors">
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                <span>Make this snippet public</span>
              </div>
              <div className="text-sm text-text-secondary mt-1">
                {isPublic
                  ? "Anyone with the link can view this snippet (read-only)"
                  : "Only you can view this snippet"}
              </div>
            </div>
          </label>

          {isPublic && (
            <div className="mt-4 p-3 bg-accent/5 border border-accent/30 rounded">
              <div className="flex items-center gap-2 text-xs text-accent font-mono mb-2">
                <Globe size={12} />
                <span>PUBLIC SNIPPET</span>
              </div>
              <div className="text-sm text-text-secondary">
                <p className="mb-2">A shareable link will be generated when you save.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Anyone with the link can view (read-only)</li>
                  <li>Cannot be changed back to private once shared</li>
                  <li>Great for sharing code examples, tutorials, and documentation</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Submit button (mobile) */}
        <div className="sm:hidden">
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="flex items-center justify-center gap-2 w-full bg-accent text-bg-primary py-3 font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {createMutation.isPending ? "Saving..." : "Save Snippet"}
          </button>
        </div>
      </form>
    </div>
  );
}
