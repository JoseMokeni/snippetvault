import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  GitFork,
  User,
  Calendar,
  FileCode,
  LogIn,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExploreSnippetCard } from "@/components/explore-snippet-card";
import { showSuccess, handleApiError } from "@/lib/toast";

type SnippetCardData = Parameters<typeof ExploreSnippetCard>[0]["snippet"];

export const Route = createFileRoute("/u/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch user profile
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/public/users/${username}`);
      if (!res.ok) throw new Error("User not found");
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
      queryClient.invalidateQueries({ queryKey: ["user-profile", username] });
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
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", username] });
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
      navigate({ to: "/login", search: { redirect: `/u/${username}` } });
      return;
    }
    const isStarred = starredIds.has(snippetId);
    starMutation.mutate({ snippetId, isStarred });
  };

  const handleFork = (snippetId: string) => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: `/u/${username}` } });
      return;
    }
    forkMutation.mutate(snippetId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin text-accent">Loading...</div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Link
            to="/explore"
            search={{
              language: undefined,
              sortBy: undefined,
              sortOrder: undefined,
            }}
            className="text-accent hover:text-accent-hover"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const { user, snippets, stats } = profileData;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg flex items-center gap-1">
            <span className="text-accent">{`>`}</span>
            <span>SnippetVault</span>
            <span className="animate-blink">_</span>
          </Link>

          <div className="flex items-center gap-4">
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
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: `/u/${username}` }}
                className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors text-sm"
              >
                <LogIn size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/explore"
          search={{
            language: undefined,
            sortBy: undefined,
            sortOrder: undefined,
          }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>

        {/* User Profile Card */}
        <div className="terminal-block rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                <User size={40} className="text-accent" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{user.name}</h1>
              <p className="text-accent">@{user.username}</p>
              <p className="text-text-tertiary text-sm mt-2 flex items-center gap-1.5">
                <Calendar size={14} />
                Member since {formatDate(user.createdAt)}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {stats.publicSnippets}
                </div>
                <div className="text-text-tertiary text-sm flex items-center gap-1.5 justify-center">
                  <FileCode size={14} />
                  Snippets
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {stats.totalStars}
                </div>
                <div className="text-text-tertiary text-sm flex items-center gap-1.5 justify-center">
                  <Star size={14} />
                  Stars
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalForks}</div>
                <div className="text-text-tertiary text-sm flex items-center gap-1.5 justify-center">
                  <GitFork size={14} />
                  Forks
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Snippets */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold mb-4">
            Public Snippets ({snippets.length})
          </h2>
        </div>

        {/* Empty state */}
        {snippets.length === 0 && (
          <div className="text-center py-16">
            <FileCode size={48} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">
              No public snippets yet
            </h2>
            <p className="text-text-secondary">
              This user hasn't shared any public snippets.
            </p>
          </div>
        )}

        {/* Snippets Grid */}
        {snippets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {snippets.map((snippet: Omit<SnippetCardData, "user">) => (
              <ExploreSnippetCard
                key={snippet.id}
                snippet={{ ...snippet, user }}
                isStarred={starredIds.has(snippet.id)}
                onStar={handleStar}
                onFork={handleFork}
                showActions={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
