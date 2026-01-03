import { ArrowUpDown, Calendar, CalendarPlus, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Link, useSearch } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

type SortOption = {
  label: string;
  value: string;
  sortBy: "updatedAt" | "createdAt" | "title";
  sortOrder: "asc" | "desc";
  icon: React.ReactNode;
};

const sortOptions: SortOption[] = [
  {
    label: "Recently Updated",
    value: "updatedAt-desc",
    sortBy: "updatedAt",
    sortOrder: "desc",
    icon: <Calendar size={16} />,
  },
  {
    label: "Recently Created",
    value: "createdAt-desc",
    sortBy: "createdAt",
    sortOrder: "desc",
    icon: <CalendarPlus size={16} />,
  },
  {
    label: "Title (A-Z)",
    value: "title-asc",
    sortBy: "title",
    sortOrder: "asc",
    icon: <ArrowDownAZ size={16} />,
  },
  {
    label: "Title (Z-A)",
    value: "title-desc",
    sortBy: "title",
    sortOrder: "desc",
    icon: <ArrowUpZA size={16} />,
  },
  {
    label: "Oldest Updated",
    value: "updatedAt-asc",
    sortBy: "updatedAt",
    sortOrder: "asc",
    icon: <Calendar size={16} />,
  },
  {
    label: "Oldest Created",
    value: "createdAt-asc",
    sortBy: "createdAt",
    sortOrder: "asc",
    icon: <CalendarPlus size={16} />,
  },
];

export function SortDropdown() {
  const search = useSearch({ from: "/_authenticated/dashboard/" });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current sort value (default to updatedAt-desc)
  const sortBy = search.sortBy || "updatedAt";
  const sortOrder = search.sortOrder || "desc";
  const currentSortValue = `${sortBy}-${sortOrder}`;

  const currentOption = sortOptions.find((opt) => opt.value === currentSortValue) || sortOptions[0];

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-bg-secondary border border-border px-3 py-2.5 sm:py-3 text-sm sm:text-base text-text-primary hover:border-text-tertiary transition-colors font-display whitespace-nowrap"
      >
        <ArrowUpDown size={16} />
        <span className="hidden sm:inline">{currentOption.label}</span>
        <span className="sm:hidden">Sort</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-bg-secondary border border-border shadow-lg z-10">
          {sortOptions.map((option) => (
            <Link
              key={option.value}
              to="/dashboard"
              search={{
                ...search,
                sortBy: option.sortBy,
                sortOrder: option.sortOrder,
              }}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                option.value === currentSortValue
                  ? "bg-accent text-bg-primary"
                  : "text-text-primary hover:bg-bg-primary"
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
