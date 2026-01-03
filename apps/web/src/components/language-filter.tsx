import { Code2, Check } from "lucide-react";
import { Link, useSearch } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

interface LanguageFilterProps {
  snippets: Array<{ language: string }>;
}

export function LanguageFilter({ snippets }: LanguageFilterProps) {
  const search = useSearch({ from: "/_authenticated/dashboard/" });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = search.language;

  // Get unique languages from snippets with counts
  const languageCounts = snippets.reduce((acc, snippet) => {
    const lang = snippet.language;
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languages = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count); // Sort by count, most used first

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If no languages, don't render
  if (languages.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-bg-secondary border border-border px-3 py-2.5 sm:py-3 text-sm sm:text-base text-text-primary hover:border-text-tertiary transition-colors font-display whitespace-nowrap"
      >
        <Code2 size={16} />
        <span className="hidden sm:inline">
          {currentLanguage || "All Languages"}
        </span>
        <span className="sm:hidden">Lang</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-bg-secondary border border-border shadow-lg z-10 max-h-96 overflow-y-auto">
          {/* All Languages option */}
          <Link
            to="/dashboard"
            search={{
              ...search,
              language: undefined,
            }}
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              !currentLanguage
                ? "bg-accent text-bg-primary"
                : "text-text-primary hover:bg-bg-primary"
            }`}
          >
            <span>All Languages</span>
            {!currentLanguage && <Check size={16} />}
          </Link>

          {/* Individual languages */}
          {languages.map(({ language, count }) => (
            <Link
              key={language}
              to="/dashboard"
              search={{
                ...search,
                language,
              }}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                currentLanguage === language
                  ? "bg-accent text-bg-primary"
                  : "text-text-primary hover:bg-bg-primary"
              }`}
            >
              <span className="capitalize">{language}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">{count}</span>
                {currentLanguage === language && <Check size={16} />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
