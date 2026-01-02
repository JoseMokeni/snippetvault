import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { Folder, LogOut, Plus, Settings, Star, Tag } from "lucide-react";

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
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-bg-secondary flex flex-col flex-shrink-0 h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <Link to="/" className="font-display text-lg flex items-center gap-1">
            <span className="text-accent">{`>`}</span>
            <span>SnippetVault</span>
            <span className="animate-blink">_</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          <Link
            to="/dashboard"
            search={{ filter: undefined, tag: undefined }}
            className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors [&.active]:bg-bg-elevated [&.active]:text-text-primary"
            activeOptions={{ exact: true }}
          >
            <Folder size={18} />
            <span>All Snippets</span>
          </Link>
          <Link
            to="/dashboard"
            search={{ filter: "favorites", tag: undefined }}
            className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
          >
            <Star size={18} />
            <span>Favorites</span>
          </Link>

          {/* Tags Section */}
          {tags.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 mb-2 text-xs text-text-tertiary uppercase tracking-wider font-display">
                <Tag size={12} />
                <span>Tags</span>
              </div>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to="/dashboard"
                  search={{ tag: tag.id, filter: undefined }}
                  className="flex items-center justify-between px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors text-sm"
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
        </nav>

        {/* New Snippet Button */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <Link
            to="/dashboard/new"
            className="flex items-center justify-center gap-2 w-full bg-accent text-bg-primary py-2 font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus size={18} />
            <span>New Snippet</span>
          </Link>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
