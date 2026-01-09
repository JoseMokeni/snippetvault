import { createFileRoute } from "@tanstack/react-router";
import { Settings, User, AtSign, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, handleApiError } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [usernameError, setUsernameError] = useState("");
  // Track if user has started editing (to avoid resetting their changes)
  const [editedUsername, setEditedUsername] = useState<string | null>(null);

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  // Use edited value if user has typed, otherwise use fetched value
  const currentUsername = userData?.user?.username ?? "";
  const username = editedUsername ?? currentUsername;
  const setUsername = (value: string) => setEditedUsername(value);

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const res = await fetch("/api/users/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update username");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      showSuccess("Username updated successfully");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update username");
    },
  });

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 20) {
      return "Username must be at most 20 characters";
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      return "Username can only contain lowercase letters, numbers, and underscores";
    }
    return "";
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleSaveUsername = () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }
    if (username === userData?.user?.username) {
      return; // No change
    }
    updateUsernameMutation.mutate(username);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  const user = userData?.user;
  const hasUsernameChanged = username !== user?.username;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold flex items-center gap-3">
          <Settings className="text-accent" />
          Settings
        </h1>
        <p className="text-text-secondary mt-1">Manage your account settings</p>
      </div>

      {/* Profile Section */}
      <div className="terminal-block rounded-lg p-6 mb-6">
        <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
          <User size={20} />
          Profile
        </h2>

        {/* User Info */}
        <div className="space-y-4">
          {/* Name (read-only) */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Name</label>
            <div className="bg-bg-primary border border-border px-4 py-3 text-text-primary font-display">
              {user?.name}
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Email</label>
            <div className="bg-bg-primary border border-border px-4 py-3 text-text-primary font-display">
              {user?.email}
            </div>
          </div>

          {/* Username (editable) */}
          <div>
            <label className="block text-sm text-text-secondary mb-2 flex items-center gap-2">
              <AtSign size={14} />
              Username
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="username"
                  className={`w-full bg-bg-primary border px-4 py-3 pl-8 text-text-primary font-display focus:outline-none ${
                    usernameError
                      ? "border-error focus:border-error"
                      : "border-border focus:border-accent"
                  }`}
                />
              </div>
              <button
                onClick={handleSaveUsername}
                disabled={!hasUsernameChanged || !!usernameError || updateUsernameMutation.isPending}
                className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                  hasUsernameChanged && !usernameError
                    ? "bg-accent text-bg-primary hover:bg-accent-hover"
                    : "bg-bg-elevated text-text-tertiary cursor-not-allowed"
                }`}
              >
                {updateUsernameMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Save
              </button>
            </div>
            {usernameError && (
              <p className="text-error text-sm mt-2">{usernameError}</p>
            )}
            <p className="text-text-tertiary text-xs mt-2">
              Your profile URL: snippetvault.app/u/{username || "username"}
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="terminal-block rounded-lg p-6">
        <h2 className="font-display font-bold text-lg mb-4">Account</h2>
        <div className="text-text-secondary text-sm">
          <p>
            Member since{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
