import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Star, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExploreSnippetCard } from "@/components/explore-snippet-card";
import { showSuccess, handleApiError } from "@/lib/toast";

type SnippetCardData = Parameters<typeof ExploreSnippetCard>[0]["snippet"];

export const Route = createFileRoute("/_authenticated/dashboard/starred")({
  component: StarredPage,
});

function StarredPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch starred snippets
  const {
    data: starsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stars"],
    queryFn: async () => {
      const res = await fetch("/api/stars", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch starred snippets");
      return res.json();
    },
  });

  // Unstar mutation
  const unstarMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const res = await fetch(`/api/stars/${snippetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unstar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stars"] });
      showSuccess("Removed from starred");
    },
    onError: (error) => {
      handleApiError(error, "Failed to unstar");
    },
  });

  // Fork mutation
  const forkMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const res = await fetch(`/api/snippets/${snippetId}/fork`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fork snippet");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stars"] });
      showSuccess(`Forked as "${data.snippet.title}"`);
      navigate({ to: "/dashboard/$snippetId", params: { snippetId: data.snippet.id } });
    },
    onError: (error) => {
      handleApiError(error, "Failed to fork snippet");
    },
  });

  const snippets = starsData?.snippets || [];

  // Filter by search
  const filteredSnippets = searchQuery
    ? snippets.filter(
        (s: { title: string; description: string | null }) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : snippets;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-3">
            <Star className="text-warning" />
            Starred Snippets
          </h1>
          <p className="text-text-secondary mt-1 text-sm sm:text-base">
            {snippets.length} {snippets.length === 1 ? "snippet" : "snippets"} from other users
          </p>
        </div>
        <Link
          to="/explore"
          search={{ language: undefined, sortBy: undefined, sortOrder: undefined }}
          className="flex items-center justify-center sm:justify-start gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          Explore More
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 sm:mb-8">
        <Search
          size={18}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <input
          type="text"
          placeholder="Search starred snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-secondary border border-border pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-text-primary focus:border-accent focus:outline-none font-display text-sm sm:text-base"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-16">
          <div className="text-error mb-4">Failed to load starred snippets</div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["stars"] })}
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && snippets.length === 0 && (
        <div className="text-center py-16">
          <Star size={48} className="mx-auto text-text-tertiary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">
            No starred snippets yet
          </h2>
          <p className="text-text-secondary mb-6">
            Explore public snippets and star the ones you like!
          </p>
          <Link
            to="/explore"
            search={{ language: undefined, sortBy: undefined, sortOrder: undefined }}
            className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors"
          >
            Explore Snippets
          </Link>
        </div>
      )}

      {/* No search results */}
      {!isLoading && !error && snippets.length > 0 && filteredSnippets.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-text-tertiary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">
            No matching snippets
          </h2>
          <p className="text-text-secondary">
            Try a different search term
          </p>
        </div>
      )}

      {/* Snippets Grid */}
      {!isLoading && !error && filteredSnippets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSnippets.map((snippet: SnippetCardData) => (
            <ExploreSnippetCard
              key={snippet.id}
              snippet={snippet}
              isStarred={true}
              onStar={(id) => unstarMutation.mutate(id)}
              onFork={(id) => forkMutation.mutate(id)}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
