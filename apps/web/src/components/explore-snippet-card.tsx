import { Link } from "@tanstack/react-router";
import { FileCode, Star, GitFork, User, Clock } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface ExploreSnippetCardProps {
  snippet: {
    id: string;
    title: string;
    description: string | null;
    language: string;
    slug: string | null;
    starCount: number;
    forkCount: number;
    tags: Tag[];
    user: {
      name: string;
      username: string;
      image: string | null;
    } | null;
    createdAt: string;
  };
  isStarred?: boolean;
  onStar?: (id: string) => void;
  onFork?: (id: string) => void;
  showActions?: boolean;
}

export function ExploreSnippetCard({
  snippet,
  isStarred = false,
  onStar,
  onFork,
  showActions = true,
}: ExploreSnippetCardProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="terminal-block rounded-lg overflow-hidden hover:border-accent transition-all group">
      {/* Language header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-accent" />
          <span className="font-display text-xs uppercase tracking-wider text-text-secondary">
            {snippet.language}
          </span>
        </div>
        <div className="flex items-center gap-3 text-text-tertiary">
          <span className="flex items-center gap-1 text-xs font-display">
            <Star size={12} className={isStarred ? "fill-warning text-warning" : ""} />
            {snippet.starCount}
          </span>
          <span className="flex items-center gap-1 text-xs font-display">
            <GitFork size={12} />
            {snippet.forkCount}
          </span>
        </div>
      </div>

      <Link
        to="/explore/$slug"
        params={{ slug: snippet.slug || snippet.id }}
        className="block p-4"
      >
        {/* Title */}
        <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors mb-2 line-clamp-1">
          {snippet.title}
        </h3>

        {/* Description */}
        {snippet.description ? (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            {snippet.description}
          </p>
        ) : (
          <p className="text-text-tertiary text-sm mb-4 italic min-h-[2.5rem]">
            No description provided
          </p>
        )}

        {/* Tags */}
        {snippet.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 font-display"
                style={{
                  backgroundColor: `${tag.color || "#6b7280"}15`,
                  color: tag.color || "#6b7280",
                  border: `1px solid ${tag.color || "#6b7280"}30`,
                }}
              >
                #{tag.name}
              </span>
            ))}
            {snippet.tags.length > 3 && (
              <span className="text-xs text-text-tertiary font-display">
                +{snippet.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer - User and date */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* User */}
          {snippet.user ? (
            <Link
              to="/u/$username"
              params={{ username: snippet.user.username }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
            >
              {snippet.user.image ? (
                <img
                  src={snippet.user.image}
                  alt={snippet.user.name}
                  className="w-6 h-6 rounded-full border border-border"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <User size={12} className="text-accent" />
                </div>
              )}
              <span className="text-xs font-display">@{snippet.user.username}</span>
            </Link>
          ) : (
            <span className="text-xs text-text-tertiary">Anonymous</span>
          )}

          {/* Date */}
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <Clock size={12} />
            <span className="text-xs font-display">{formatDate(snippet.createdAt)}</span>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      {showActions && (onStar || onFork) && (
        <div className="flex items-center gap-2 px-4 pb-4">
          {onStar && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStar(snippet.id);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-display transition-all ${
                isStarred
                  ? "bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20"
                  : "bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent"
              }`}
            >
              <Star size={14} className={isStarred ? "fill-warning" : ""} />
              {isStarred ? "Starred" : "Star"}
            </button>
          )}
          {onFork && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFork(snippet.id);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-display bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent transition-all"
            >
              <GitFork size={14} />
              Fork
            </button>
          )}
        </div>
      )}
    </div>
  );
}
