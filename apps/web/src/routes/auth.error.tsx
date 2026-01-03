import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/error")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: (search.error as string) || "unknown_error",
    redirect: (search.redirect as string) || "/login",
  }),
  component: AuthErrorPage,
});

function AuthErrorPage() {
  const { error, redirect } = Route.useSearch();

  const errorMessages: Record<string, { title: string; message: string }> = {
    account_not_linked: {
      title: "Account Already Exists",
      message:
        "An account with this email already exists using a different sign-in method. Please sign in using your original method.",
    },
    account_already_linked: {
      title: "Account Already Linked",
      message:
        "This account is already linked to your profile. Try signing in with a different provider.",
    },
    oauth_failed: {
      title: "Authentication Failed",
      message:
        "We couldn't complete the authentication process. Please try again.",
    },
    unknown_error: {
      title: "Something Went Wrong",
      message: "An unexpected error occurred. Please try signing in again.",
    },
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown_error;

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

        {/* Error Card */}
        <div className="terminal-block rounded-lg p-8 border-error/50">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-error/10 border-2 border-error mb-4">
              <span className="text-error text-4xl">!</span>
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-text-secondary">{errorInfo.message}</p>
          </div>

          <div className="space-y-3">
            <Link
              to={redirect}
              className="w-full bg-accent text-bg-primary py-3 font-display font-medium hover:bg-accent-hover transition-colors flex items-center justify-center"
            >
              Try Again
            </Link>
            <Link
              to="/"
              className="w-full bg-bg-secondary border-2 border-border text-text-primary py-3 font-display font-medium hover:border-accent transition-colors flex items-center justify-center"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
