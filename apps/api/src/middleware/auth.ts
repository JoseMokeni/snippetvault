import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import { sessions, type Database } from "@snippetvault/db";
import { eq } from "drizzle-orm";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

/**
 * Create auth middleware with injected database.
 * In tests, we bypass better-auth and validate sessions directly using Bearer tokens.
 * In production, we use better-auth with cookies.
 *
 * @param testDb - Only pass this in test mode to use direct DB session validation
 */
export function createAuthMiddleware(testDb?: Database) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    // Test mode: validate session directly using Bearer token
    // Only activated when testDb is provided AND there's an Authorization header
    const authHeader = c.req.header("Authorization");
    if (testDb && authHeader) {
      const token = authHeader.replace("Bearer ", "");

      if (!token) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const session = await testDb.query.sessions.findFirst({
        where: eq(sessions.token, token),
      });

      if (!session || new Date(session.expiresAt) < new Date()) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      c.set("userId", session.userId);
      c.set("sessionId", session.id);
      await next();
      return;
    }

    // Production mode: use better-auth with cookies
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", session.user.id);
    c.set("sessionId", session.session.id);

    await next();
  });
}

// Default middleware for production (no db injection)
export const authMiddleware = createAuthMiddleware();
