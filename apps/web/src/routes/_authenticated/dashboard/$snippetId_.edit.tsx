import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { api } from "@/lib/api-client";
import { FileEditor } from "@/components/file-editor";
import { VariableForm } from "@/components/variable-editor";
import { TagSelector } from "@/components/tag-badge";

export const Route = createFileRoute(
  "/_authenticated/dashboard/$snippetId_/edit"
)({
  component: EditSnippetPage,
});

interface FileData {
  id?: string;
  filename: string;
  content: string;
  language: string;
  order: number;
}

interface VariableData {
  id?: string;
  name: string;
  defaultValue: string;
  description: string;
}

interface SnippetFormProps {
  snippetId: string;
  initialData: {
    title: string;
    description: string;
    language: string;
    instructions: string;
    files: FileData[];
    variables: VariableData[];
    tagIds: string[];
  };
  availableTags: { id: string; name: string; color: string | null }[];
}

function SnippetForm({
  snippetId,
  initialData,
  availableTags,
}: SnippetFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state initialized with props
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [language, setLanguage] = useState(initialData.language);
  const [instructions, setInstructions] = useState(initialData.instructions);
  const [files, setFiles] = useState<FileData[]>(initialData.files);
  const [variables, setVariables] = useState<VariableData[]>(
    initialData.variables
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData.tagIds
  );
  const [error, setError] = useState("");

  // Update snippet mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.snippets[":id"].$put({
        param: { id: snippetId },
        json: {
          title,
          description: description || undefined,
          language,
          instructions: instructions || undefined,
          tagIds: selectedTagIds,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to update snippet"
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["snippet", snippetId] });
      navigate({ to: "/dashboard/$snippetId", params: { snippetId } });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/dashboard/$snippetId"
          params={{ snippetId }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          Cancel
        </Link>

        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending || !title.trim()}
          className="flex items-center gap-2 bg-accent text-bg-primary px-6 py-2 font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <h1 className="font-display text-3xl font-bold mb-8">Edit Snippet</h1>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="terminal-block rounded-lg p-6 space-y-4">
          <h2 className="font-display font-bold mb-4">Basic Info</h2>

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
                availableTags={availableTags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="terminal-block rounded-lg p-6">
          <h2 className="font-display font-bold mb-4">Instructions</h2>
          <p className="text-sm text-text-tertiary mb-4">
            Add usage instructions, setup steps, or any notes for using this
            snippet.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="## How to use&#10;&#10;1. Copy the files to your project&#10;2. Install dependencies&#10;3. ..."
            rows={6}
            className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display resize-none text-sm"
          />
        </div>

        {/* Files - Read only for now */}
        {files.length > 0 && (
          <div>
            <h2 className="font-display font-bold mb-4">Files</h2>
            <p className="text-sm text-text-tertiary mb-4">
              File editing coming soon. For now, you can only update snippet
              metadata.
            </p>
            <FileEditor files={files} onChange={setFiles} />
          </div>
        )}

        {/* Variables - Read only for now */}
        {variables.length > 0 && (
          <div className="terminal-block rounded-lg p-6">
            <VariableForm variables={variables} onChange={setVariables} />
          </div>
        )}

        {/* Submit button (mobile) */}
        <div className="sm:hidden">
          <button
            type="submit"
            disabled={updateMutation.isPending || !title.trim()}
            className="flex items-center justify-center gap-2 w-full bg-accent text-bg-primary py-3 font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditSnippetPage() {
  const { snippetId } = Route.useParams();

  // Fetch snippet
  const {
    data: snippetData,
    isLoading,
    error: fetchError,
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

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.tags.$get();
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (fetchError) {
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
          <div className="text-error text-lg mb-4">{fetchError.message}</div>
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

  const initialData = {
    title: snippet.title,
    description: snippet.description || "",
    language: snippet.language,
    instructions: snippet.instructions || "",
    files:
      snippet.files?.map((f) => ({
        id: f.id,
        filename: f.filename,
        content: f.content,
        language: f.language || "plaintext",
        order: f.order,
      })) || [],
    variables:
      snippet.variables?.map((v) => ({
        id: v.id,
        name: v.name,
        defaultValue: v.defaultValue || "",
        description: v.description || "",
      })) || [],
    tagIds: snippet.tags?.map((t) => t.id) || [],
  };

  const availableTags = tagsData?.tags || [];

  return (
    <SnippetForm
      key={snippetId}
      snippetId={snippetId}
      initialData={initialData}
      availableTags={availableTags}
    />
  );
}
