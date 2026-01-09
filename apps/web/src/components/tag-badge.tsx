import { X, Plus } from "lucide-react";
import { useState } from "react";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  snippetCount?: number;
}

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function TagBadge({
  tag,
  onRemove,
  onClick,
  size = "md",
}: TagBadgeProps) {
  const color = tag.color || "#6b7280";
  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-display ${sizeClasses} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      style={{ backgroundColor: `${color}20`, color }}
      onClick={onClick}
    >
      {tag.name}
      {tag.snippetCount !== undefined && (
        <span className="opacity-70">({tag.snippetCount})</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={size === "sm" ? 12 : 14} />
        </button>
      )}
    </span>
  );
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<Tag | null>;
}

// Predefined colors for tags
const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function TagSelector({
  availableTags,
  selectedTagIds,
  onChange,
  onCreateTag,
}: TagSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTags = availableTags.filter((t) =>
    selectedTagIds.includes(t.id)
  );
  const unselectedTags = availableTags.filter(
    (t) => !selectedTagIds.includes(t.id)
  );

  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return;

    setIsSubmitting(true);
    try {
      const newTag = await onCreateTag(newTagName.trim(), newTagColor);
      if (newTag) {
        onChange([...selectedTagIds, newTag.id]);
      }
      setNewTagName("");
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleToggle(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Available tags */}
      {unselectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unselectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.id)}
              className="text-sm px-3 py-1 rounded border border-dashed border-border text-text-tertiary hover:text-text-primary hover:border-text-tertiary transition-colors font-display"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Create new tag */}
      {onCreateTag && !isCreating && (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors font-display"
        >
          <Plus size={14} />
          Create new tag
        </button>
      )}

      {/* New tag form */}
      {isCreating && (
        <div className="p-3 bg-bg-elevated rounded border border-border space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTag();
                }
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewTagName("");
                }
              }}
              placeholder="Tag name"
              className="flex-1 bg-bg-primary border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none text-text-primary rounded"
              autoFocus
              disabled={isSubmitting}
              maxLength={30}
            />
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTagName("");
              }}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    newTagColor === color
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-elevated scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isSubmitting}
              className="px-4 py-1.5 bg-accent text-bg-primary text-sm font-medium rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Tag"}
            </button>
          </div>
        </div>
      )}

      {availableTags.length === 0 && !isCreating && !onCreateTag && (
        <p className="text-sm text-text-tertiary">No tags available</p>
      )}
    </div>
  );
}

interface TagListProps {
  tags: Tag[];
  selectedTagId?: string | null;
  onSelect: (tagId: string | null) => void;
  onEdit?: (tag: Tag) => void;
  onDelete?: (tagId: string) => void;
}

export function TagList({ tags, selectedTagId, onSelect }: TagListProps) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors ${
          !selectedTagId
            ? "bg-bg-elevated text-text-primary"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
        }`}
      >
        <span>All Tags</span>
        <span className="text-text-tertiary">
          {tags.reduce((sum, t) => sum + (t.snippetCount || 0), 0)}
        </span>
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelect(tag.id)}
          className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors ${
            selectedTagId === tag.id
              ? "bg-bg-elevated text-text-primary"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color || "#6b7280" }}
            />
            <span>{tag.name}</span>
          </div>
          {tag.snippetCount !== undefined && (
            <span className="text-text-tertiary">{tag.snippetCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
