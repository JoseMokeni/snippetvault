import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  snippets,
  files,
  variables,
  tags,
  snippetsTags,
  type Database,
} from "@snippetvault/db";
import { eq, and, desc, asc, like, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuthMiddleware } from "../middleware/auth";
import {
  createSnippetSchema,
  updateSnippetSchema,
  snippetQuerySchema,
} from "../lib/validators";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createSnippetsRoute(db: Database) {
  return (
    new Hono<{ Variables: AuthVariables }>()
      // Apply auth middleware to all routes
      .use("*", createAuthMiddleware(db))

      // GET /api/snippets - List user's snippets with filters
      .get("/", zValidator("query", snippetQuerySchema), async (c) => {
        const userId = c.get("userId");
        const query = c.req.valid("query");

        const conditions = [eq(snippets.userId, userId)];

        // Filter by language
        if (query.language) {
          conditions.push(eq(snippets.language, query.language));
        }

        // Filter by favorite
        if (query.favorite) {
          conditions.push(eq(snippets.isFavorite, true));
        }

        // Search by title or description
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          conditions.push(
            or(
              like(snippets.title, searchPattern),
              like(snippets.description, searchPattern)
            )!
          );
        }

        // Build order by clause
        const orderByColumn =
          query.sortBy === "title"
            ? snippets.title
            : query.sortBy === "createdAt"
            ? snippets.createdAt
            : snippets.updatedAt;
        const orderFn = query.sortOrder === "asc" ? asc : desc;

        // Fetch snippets
        const userSnippets = await db
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
            .where(and(eq(tags.name, query.tag), eq(tags.userId, userId)));

          const tagSnippetIds = snippetsWithTag.map((s) => s.snippetId);
          const filteredSnippets = userSnippets.filter((s) =>
            tagSnippetIds.includes(s.id)
          );

          // Get tags for filtered snippets
          const snippetsWithTags = await Promise.all(
            filteredSnippets.map(async (snippet) => {
              const snippetTags = await db
                .select({ tag: tags })
                .from(snippetsTags)
                .innerJoin(tags, eq(tags.id, snippetsTags.tagId))
                .where(eq(snippetsTags.snippetId, snippet.id));

              return {
                ...snippet,
                tags: snippetTags.map((st) => st.tag),
              };
            })
          );

          return c.json({ snippets: snippetsWithTags });
        }

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
            };
          })
        );

        return c.json({ snippets: snippetsWithTags });
      })

      // GET /api/snippets/:id - Get snippet with files, variables, and tags
      .get("/:id", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("id");

        const snippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
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
        };

        return c.json({ snippet: transformedSnippet });
      })

      // POST /api/snippets - Create snippet
      .post("/", zValidator("json", createSnippetSchema), async (c) => {
        const userId = c.get("userId");
        const data = c.req.valid("json");

        const snippetId = nanoid();

        // Create snippet
        await db.insert(snippets).values({
          id: snippetId,
          userId,
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          language: data.language,
          isPublic: data.isPublic ?? false,
        });

        // Create files if provided
        if (data.files && data.files.length > 0) {
          await db.insert(files).values(
            data.files.map((file, index) => ({
              id: nanoid(),
              snippetId,
              filename: file.filename,
              content: file.content,
              language: file.language,
              order: file.order ?? index,
            }))
          );
        }

        // Create variables if provided
        if (data.variables && data.variables.length > 0) {
          await db.insert(variables).values(
            data.variables.map((variable, index) => ({
              id: nanoid(),
              snippetId,
              name: variable.name,
              defaultValue: variable.defaultValue,
              description: variable.description,
              order: variable.order ?? index,
            }))
          );
        }

        // Associate tags if provided
        if (data.tagIds && data.tagIds.length > 0) {
          // Verify tags belong to user
          const userTags = await db
            .select()
            .from(tags)
            .where(and(inArray(tags.id, data.tagIds), eq(tags.userId, userId)));

          if (userTags.length > 0) {
            await db.insert(snippetsTags).values(
              userTags.map((tag) => ({
                snippetId,
                tagId: tag.id,
              }))
            );
          }
        }

        // Fetch complete snippet with relations
        const completeSnippet = await db.query.snippets.findFirst({
          where: eq(snippets.id, snippetId),
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

        const transformedSnippet = {
          ...completeSnippet,
          tags: completeSnippet?.snippetsTags.map((st) => st.tag) ?? [],
          snippetsTags: undefined,
        };

        return c.json({ snippet: transformedSnippet }, 201);
      })

      // PUT /api/snippets/:id - Update snippet
      .put("/:id", zValidator("json", updateSnippetSchema), async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("id");
        const data = c.req.valid("json");

        // Check ownership
        const existingSnippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
        });

        if (!existingSnippet) {
          return c.json({ error: "Snippet not found" }, 404);
        }

        // Update snippet
        await db
          .update(snippets)
          .set({
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.instructions !== undefined && {
              instructions: data.instructions,
            }),
            ...(data.language && { language: data.language }),
            ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
            ...(data.isFavorite !== undefined && {
              isFavorite: data.isFavorite,
            }),
            updatedAt: new Date(),
          })
          .where(eq(snippets.id, snippetId));

        // Update tags if provided
        if (data.tagIds !== undefined) {
          // Remove existing tag associations
          await db
            .delete(snippetsTags)
            .where(eq(snippetsTags.snippetId, snippetId));

          // Add new tag associations
          if (data.tagIds.length > 0) {
            const userTags = await db
              .select()
              .from(tags)
              .where(
                and(inArray(tags.id, data.tagIds), eq(tags.userId, userId))
              );

            if (userTags.length > 0) {
              await db.insert(snippetsTags).values(
                userTags.map((tag) => ({
                  snippetId,
                  tagId: tag.id,
                }))
              );
            }
          }
        }

        // Fetch complete updated snippet
        const completeSnippet = await db.query.snippets.findFirst({
          where: eq(snippets.id, snippetId),
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

        const transformedSnippet = {
          ...completeSnippet,
          tags: completeSnippet?.snippetsTags.map((st) => st.tag) ?? [],
          snippetsTags: undefined,
        };

        return c.json({ snippet: transformedSnippet });
      })

      // DELETE /api/snippets/:id - Delete snippet
      .delete("/:id", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("id");

        // Check ownership
        const existingSnippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
        });

        if (!existingSnippet) {
          return c.json({ error: "Snippet not found" }, 404);
        }

        // Delete snippet (files, variables, and tags will cascade)
        await db.delete(snippets).where(eq(snippets.id, snippetId));

        return c.json({ message: "Snippet deleted successfully" });
      })

      // PATCH /api/snippets/:id/favorite - Toggle favorite
      .patch("/:id/favorite", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("id");

        // Check ownership
        const existingSnippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
        });

        if (!existingSnippet) {
          return c.json({ error: "Snippet not found" }, 404);
        }

        // Toggle favorite
        const [updatedSnippet] = await db
          .update(snippets)
          .set({
            isFavorite: !existingSnippet.isFavorite,
            updatedAt: new Date(),
          })
          .where(eq(snippets.id, snippetId))
          .returning();

        return c.json({ snippet: updatedSnippet });
      })

      // POST /api/snippets/:id/duplicate - Duplicate snippet
      .post("/:id/duplicate", async (c) => {
        const userId = c.get("userId");
        const snippetId = c.req.param("id");

        // Fetch original snippet with all relations
        const originalSnippet = await db.query.snippets.findFirst({
          where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
          with: {
            files: true,
            variables: true,
            snippetsTags: true,
          },
        });

        if (!originalSnippet) {
          return c.json({ error: "Snippet not found" }, 404);
        }

        const newSnippetId = nanoid();

        // Create new snippet
        await db.insert(snippets).values({
          id: newSnippetId,
          userId,
          title: `${originalSnippet.title} (Copy)`,
          description: originalSnippet.description,
          instructions: originalSnippet.instructions,
          language: originalSnippet.language,
          isPublic: false,
          isFavorite: false,
        });

        // Duplicate files
        if (originalSnippet.files.length > 0) {
          await db.insert(files).values(
            originalSnippet.files.map((file) => ({
              id: nanoid(),
              snippetId: newSnippetId,
              filename: file.filename,
              content: file.content,
              language: file.language,
              order: file.order,
            }))
          );
        }

        // Duplicate variables
        if (originalSnippet.variables.length > 0) {
          await db.insert(variables).values(
            originalSnippet.variables.map((variable) => ({
              id: nanoid(),
              snippetId: newSnippetId,
              name: variable.name,
              defaultValue: variable.defaultValue,
              description: variable.description,
              order: variable.order,
            }))
          );
        }

        // Copy tag associations
        if (originalSnippet.snippetsTags.length > 0) {
          await db.insert(snippetsTags).values(
            originalSnippet.snippetsTags.map((st) => ({
              snippetId: newSnippetId,
              tagId: st.tagId,
            }))
          );
        }

        // Fetch complete new snippet
        const completeSnippet = await db.query.snippets.findFirst({
          where: eq(snippets.id, newSnippetId),
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

        const transformedSnippet = {
          ...completeSnippet,
          tags: completeSnippet?.snippetsTags.map((st) => st.tag) ?? [],
          snippetsTags: undefined,
        };

        return c.json({ snippet: transformedSnippet }, 201);
      })
  );
}
