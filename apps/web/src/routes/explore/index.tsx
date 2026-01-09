import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Loader2,
  Compass,
  LogIn,
  User,
  FileCode,
  Star,
  GitFork,
  ArrowUpDown,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExploreSnippetCard } from "@/components/explore-snippet-card";
import { showSuccess, handleApiError } from "@/lib/toast";

type SnippetCardData = Parameters<typeof ExploreSnippetCard>[0]["snippet"];

export const Route = createFileRoute("/explore/")({
  validateSearch: (search: Record<string, unknown>) => ({
    language: (search.language as string) || undefined,
    sortBy:
      (search.sortBy as "starCount" | "createdAt" | "forkCount" | undefined) ||
      undefined,
    sortOrder: (search.sortOrder as "asc" | "desc" | undefined) || undefined,
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = searchParams;
  const sortBy = searchParams.sortBy || "starCount";
  const sortOrder = searchParams.sortOrder || "desc";
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is logged in
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/get-session", {
          credentials: "include",
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const isLoggedIn = !!sessionData?.session;

  // Fetch public snippets
  const {
    data: exploreData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["explore", { language, sortBy, sortOrder, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (language) params.set("language", language);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/public/explore?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch snippets");
      return res.json();
    },
  });

  // Fetch user's starred snippets (if logged in)
  const { data: starsData } = useQuery({
    queryKey: ["stars"],
    queryFn: async () => {
      const res = await fetch("/api/stars", { credentials: "include" });
      if (!res.ok) return { snippets: [] };
      return res.json();
    },
    enabled: isLoggedIn,
  });

  const starredIds = new Set(
    starsData?.snippets?.map((s: { id: string }) => s.id) || []
  );

  // Fetch matching users when searching
  const { data: usersData } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { users: [] };
      const res = await fetch(
        `/api/public/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) return { users: [] };
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const matchingUsers = usersData?.users || [];

  // Star mutation
  const starMutation = useMutation({
    mutationFn: async ({
      snippetId,
      isStarred,
    }: {
      snippetId: string;
      isStarred: boolean;
    }) => {
      const method = isStarred ? "DELETE" : "POST";
      const res = await fetch(`/api/stars/${snippetId}`, {
        method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update star");
      return res.json();
    },
    onSuccess: (_, { isStarred }) => {
      queryClient.invalidateQueries({ queryKey: ["stars"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      showSuccess(isStarred ? "Removed from starred" : "Added to starred");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update star");
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
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      showSuccess(`Forked as "${data.snippet.title}"`);
      navigate({
        to: "/dashboard/$snippetId",
        params: { snippetId: data.snippet.id },
      });
    },
    onError: (error) => {
      handleApiError(error, "Failed to fork snippet");
    },
  });

  const handleStar = (snippetId: string) => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: "/explore" } });
      return;
    }
    const isStarred = starredIds.has(snippetId);
    starMutation.mutate({ snippetId, isStarred });
  };

  const handleFork = (snippetId: string) => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: "/explore" } });
      return;
    }
    forkMutation.mutate(snippetId);
  };

  const snippets = exploreData?.snippets || [];
  const languages = exploreData?.languages || [];

  const sortOptions = [
    { value: "starCount", label: "Most Starred", icon: Star },
    { value: "createdAt", label: "Most Recent", icon: ArrowUpDown },
    { value: "forkCount", label: "Most Forked", icon: GitFork },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header - Terminal style nav */}
      <header className="fixed top-0 w-full z-50 border-b border-border-muted bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-lg flex items-center gap-1">
            <span className="text-accent">{`>`}</span>
            <span>SnippetVault</span>
            <span className="animate-blink">_</span>
          </Link>

          <div className="flex items-center gap-6">
            <span className="text-accent font-display text-sm hidden sm:block">
              /explore
            </span>
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                search={{
                  filter: undefined,
                  tag: undefined,
                  sortBy: undefined,
                  sortOrder: undefined,
                  language: undefined,
                }}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm font-display"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/explore" }}
                className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors text-sm"
              >
                <LogIn size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with dot-grid background */}
      <main className="pt-16 min-h-screen dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <Compass size={28} className="text-accent" />
              </div>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              Explore <span className="text-accent">Snippets</span>
            </h1>
            <p className="text-text-secondary max-w-md mx-auto">
              Discover and fork public code snippets from the community
            </p>
          </div>

          {/* Search & Filters - Terminal block style */}
          <div className="terminal-block rounded-lg p-4 sm:p-6 mb-8 glow-green-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  placeholder="Search snippets and users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-primary border border-border pl-12 pr-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display text-sm placeholder:text-text-tertiary"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Language Filter */}
                <div className="relative">
                  <select
                    value={language || ""}
                    onChange={(e) =>
                      navigate({
                        to: "/explore",
                        search: {
                          ...searchParams,
                          language: e.target.value || undefined,
                        },
                      })
                    }
                    className="appearance-none bg-bg-primary border border-border px-4 py-3 pr-10 text-text-primary focus:border-accent focus:outline-none font-display text-sm min-w-[150px] cursor-pointer"
                  >
                    <option value="">All Languages</option>
                    {languages.map((lang: string) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  <FileCode
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      navigate({
                        to: "/explore",
                        search: {
                          ...searchParams,
                          sortBy: e.target.value as
                            | "starCount"
                            | "createdAt"
                            | "forkCount",
                        },
                      })
                    }
                    className="appearance-none bg-bg-primary border border-border px-4 py-3 pr-10 text-text-primary focus:border-accent focus:outline-none font-display text-sm min-w-[150px] cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Active filters indicator */}
            {(language || searchQuery) && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 flex-wrap">
                <span className="text-text-tertiary text-xs font-display">
                  FILTERS:
                </span>
                {language && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/30 text-accent text-xs font-display">
                    <FileCode size={12} />
                    {language}
                    <button
                      onClick={() =>
                        navigate({
                          to: "/explore",
                          search: { ...searchParams, language: undefined },
                        })
                      }
                      className="ml-1 hover:text-accent-hover"
                    >
                      x
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/30 text-accent text-xs font-display">
                    <Search size={12} />"{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:text-accent-hover"
                    >
                      x
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 bg-bg-secondary border border-border rounded-lg mb-4">
                <Loader2 size={32} className="animate-spin text-accent" />
              </div>
              <p className="text-text-secondary font-display text-sm">
                Loading snippets...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="terminal-block rounded-lg p-8 text-center">
              <div className="text-error font-display text-lg mb-2">
                // Error
              </div>
              <p className="text-text-secondary mb-4">
                Failed to load snippets
              </p>
              <button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["explore"] })
                }
                className="text-accent hover:text-accent-hover transition-colors font-display"
              >
                {`> retry`}
              </button>
            </div>
          )}

          {/* User search results */}
          {searchQuery.length >= 2 && matchingUsers.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-accent" />
                  Users ({matchingUsers.length})
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {matchingUsers.map(
                  (user: {
                    id: string;
                    name: string;
                    username: string;
                    image: string | null;
                    publicSnippets: number;
                  }) => (
                    <Link
                      key={user.id}
                      to="/u/$username"
                      params={{ username: user.username }}
                      className="terminal-block rounded-lg p-4 hover:border-accent transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-12 h-12 rounded-full border border-border group-hover:border-accent transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                            <User size={22} className="text-accent" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-medium truncate group-hover:text-accent transition-colors">
                            {user.name}
                          </div>
                          <div className="text-text-tertiary text-sm truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-text-tertiary text-xs">
                        <FileCode size={12} className="text-accent" />
                        <span>
                          {user.publicSnippets} public{" "}
                          {user.publicSnippets === 1 ? "snippet" : "snippets"}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          )}

          {/* Snippets section header */}
          {!isLoading &&
            !error &&
            snippets.length > 0 &&
            searchQuery.length >= 2 &&
            matchingUsers.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <FileCode size={14} className="text-accent" />
                  Snippets ({snippets.length})
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

          {/* Empty state */}
          {!isLoading && !error && snippets.length === 0 && (
            <div className="terminal-block rounded-lg p-12 text-center glow-green-sm">
              <div className="inline-flex items-center justify-center p-4 bg-bg-secondary border border-border rounded-lg mb-6">
                <Compass size={40} className="text-text-tertiary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-3">
                No snippets found
              </h2>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : "Be the first to share a public snippet with the community!"}
              </p>
              {isLoggedIn && (
                <Link
                  to="/dashboard/new"
                  className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-display font-medium hover:bg-accent-hover transition-colors"
                >
                  {`>`} Create Snippet
                </Link>
              )}
              {!isLoggedIn && (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-display font-medium hover:bg-accent-hover transition-colors"
                >
                  {`>`} Sign Up to Create
                </Link>
              )}
            </div>
          )}

          {/* Snippets Grid */}
          {!isLoading && !error && snippets.length > 0 && (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {snippets.map((snippet: SnippetCardData) => (
                <ExploreSnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  isStarred={starredIds.has(snippet.id)}
                  onStar={handleStar}
                  onFork={handleFork}
                  showActions={true}
                />
              ))}
            </div>
          )}

          {/* Results count */}
          {!isLoading && !error && snippets.length > 0 && (
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-bg-secondary border border-border rounded-full">
                <span className="text-text-tertiary text-sm font-display">
                  Showing <span className="text-accent">{snippets.length}</span>{" "}
                  of{" "}
                  <span className="text-accent">
                    {exploreData?.total || snippets.length}
                  </span>{" "}
                  snippets
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 bg-bg-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="font-display text-sm flex items-center gap-1">
            <span className="text-accent">{`>`}</span>
            <span>SnippetVault</span>
          </Link>
          <p className="text-text-tertiary text-xs font-display">
            Built for developers who hate repeating themselves.
          </p>
        </div>
      </footer>
    </div>
  );
}
