import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Folder, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { SnippetCard } from "@/components/snippet-card";
import { showSuccess, handleApiError } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  validateSearch: (search: Record<string, unknown>) => ({
    filter: (search.filter as string) || undefined,
    tag: (search.tag as string) || undefined,
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { filter, tag } = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch snippets
  const {
    data: snippetsData,
    isLoading: snippetsLoading,
    error: snippetsError,
  } = useQuery({
    queryKey: [
      "snippets",
      { favorite: filter === "favorites", tag, search: searchQuery },
    ],
    queryFn: async () => {
      const res = await api.snippets.$get({
        query: {
          favorite: filter === "favorites" ? "true" : undefined,
          tag: tag || undefined,
          search: searchQuery || undefined,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch snippets");
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

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const res = await api.snippets[":id"].favorite.$patch({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: (data) => {
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
    mutationFn: async (snippetId: string) => {
      const res = await api.snippets[":id"].duplicate.$post({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to duplicate snippet");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      showSuccess(`Duplicated as "${data.snippet.title}"`);
    },
    onError: (error) => {
      handleApiError(error, "Failed to duplicate snippet");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const res = await api.snippets[":id"].$delete({
        param: { id: snippetId },
      });
      if (!res.ok) throw new Error("Failed to delete snippet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      showSuccess("Snippet deleted");
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete snippet");
    },
  });

  const handleDelete = (snippetId: string) => {
    if (confirm("Are you sure you want to delete this snippet?")) {
      deleteMutation.mutate(snippetId);
    }
  };

  const snippets = snippetsData?.snippets || [];
  const tags = tagsData?.tags || [];
  const selectedTag = tag ? tags.find((t) => t.name === tag) : null;

  const getTitle = () => {
    if (filter === "favorites") return "Favorites";
    if (selectedTag) return `Tag: ${selectedTag.name}`;
    return "All Snippets";
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">{getTitle()}</h1>
          <p className="text-text-secondary mt-1">
            {snippets.length} {snippets.length === 1 ? "snippet" : "snippets"}
            {filter === "favorites" && " marked as favorite"}
            {selectedTag && ` with tag "${selectedTag.name}"`}
          </p>
        </div>
        <Link
          to="/dashboard/new"
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={18} />
          <span>New Snippet</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-secondary border border-border pl-12 pr-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
        />
      </div>

      {/* Tag filters */}
      {tags.length > 0 && !filter && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            to="/dashboard"
            search={{ filter: undefined, tag: undefined }}
            className={`text-sm px-3 py-1.5 rounded font-display transition-colors ${
              !tag
                ? "bg-accent text-bg-primary"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary"
            }`}
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t.id}
              to="/dashboard"
              search={{ tag: t.name, filter: undefined }}
              className={`text-sm px-3 py-1.5 rounded font-display transition-colors ${
                tag === t.name
                  ? "bg-accent text-bg-primary"
                  : "border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: t.color || "#6b7280" }}
              />
              {t.name} ({t.snippetCount})
            </Link>
          ))}
        </div>
      )}

      {/* Loading state */}
      {snippetsLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}

      {/* Error state */}
      {snippetsError && (
        <div className="text-center py-16">
          <div className="text-error mb-4">Failed to load snippets</div>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["snippets"] })
            }
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!snippetsLoading && !snippetsError && snippets.length === 0 && (
        <div className="text-center py-16">
          <Folder size={48} className="mx-auto text-text-tertiary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">
            No snippets found
          </h2>
          <p className="text-text-secondary mb-6">
            {searchQuery
              ? "Try a different search term"
              : filter === "favorites"
              ? "Mark snippets as favorite to see them here"
              : "Create your first snippet to get started"}
          </p>
          {!searchQuery && !filter && (
            <Link
              to="/dashboard/new"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors"
            >
              <Plus size={18} />
              <span>Create Snippet</span>
            </Link>
          )}
        </div>
      )}

      {/* Snippets Grid */}
      {!snippetsLoading && !snippetsError && snippets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              filesCount={0} // We don't have this in list view, could add if needed
              onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
