import { X } from "lucide-react";

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
}

export function TagSelector({
  availableTags,
  selectedTagIds,
  onChange,
}: TagSelectorProps) {
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

      {availableTags.length === 0 && (
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
