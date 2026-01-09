import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { users, type Database } from "@snippetvault/db";
import { eq } from "drizzle-orm";
import { createAuthMiddleware } from "../middleware/auth";
import { usernameSchema } from "../lib/validators";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createUsersRoute(db: Database) {
  return new Hono<{ Variables: AuthVariables }>()
    // Apply auth middleware to all routes
    .use("*", createAuthMiddleware(db))

    // GET /api/users/me - Get current user profile
    .get("/me", async (c) => {
      const userId = c.get("userId");

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          createdAt: true,
        },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({ user });
    })

    // PATCH /api/users/username - Update username
    .patch("/username", zValidator("json", usernameSchema), async (c) => {
      const userId = c.get("userId");
      const { username } = c.req.valid("json");

      // Check if username is already taken
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser && existingUser.id !== userId) {
        return c.json({ error: "Username is already taken" }, 409);
      }

      // Update username
      const [updatedUser] = await db
        .update(users)
        .set({ username, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          image: users.image,
        });

      return c.json({ user: updatedUser });
    });
}
