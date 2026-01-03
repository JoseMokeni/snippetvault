import { Link } from "@tanstack/react-router";
import {
  FileCode,
  Folder,
  MoreVertical,
  Star,
  Copy,
  Trash2,
  Globe,
  Share2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { showSuccess } from "@/lib/toast";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface SnippetCardProps {
  snippet: {
    id: string;
    title: string;
    description: string | null;
    language: string;
    isFavorite: boolean;
    isPublic: boolean;
    slug: string | null;
    tags: Tag[];
    createdAt: string;
    updatedAt: string;
  };
  filesCount?: number;
  onToggleFavorite?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SnippetCard({
  snippet,
  filesCount = 0,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: SnippetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`terminal-block rounded-lg p-5 hover:border-accent transition-colors group relative ${snippet.isPublic ? 'border-2 border-accent/30' : ''}`}>
      <Link
        to="/dashboard/$snippetId"
        params={{ snippetId: snippet.id }}
        className="block"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileCode size={18} className="text-accent" />
            <span className="font-display text-xs uppercase tracking-wider text-text-tertiary">
              {snippet.language}
            </span>
            {snippet.isPublic && (
              <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded">
                <Globe size={10} />
                PUBLIC
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-bold group-hover:text-accent transition-colors">
            {snippet.title}
          </h3>
          {snippet.isFavorite && (
            <Star
              size={16}
              className="text-warning fill-warning flex-shrink-0"
            />
          )}
        </div>
        {snippet.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">
            {snippet.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Folder size={14} className="text-text-tertiary" />
              <span className="text-xs text-text-tertiary">
                {filesCount} {filesCount === 1 ? "file" : "files"}
              </span>
            </div>
            <span className="text-xs text-text-tertiary">
              {formatDate(snippet.updatedAt)}
            </span>
          </div>
          <div className="flex gap-1">
            {snippet.tags.slice(0, 2).map((tag) => (
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
            {snippet.tags.length > 2 && (
              <span className="text-xs px-2 py-0.5 rounded bg-bg-elevated text-text-tertiary">
                +{snippet.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action menu */}
      <div className="absolute top-5 right-5" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="text-text-tertiary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 w-40 bg-bg-elevated border border-border rounded shadow-lg">
            {snippet.isPublic && snippet.slug && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = `${window.location.origin}/s/${snippet.slug}`;
                  navigator.clipboard.writeText(url);
                  showSuccess("Public link copied to clipboard");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-accent hover:bg-accent/10 transition-colors border-b border-border"
              >
                <Share2 size={14} />
                Share Link
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(snippet.id);
                setMenuOpen(false);
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDuplicate?.(snippet.id);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(snippet.id);
                setMenuOpen(false);
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
  );
}
