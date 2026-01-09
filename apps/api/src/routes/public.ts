import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { snippets, users, tags, snippetsTags, type Database } from "@snippetvault/db";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";
import { exploreQuerySchema, userSearchSchema } from "../lib/validators";

/**
 * Public routes - no authentication required
 * Used for explore page, public snippets, and user profiles
 */
export function createPublicRoute(db: Database) {
  return new Hono()
    // GET /api/public/explore - Browse public snippets
    .get("/explore", zValidator("query", exploreQuerySchema), async (c) => {
      const query = c.req.valid("query");

      const conditions = [eq(snippets.isPublic, true)];

      // Filter by language
      if (query.language) {
        conditions.push(eq(snippets.language, query.language));
      }

      // Search by title or description
      if (query.search) {
        const searchPattern = `%${query.search.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${snippets.title}) LIKE ${searchPattern}`,
            sql`LOWER(${snippets.description}) LIKE ${searchPattern}`
          )!
        );
      }

      // Build order by clause
      const orderByColumn =
        query.sortBy === "createdAt"
          ? snippets.createdAt
          : query.sortBy === "forkCount"
          ? snippets.forkCount
          : snippets.starCount;
      const orderFn = query.sortOrder === "asc" ? asc : desc;

      // Fetch public snippets
      let publicSnippets = await db
        .select()
        .from(snippets)
        .where(and(...conditions))
        .orderBy(orderFn(orderByColumn))
        .limit(query.limit)
        .offset(query.offset);

      // If filtering by tag, we need additional logic
      if (query.tag) {
        const snippetsWithTag = await db
          .select({ snippetId: snippetsTags.snippetId })
          .from(snippetsTags)
          .innerJoin(tags, eq(tags.id, snippetsTags.tagId))
          .where(eq(tags.name, query.tag));

        const tagSnippetIds = snippetsWithTag.map((s) => s.snippetId);
        publicSnippets = publicSnippets.filter((s) =>
          tagSnippetIds.includes(s.id)
        );
      }

      // Get tags and user info for each snippet
      const snippetsWithDetails = await Promise.all(
        publicSnippets.map(async (snippet) => {
          const [snippetTags, user] = await Promise.all([
            db
              .select({ tag: tags })
              .from(snippetsTags)
              .innerJoin(tags, eq(tags.id, snippetsTags.tagId))
              .where(eq(snippetsTags.snippetId, snippet.id)),
            db.query.users.findFirst({
              where: eq(users.id, snippet.userId),
              columns: { id: true, name: true, username: true, image: true },
            }),
          ]);

          return {
            ...snippet,
            tags: snippetTags.map((st) => st.tag),
            user: user ? { name: user.name, username: user.username, image: user.image } : null,
            userId: undefined,
          };
        })
      );

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(snippets)
        .where(and(...conditions));

      // Get available languages for filtering
      const languagesResult = await db
        .selectDistinct({ language: snippets.language })
        .from(snippets)
        .where(eq(snippets.isPublic, true));

      return c.json({
        snippets: snippetsWithDetails,
        total: Number(count),
        languages: languagesResult.map((l) => l.language),
      });
    })

    // GET /api/public/snippets/:slug - Get public snippet by slug
    .get("/snippets/:slug", async (c) => {
      const slug = c.req.param("slug");

      // Find public snippet by slug
      const snippet = await db.query.snippets.findFirst({
        where: and(eq(snippets.slug, slug), eq(snippets.isPublic, true)),
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
          user: {
            columns: { id: true, name: true, username: true, image: true },
          },
          forkedFrom: {
            columns: { id: true, title: true, slug: true },
            with: {
              user: {
                columns: { username: true },
              },
            },
          },
        },
      });

      if (!snippet) {
        return c.json({ error: "Snippet not found" }, 404);
      }

      // Transform the response
      const transformedSnippet = {
        ...snippet,
        tags: snippet.snippetsTags.map((st) => st.tag),
        snippetsTags: undefined,
        user: snippet.user
          ? { name: snippet.user.name, username: snippet.user.username, image: snippet.user.image }
          : null,
        userId: undefined,
      };

      return c.json({ snippet: transformedSnippet });
    })

    // GET /api/public/users/search - Search for users by username or name
    .get("/users/search", zValidator("query", userSearchSchema), async (c) => {
      const { q, limit } = c.req.valid("query");
      const searchPattern = `%${q.toLowerCase()}%`;

      // Search users by username or name
      const matchingUsers = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        })
        .from(users)
        .where(
          or(
            sql`LOWER(${users.username}) LIKE ${searchPattern}`,
            sql`LOWER(${users.name}) LIKE ${searchPattern}`
          )
        )
        .limit(limit);

      // Get public snippet count for each user
      const usersWithStats = await Promise.all(
        matchingUsers.map(async (user) => {
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(snippets)
            .where(and(eq(snippets.userId, user.id), eq(snippets.isPublic, true)));

          return {
            ...user,
            publicSnippets: Number(count),
          };
        })
      );

      return c.json({ users: usersWithStats });
    })

    // GET /api/public/users/:username - Get user profile and public snippets
    .get("/users/:username", async (c) => {
      const username = c.req.param("username");

      // Find user by username
      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
        columns: { id: true, name: true, username: true, image: true, createdAt: true },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Get user's public snippets
      const userSnippets = await db
        .select()
        .from(snippets)
        .where(and(eq(snippets.userId, user.id), eq(snippets.isPublic, true)))
        .orderBy(desc(snippets.starCount));

      // Get tags for each snippet
      const snippetsWithTags = await Promise.all(
        userSnippets.map(async (snippet) => {
          const snippetTags = await db
            .select({ tag: tags })
            .from(snippetsTags)
            .innerJoin(tags, eq(tags.id, snippetsTags.tagId))
            .where(eq(snippetsTags.snippetId, snippet.id));

          return {
            ...snippet,
            tags: snippetTags.map((st) => st.tag),
            userId: undefined,
          };
        })
      );

      // Calculate stats
      const totalStars = userSnippets.reduce((sum, s) => sum + s.starCount, 0);
      const totalForks = userSnippets.reduce((sum, s) => sum + s.forkCount, 0);

      return c.json({
        user: {
          name: user.name,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        },
        snippets: snippetsWithTags,
        stats: {
          publicSnippets: userSnippets.length,
          totalStars,
          totalForks,
        },
      });
    });
}
