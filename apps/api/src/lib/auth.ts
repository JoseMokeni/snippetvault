import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, users } from "@snippetvault/db";
import * as schema from "@snippetvault/db/schema";
import { eq } from "drizzle-orm";
import { env } from "./env";

/**
 * Generate a unique username from the user's name
 * Format: lowercase_name_xxxx (where xxxx is a random suffix)
 */
function generateUsername(name: string): string {
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 15);

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${baseName || "user"}_${suffix}`;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP: disable email verification
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    },
  },
  account: {
    accountLinking: {
      enabled: false, // Disable account linking - each auth method creates separate account
    },
  },
  onAPIError: {
    errorURL: `${env.BETTER_AUTH_URL}/auth/error`,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false, // false for localhost
      httpOnly: true,
      path: "/",
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        defaultValue: () => generateUsername("user"),
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Generate unique username from user's name
          let username = generateUsername(user.name || "user");

          // Ensure username is unique
          let attempts = 0;
          while (attempts < 10) {
            const existing = await db.query.users.findFirst({
              where: eq(users.username, username),
            });
            if (!existing) break;
            username = generateUsername(user.name || "user");
            attempts++;
          }

          return {
            data: {
              ...user,
              username,
            },
          };
        },
      },
    },
  },
});
