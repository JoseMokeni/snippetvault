import { createFileRoute, redirect, Outlet, Link } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Folder, LogOut, Plus, Settings, Star, Tag } from 'lucide-react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    // Check if user is authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { auth } = Route.useRouteContext()

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-bg-secondary flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="font-display text-lg flex items-center gap-1">
            <span className="text-accent">{`>`}</span>
            <span>SnippetVault</span>
            <span className="animate-blink">_</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
            activeProps={{ className: 'bg-bg-elevated text-text-primary' }}
          >
            <Folder size={18} />
            <span>All Snippets</span>
          </Link>
          <Link
            to="/dashboard"
            search={{ filter: 'favorites' }}
            className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
          >
            <Star size={18} />
            <span>Favorites</span>
          </Link>
          <Link
            to="/dashboard"
            search={{ filter: 'tags' }}
            className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
          >
            <Tag size={18} />
            <span>Tags</span>
          </Link>
        </nav>

        {/* New Snippet Button */}
        <div className="p-4 border-t border-border">
          <Link
            to="/dashboard/new"
            className="flex items-center justify-center gap-2 w-full bg-accent text-bg-primary py-2 font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus size={18} />
            <span>New Snippet</span>
          </Link>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display font-bold">
              {auth.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{auth.user?.name}</div>
              <div className="text-xs text-text-tertiary truncate">{auth.user?.email}</div>
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
  )
}
