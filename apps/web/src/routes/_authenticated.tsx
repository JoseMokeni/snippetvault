import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import {
  Folder,
  LogOut,
  Plus,
  Settings,
  Star,
  Tag,
  Menu,
  X,
  Globe,
  PanelLeftClose,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    // Check if user is authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { auth } = Route.useRouteContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Persist collapsed state in localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Fetch tags for sidebar
  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.tags.$get();
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  const tags = tagsData?.tags || [];

  return (
    <div className="h-screen bg-bg-primary flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary border-b border-border flex items-center justify-between px-4">
        <Link to="/" className="font-display text-base flex items-center gap-1">
          <span className="text-accent">{`>`}</span>
          <span>SnippetVault</span>
          <span className="animate-blink">_</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        onClick={() => {
          // Only expand on click when collapsed (desktop only)
          if (sidebarCollapsed && window.innerWidth >= 1024) {
            setSidebarCollapsed(false);
          }
        }}
        className={`border-r border-border bg-bg-secondary flex flex-col flex-shrink-0 h-full fixed lg:static inset-0 z-40 transition-all duration-200 lg:translate-x-0 pt-16 lg:pt-0 ${
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-16 lg:cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSA2TDE1IDEyTDkgMTgiIHN0cm9rZT0iIzIyZDNlZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4='),_e-resize]" : "lg:w-64"}`}
      >
        {/* Logo with integrated collapse toggle */}
        <div className="p-4 border-b border-border flex-shrink-0 hidden lg:flex items-center justify-between group">
          {sidebarCollapsed ? (
            /* Collapsed: > becomes >> on hover to indicate expand */
            <button
              onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(false); }}
              className="w-full flex items-center justify-center font-display text-lg text-accent hover:text-accent-hover transition-all duration-200 group/expand cursor-pointer"
              title="Expand sidebar"
            >
              <span className="group-hover/expand:hidden">{`>`}</span>
              <span className="hidden group-hover/expand:inline">{`>>`}</span>
            </button>
          ) : (
            /* Expanded: logo + collapse button on hover */
            <>
              <Link
                to="/"
                className="font-display text-lg flex items-center gap-1"
              >
                <span className="text-accent">{`>`}</span>
                <span>SnippetVault</span>
                <span className="animate-blink">_</span>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarCollapsed(true);
                }}
                className="p-1.5 text-text-tertiary hover:text-accent hover:bg-bg-elevated rounded transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto min-h-0">
          <Link
            to="/dashboard"
            search={{ filter: undefined, tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
            className={`flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors [&.active]:bg-bg-elevated [&.active]:text-text-primary ${sidebarCollapsed ? "justify-center cursor-pointer" : ""}`}
            activeOptions={{ exact: true }}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
            title={sidebarCollapsed ? "All Snippets" : undefined}
          >
            <Folder size={18} />
            {!sidebarCollapsed && <span>All Snippets</span>}
          </Link>
          <Link
            to="/dashboard"
            search={{ filter: "favorites", tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
            className={`flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors ${sidebarCollapsed ? "justify-center cursor-pointer" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
            title={sidebarCollapsed ? "Favorites" : undefined}
          >
            <Star size={18} />
            {!sidebarCollapsed && <span>Favorites</span>}
          </Link>
          <Link
            to="/dashboard"
            search={{ filter: "public", tag: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
            className={`flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors ${sidebarCollapsed ? "justify-center cursor-pointer" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
            title={sidebarCollapsed ? "Public" : undefined}
          >
            <Globe size={18} />
            {!sidebarCollapsed && <span>Public</span>}
          </Link>

          {/* Tags Section */}
          {tags.length > 0 && !sidebarCollapsed && (
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 mb-2 text-xs text-text-tertiary uppercase tracking-wider font-display">
                <Tag size={12} />
                <span>Tags</span>
              </div>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to="/dashboard"
                  search={{ tag: tag.name, filter: undefined, sortBy: undefined, sortOrder: undefined, language: undefined }}
                  className="flex items-center justify-between px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color || "#6b7280" }}
                    />
                    <span>{tag.name}</span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {tag.snippetCount}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Tags Section - Collapsed: show tag icon with count */}
          {tags.length > 0 && sidebarCollapsed && (
            <div className="pt-4 mt-4 border-t border-border flex justify-center">
              <div
                className="p-2 text-text-tertiary cursor-default"
                title={`${tags.length} tags`}
                onClick={(e) => e.stopPropagation()}
              >
                <Tag size={18} />
              </div>
            </div>
          )}
        </nav>

        {/* New Snippet Button */}
        <div className="p-2 border-t border-border flex-shrink-0">
          <Link
            to="/dashboard/new"
            className={`flex items-center justify-center gap-2 w-full bg-accent text-bg-primary py-2 font-medium hover:bg-accent-hover transition-colors ${sidebarCollapsed ? "px-2 cursor-pointer" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
            title={sidebarCollapsed ? "New Snippet" : undefined}
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span>New Snippet</span>}
          </Link>
        </div>

        {/* User Menu */}
        <div className="p-2 border-t border-border flex-shrink-0">
          {sidebarCollapsed ? (
            /* Collapsed user menu - just avatar and icons */
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display font-bold cursor-default"
                title={auth.user?.name || "User"}
                onClick={(e) => e.stopPropagation()}
              >
                {auth.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <button
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors cursor-pointer"
                title="Settings"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* Expanded user menu */
            <>
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display font-bold">
                  {auth.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {auth.user?.name}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {auth.user?.email}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors text-sm">
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors text-sm"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
