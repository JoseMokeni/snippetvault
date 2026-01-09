import { Hono } from "hono";
import {
  snippets,
  stars,
  tags,
  snippetsTags,
  users,
  type Database,
} from "@snippetvault/db";
import { eq, and, desc } from "drizzle-orm";
import { createAuthMiddleware } from "../middleware/auth";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createStarsRoute(db: Database) {
  return (
    new Hono<{ Variables: AuthVariables }>()
      // Apply auth middleware to all routes
      .use("*", createAuthMiddleware(db))

      // GET /api/stars - Get user's starred snippets
      .get("/", async (c) => {
        const userId = c.get("userId");

        // Get all starred snippets for this user
        const userStars = await db
          .select({
            star: stars,
            snippet: snippets,
          })
          .from(stars)
          .innerJoin(snippets, eq(snippets.id, stars.snippetId))
          .where(eq(stars.userId, userId))
          .orderBy(desc(stars.createdAt));

        // Get tags and user info for each snippet
        const starredSnippets = await Promise.all(
          userStars.map(async ({ star, snippet }) => {
            const [snippetTags, user] = await Promise.all([
              db
                .select({ tag: tags })
                .from(snippetsTags)
                .innerJoin(tags, eq(tags.id, snippetsTags.tagId))
                .where(eq(snippetsTags.snippetId, snippet.id)),
              db.query.users.findFirst({
                where: eq(users.id, snippet.userId),
                columns: { name: true, username: true, image: true },
              }),
            ]);

            return {
              ...snippet,
              tags: snippetTags.map((st) => st.tag),
              user,
              starredAt: star.createdAt,
              userId: undefined,
            };
          })
        );

        return c.json({ snippets: starredSnippets });
      })

      // GET /api/stars/check/:snippetId - Check if user starred a snippet
      .get("/check/:snippetId", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("snippetId");

        const star = await db.query.stars.findFirst({
          where: and(eq(stars.userId, userId), eq(stars.snippetId, snippetId)),
        });

        return c.json({ starred: !!star });
      })

      // POST /api/stars/:snippetId - Star a snippet
      .post("/:snippetId", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("snippetId");

        // Check if snippet exists and is public
        const snippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.isPublic, true)),
        });

        if (!snippet) {
          return c.json({ error: "Snippet not found or not public" }, 404);
        }

        // Can't star your own snippet
        if (snippet.userId === userId) {
          return c.json({ error: "Cannot star your own snippet" }, 400);
        }

        // Check if already starred
        const existingStar = await db.query.stars.findFirst({
          where: and(eq(stars.userId, userId), eq(stars.snippetId, snippetId)),
        });

        if (existingStar) {
          return c.json({ error: "Already starred" }, 409);
        }

        // Create star
        await db.insert(stars).values({
          userId,
          snippetId,
        });

        // Increment star count on snippet
        await db
          .update(snippets)
          .set({ starCount: snippet.starCount + 1 })
          .where(eq(snippets.id, snippetId));

        return c.json({ message: "Starred successfully" }, 201);
      })

      // DELETE /api/stars/:snippetId - Unstar a snippet
      .delete("/:snippetId", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("snippetId");

        // Check if star exists
        const existingStar = await db.query.stars.findFirst({
          where: and(eq(stars.userId, userId), eq(stars.snippetId, snippetId)),
        });

        if (!existingStar) {
          return c.json({ error: "Not starred" }, 404);
        }

        // Delete star
        await db
          .delete(stars)
          .where(
            and(eq(stars.userId, userId), eq(stars.snippetId, snippetId))
          );

        // Decrement star count on snippet
        const snippet = await db.query.snippets.findFirst({
          where: eq(snippets.id, snippetId),
        });

        if (snippet && snippet.starCount > 0) {
          await db
            .update(snippets)
            .set({ starCount: snippet.starCount - 1 })
            .where(eq(snippets.id, snippetId));
        }

        return c.json({ message: "Unstarred successfully" });
      })
  );
}
