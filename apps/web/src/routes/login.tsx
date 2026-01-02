import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || '/dashboard',
  }),
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard', search: { filter: undefined, tag: undefined } })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            // Use window.location to force a full page reload
            // This ensures the session state is fresh before navigation
            window.location.href = redirect
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Failed to sign in')
          },
        }
      )
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6 dot-grid">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl flex items-center justify-center gap-1 mb-12">
          <span className="text-accent">{`>`}</span>
          <span>SnippetVault</span>
          <span className="animate-blink">_</span>
        </Link>

        {/* Login Form */}
        <div className="terminal-block rounded-lg p-8 glow-green-sm">
          <h1 className="font-display text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-secondary mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-text-secondary mb-2 font-display">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-text-secondary mb-2 font-display">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-bg-primary py-3 font-display font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-text-secondary">Don't have an account? </span>
            <Link to="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
