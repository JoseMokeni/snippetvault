import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Globe, Lock } from "lucide-react";
import { api } from "@/lib/api-client";
import { FileTreeEditor } from "@/components/file-tree-editor";
import { VariableForm } from "@/components/variable-editor";
import { TagSelector } from "@/components/tag-badge";
import { MarkdownEditor } from "@/components/markdown-editor";

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
    isPublic: boolean;
  };
  availableTags: { id: string; name: string; color: string | null }[];
  onCreateTag: (
    name: string,
    color: string
  ) => Promise<{ id: string; name: string; color: string | null } | null>;
}

function SnippetForm({
  snippetId,
  initialData,
  availableTags,
  onCreateTag,
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
  const [isPublic, setIsPublic] = useState(initialData.isPublic);
  const [error, setError] = useState("");

  // Update snippet mutation - handles metadata, files, and variables
  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. Update snippet metadata
      const metadataRes = await api.snippets[":id"].$put({
        param: { id: snippetId },
        json: {
          title,
          description: description || undefined,
          language,
          instructions: instructions || undefined,
          isPublic,
          tagIds: selectedTagIds,
        },
      });
      if (!metadataRes.ok) {
        const data = await metadataRes.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to update snippet"
        );
      }

      // 2. Handle file changes
      const initialFileIds = new Set(
        initialData.files.filter((f) => f.id).map((f) => f.id)
      );
      const currentFileIds = new Set(
        files.filter((f) => f.id).map((f) => f.id)
      );

      // Find deleted files (in initial but not in current)
      const deletedFileIds = [...initialFileIds].filter(
        (id) => !currentFileIds.has(id)
      );

      // Delete removed files
      for (const fileId of deletedFileIds) {
        const deleteRes = await api.files[":id"].$delete({
          param: { id: fileId! },
        });
        if (!deleteRes.ok) {
          console.error(`Failed to delete file ${fileId}`);
        }
      }

      // Update existing files and create new ones
      for (const file of files) {
        if (file.id && initialFileIds.has(file.id)) {
          // Existing file - check if modified
          const originalFile = initialData.files.find((f) => f.id === file.id);
          if (
            originalFile &&
            (originalFile.filename !== file.filename ||
              originalFile.content !== file.content ||
              originalFile.language !== file.language ||
              originalFile.order !== file.order)
          ) {
            // File was modified - update it
            const updateRes = await api.files[":id"].$put({
              param: { id: file.id },
              json: {
                filename: file.filename,
                content: file.content,
                language: file.language,
                order: file.order,
              },
            });
            if (!updateRes.ok) {
              console.error(`Failed to update file ${file.id}`);
            }
          }
        } else {
          // New file - create it
          const createRes = await api.files.snippets[":snippetId"].files.$post({
            param: { snippetId },
            json: {
              filename: file.filename,
              content: file.content,
              language: file.language,
              order: file.order,
            },
          });
          if (!createRes.ok) {
            console.error(`Failed to create file ${file.filename}`);
          }
        }
      }

      // 3. Handle variable changes
      const initialVarIds = new Set(
        initialData.variables.filter((v) => v.id).map((v) => v.id)
      );
      const currentVarIds = new Set(
        variables.filter((v) => v.id).map((v) => v.id)
      );

      // Find deleted variables
      const deletedVarIds = [...initialVarIds].filter(
        (id) => !currentVarIds.has(id)
      );

      // Delete removed variables
      for (const varId of deletedVarIds) {
        const deleteRes = await api.variables[":id"].$delete({
          param: { id: varId! },
        });
        if (!deleteRes.ok) {
          console.error(`Failed to delete variable ${varId}`);
        }
      }

      // Update existing variables and create new ones
      for (const variable of variables) {
        if (variable.id && initialVarIds.has(variable.id)) {
          // Existing variable - check if modified
          const originalVar = initialData.variables.find(
            (v) => v.id === variable.id
          );
          if (
            originalVar &&
            (originalVar.name !== variable.name ||
              originalVar.defaultValue !== variable.defaultValue ||
              originalVar.description !== variable.description)
          ) {
            // Variable was modified - update it
            const updateRes = await api.variables[":id"].$put({
              param: { id: variable.id },
              json: {
                name: variable.name,
                defaultValue: variable.defaultValue || undefined,
                description: variable.description || undefined,
              },
            });
            if (!updateRes.ok) {
              console.error(`Failed to update variable ${variable.id}`);
            }
          }
        } else {
          // New variable - create it
          const createRes = await api.variables.snippets[
            ":snippetId"
          ].variables.$post({
            param: { snippetId },
            json: {
              name: variable.name,
              defaultValue: variable.defaultValue || "",
              description: variable.description || undefined,
            },
          });
          if (!createRes.ok) {
            console.error(`Failed to create variable ${variable.name}`);
          }
        }
      }

      return metadataRes.json();
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <Link
          to="/dashboard/$snippetId"
          params={{ snippetId }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Cancel
        </Link>

        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending || !title.trim()}
          className="hidden sm:flex items-center gap-2 bg-accent text-bg-primary px-6 py-2 font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        Edit Snippet
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
              maxLength={200}
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
              maxLength={500}
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
                onCreateTag={onCreateTag}
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
        {files.length > 0 && (
          <div>
            <h2 className="font-display font-bold mb-3 sm:mb-4 text-base sm:text-lg">
              File Structure
            </h2>
            <p className="text-xs sm:text-sm text-text-tertiary mb-3 sm:mb-4">
              Manage your snippet files and folder structure.
            </p>
            <FileTreeEditor files={files} onChange={setFiles} />
          </div>
        )}

        {/* Variables - Read only for now */}
        {variables.length > 0 && (
          <div className="terminal-block rounded-lg p-4 sm:p-6">
            <VariableForm variables={variables} onChange={setVariables} />
          </div>
        )}

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
                <span>{initialData.isPublic ? "PUBLIC SNIPPET" : "MAKING PUBLIC"}</span>
              </div>
              <div className="text-sm text-text-secondary">
                <p className="mb-2">
                  {initialData.isPublic
                    ? "This snippet has a public link. You can change it back to private at any time."
                    : "A shareable link will be generated when you save."}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Anyone with the link can view (read-only)</li>
                  <li>Link remains accessible even if changed to private later</li>
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
        console.error("Failed to create tag");
        return null;
      }
      const data = await res.json();
      await refetchTags();
      return (
        data as { tag: { id: string; name: string; color: string | null } }
      ).tag;
    } catch (err) {
      console.error("Failed to create tag:", err);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link
          to="/dashboard"
          search={{ filter: undefined, tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 sm:mb-8 text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back to Snippets
        </Link>

        <div className="text-center py-12 sm:py-16">
          <div className="text-error text-base sm:text-lg mb-4">
            {fetchError.message}
          </div>
          <Link
            to="/dashboard"
            search={{ filter: undefined, tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
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
    isPublic: snippet.isPublic || false,
  };

  const availableTags = tagsData?.tags || [];

  return (
    <SnippetForm
      key={snippetId}
      snippetId={snippetId}
      initialData={initialData}
      availableTags={availableTags}
      onCreateTag={handleCreateTag}
    />
  );
}
