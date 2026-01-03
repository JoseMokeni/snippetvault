import { Hono } from "hono";
import { snippets, type Database } from "@snippetvault/db";
import { eq, and } from "drizzle-orm";

/**
 * Public routes - no authentication required
 * Used for accessing public snippets via share links
 */
export function createPublicRoute(db: Database) {
  return new Hono()
    // GET /api/public/snippets/:slug - Get public snippet by slug
    .get("/snippets/:slug", async (c) => {
      const slug = c.req.param("slug");

      // Find public snippet by slug
      const snippet = await db.query.snippets.findFirst({
        where: and(
          eq(snippets.slug, slug),
          eq(snippets.isPublic, true)
        ),
        with: {
          files: {
            orderBy: (files, { asc }) => [asc(files.order)],
          },
          variables: {
            orderBy: (variables, { asc }) => [asc(variables.order)],
          },
          snippetsTags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!snippet) {
        return c.json({ error: "Snippet not found" }, 404);
      }

      // Transform tags from snippetsTags relation
      const transformedSnippet = {
        ...snippet,
        tags: snippet.snippetsTags.map((st) => st.tag),
        snippetsTags: undefined,
        // Remove sensitive user information
        userId: undefined,
      };

      return c.json({ snippet: transformedSnippet });
    });
}
