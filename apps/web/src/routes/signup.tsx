import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Github } from "lucide-react";

export const Route = createFileRoute("/signup")({
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/dashboard",
        search: {
          filter: undefined,
          tag: undefined,
          sortBy: undefined,
          sortOrder: undefined,
          language: undefined,
        },
      });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      await authClient.signUp.email(
        { name, email, password },
        {
          onSuccess: () => {
            // Use window.location to force a full page reload
            // This ensures the session state is fresh before navigation
            window.location.href = "/dashboard";
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to create account");
          },
        }
      );
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6 dot-grid">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-2xl flex items-center justify-center gap-1 mb-12"
        >
          <span className="text-accent">{`>`}</span>
          <span>SnippetVault</span>
          <span className="animate-blink">_</span>
        </Link>

        {/* Signup Form */}
        <div className="terminal-block rounded-lg p-8 glow-green-sm">
          <h1 className="font-display text-2xl font-bold mb-2">
            Create your account
          </h1>
          <p className="text-text-secondary mb-8">
            Start building your snippet library
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* GitHub OAuth Button */}
            <button
              type="button"
              onClick={() =>
                authClient.signIn.social({
                  provider: "github",
                  callbackURL: "/dashboard",
                })
              }
              className="w-full bg-bg-secondary border-2 border-border text-text-primary py-3 font-display font-medium hover:border-accent transition-colors flex items-center justify-center gap-2"
            >
              <Github size={18} />
              Continue with GitHub
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-primary px-2 text-text-tertiary">
                  OR
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm text-text-secondary mb-2 font-display"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm text-text-secondary mb-2 font-display"
              >
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
              <label
                htmlFor="password"
                className="block text-sm text-text-secondary mb-2 font-display"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
                placeholder="••••••••"
              />
              <p className="text-text-tertiary text-xs mt-2">
                Minimum 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-bg-primary py-3 font-display font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-text-secondary">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              search={{ redirect: "/dashboard" }}
              className="text-accent hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
