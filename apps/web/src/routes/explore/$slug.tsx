import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  GitFork,
  User,
  Calendar,
  Copy,
  Check,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CodeEditor } from "@/components/code-editor";
import { showSuccess, handleApiError } from "@/lib/toast";

export const Route = createFileRoute("/explore/$slug")({
  component: ExploreSnippetPage,
});

function ExploreSnippetPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

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

  // Fetch snippet
  const {
    data: snippetData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-snippet", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/snippets/${slug}`);
      if (!res.ok) throw new Error("Snippet not found");
      return res.json();
    },
  });

  // Check if starred
  const { data: starData } = useQuery({
    queryKey: ["star-check", snippetData?.snippet?.id],
    queryFn: async () => {
      const res = await fetch(`/api/stars/check/${snippetData?.snippet?.id}`, {
        credentials: "include",
      });
      if (!res.ok) return { starred: false };
      return res.json();
    },
    enabled: isLoggedIn && !!snippetData?.snippet?.id,
  });

  const isStarred = starData?.starred || false;

  // Star mutation
  const starMutation = useMutation({
    mutationFn: async () => {
      const method = isStarred ? "DELETE" : "POST";
      const res = await fetch(`/api/stars/${snippetData?.snippet?.id}`, {
        method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update star");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["star-check", snippetData?.snippet?.id] });
      queryClient.invalidateQueries({ queryKey: ["public-snippet", slug] });
      showSuccess(isStarred ? "Removed from starred" : "Added to starred");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update star");
    },
  });

  // Fork mutation
  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/snippets/${snippetData?.snippet?.id}/fork`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fork snippet");
      return res.json();
    },
    onSuccess: (data) => {
      showSuccess(`Forked as "${data.snippet.title}"`);
      navigate({ to: "/dashboard/$snippetId", params: { snippetId: data.snippet.id } });
    },
    onError: (error) => {
      handleApiError(error, "Failed to fork snippet");
    },
  });

  const handleStar = () => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: `/explore/${slug}` } });
      return;
    }
    starMutation.mutate();
  };

  const handleFork = () => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: `/explore/${slug}` } });
      return;
    }
    forkMutation.mutate();
  };

  const copyToClipboard = async (content: string, fileId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedFile(fileId);
    showSuccess("Copied to clipboard");
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin text-accent">Loading...</div>
      </div>
    );
  }

  if (error || !snippetData?.snippet) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Snippet not found</h1>
          <Link to="/explore" search={{ language: undefined, sortBy: undefined, sortOrder: undefined }} className="text-accent hover:text-accent-hover">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const snippet = snippetData.snippet;

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
                search={{ filter: undefined, tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: `/explore/${slug}` }}
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          to="/explore"
          search={{ language: undefined, sortBy: undefined, sortOrder: undefined }}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>

        {/* Snippet Header */}
        <div className="terminal-block rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-xs uppercase tracking-wider text-accent">
                  {snippet.language}
                </span>
                {snippet.forkedFrom && (
                  <span className="text-xs text-text-tertiary flex items-center gap-1">
                    <GitFork size={10} />
                    Forked from{" "}
                    <Link
                      to="/explore/$slug"
                      params={{ slug: snippet.forkedFrom.slug }}
                      className="text-accent hover:underline"
                    >
                      {snippet.forkedFrom.title}
                    </Link>
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold">{snippet.title}</h1>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Star size={16} className={isStarred ? "fill-warning text-warning" : ""} />
                  {snippet.starCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <GitFork size={16} />
                  {snippet.forkCount}
                </span>
              </div>

              <button
                onClick={handleStar}
                disabled={starMutation.isPending}
                className={`flex items-center gap-1.5 px-4 py-2 rounded transition-colors ${
                  isStarred
                    ? "bg-warning/10 text-warning border border-warning/30"
                    : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                }`}
              >
                <Star size={16} className={isStarred ? "fill-warning" : ""} />
                {isStarred ? "Starred" : "Star"}
              </button>

              <button
                onClick={handleFork}
                disabled={forkMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-accent text-bg-primary hover:bg-accent-hover transition-colors"
              >
                <GitFork size={16} />
                Fork
              </button>
            </div>
          </div>

          {/* Description */}
          {snippet.description && (
            <p className="text-text-secondary mb-4">{snippet.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Author */}
            {snippet.user && (
              <Link
                to="/u/$username"
                params={{ username: snippet.user.username }}
                className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
              >
                {snippet.user.image ? (
                  <img
                    src={snippet.user.image}
                    alt={snippet.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <User size={14} className="text-accent" />
                  </div>
                )}
                <span>@{snippet.user.username}</span>
              </Link>
            )}

            {/* Date */}
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <Calendar size={14} />
              {formatDate(snippet.createdAt)}
            </span>

            {/* Tags */}
            {snippet.tags?.length > 0 && (
              <div className="flex items-center gap-2">
                {snippet.tags.map((tag: { id: string; name: string; color: string | null }) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${tag.color || "#6b7280"}20`,
                      color: tag.color || "#6b7280",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Files */}
        {snippet.files?.map((file: { id: string; filename: string; content: string; language: string }) => (
          <div key={file.id} className="terminal-block rounded-lg mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
              <span className="font-mono text-sm text-text-primary">{file.filename}</span>
              <button
                onClick={() => copyToClipboard(file.content, file.id)}
                className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                {copiedFile === file.id ? (
                  <>
                    <Check size={14} className="text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <CodeEditor
              value={file.content}
              language={file.language}
              onChange={() => {}}
              readOnly
            />
          </div>
        ))}

        {/* Instructions */}
        {snippet.instructions && (
          <div className="terminal-block rounded-lg p-6 mb-6">
            <h2 className="font-display font-bold mb-4">Instructions</h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-text-secondary">{snippet.instructions}</pre>
            </div>
          </div>
        )}

        {/* Variables */}
        {snippet.variables?.length > 0 && (
          <div className="terminal-block rounded-lg p-6 mb-6">
            <h2 className="font-display font-bold mb-4">Variables</h2>
            <div className="space-y-3">
              {snippet.variables.map((variable: { id: string; name: string; defaultValue: string; description?: string }) => (
                <div key={variable.id} className="flex items-start gap-4">
                  <code className="text-accent font-mono text-sm bg-bg-code px-2 py-1 rounded">
                    {`{{${variable.name}}}`}
                  </code>
                  <div className="flex-1">
                    <div className="text-text-secondary text-sm">{variable.description}</div>
                    <div className="text-text-tertiary text-xs mt-1">
                      Default: {variable.defaultValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {!isLoggedIn && (
          <div className="terminal-block rounded-lg p-8 text-center">
            <h2 className="font-display text-xl font-bold mb-2">
              Want to save your own snippets?
            </h2>
            <p className="text-text-secondary mb-6">
              Create an account to star, fork, and create your own code snippets.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors"
            >
              Sign Up Free
              <ExternalLink size={16} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
