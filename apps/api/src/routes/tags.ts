import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { tags, snippetsTags, type Database } from "@snippetvault/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuthMiddleware } from "../middleware/auth";
import { createTagSchema, updateTagSchema } from "../lib/validators";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createTagsRoute(db: Database) {
  return (
    new Hono<{ Variables: AuthVariables }>()
      // Apply auth middleware to all routes
      .use("*", createAuthMiddleware(db))

      // GET /api/tags - List user's tags
      .get("/", async (c) => {
        const userId = c.get("userId");

        const userTags = await db
          .select()
          .from(tags)
          .where(eq(tags.userId, userId))
          .orderBy(tags.name);

        // Get snippet count for each tag
        const tagsWithCount = await Promise.all(
          userTags.map(async (tag) => {
            const snippetCount = await db
              .select({ snippetId: snippetsTags.snippetId })
              .from(snippetsTags)
              .where(eq(snippetsTags.tagId, tag.id));

            return {
              ...tag,
              snippetCount: snippetCount.length,
            };
          })
        );

        return c.json({ tags: tagsWithCount });
      })

      // GET /api/tags/:id - Get tag details
      .get("/:id", async (c) => {
        const userId = c.get("userId");
        const tagId = c.req.param("id");

        const tag = await db.query.tags.findFirst({
          where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
        });

        if (!tag) {
          return c.json({ error: "Tag not found" }, 404);
        }

        // Get snippet count
        const snippetCount = await db
          .select({ snippetId: snippetsTags.snippetId })
          .from(snippetsTags)
          .where(eq(snippetsTags.tagId, tagId));

        return c.json({
          tag: {
            ...tag,
            snippetCount: snippetCount.length,
          },
        });
      })

      // POST /api/tags - Create tag
      .post("/", zValidator("json", createTagSchema), async (c) => {
        const userId = c.get("userId");
        const data = c.req.valid("json");

        // Check if tag with same name already exists for user
        const existingTag = await db.query.tags.findFirst({
          where: and(eq(tags.userId, userId), eq(tags.name, data.name)),
        });

        if (existingTag) {
          return c.json({ error: "Tag with this name already exists" }, 400);
        }

        // Create tag
        const [newTag] = await db
          .insert(tags)
          .values({
            id: nanoid(),
            userId,
            name: data.name,
            color: data.color,
          })
          .returning();

        return c.json({ tag: { ...newTag, snippetCount: 0 } }, 201);
      })

      // PUT /api/tags/:id - Update tag
      .put("/:id", zValidator("json", updateTagSchema), async (c) => {
        const userId = c.get("userId");
        const tagId = c.req.param("id");
        const data = c.req.valid("json");

        // Check ownership
        const existingTag = await db.query.tags.findFirst({
          where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
        });

        if (!existingTag) {
          return c.json({ error: "Tag not found" }, 404);
        }

        // Check if new name conflicts with existing tag
        if (data.name && data.name !== existingTag.name) {
          const conflictingTag = await db.query.tags.findFirst({
            where: and(eq(tags.userId, userId), eq(tags.name, data.name)),
          });

          if (conflictingTag) {
            return c.json({ error: "Tag with this name already exists" }, 400);
          }
        }

        // Update tag
        const [updatedTag] = await db
          .update(tags)
          .set({
            ...(data.name && { name: data.name }),
            ...(data.color !== undefined && { color: data.color }),
          })
          .where(eq(tags.id, tagId))
          .returning();

        // Get snippet count
        const snippetCount = await db
          .select({ snippetId: snippetsTags.snippetId })
          .from(snippetsTags)
          .where(eq(snippetsTags.tagId, tagId));

        return c.json({
          tag: {
            ...updatedTag,
            snippetCount: snippetCount.length,
          },
        });
      })

      // DELETE /api/tags/:id - Delete tag
      .delete("/:id", async (c) => {
        const userId = c.get("userId");
        const tagId = c.req.param("id");

        // Check ownership
        const existingTag = await db.query.tags.findFirst({
          where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
        });

        if (!existingTag) {
          return c.json({ error: "Tag not found" }, 404);
        }

        // Delete tag (snippet associations will cascade)
        await db.delete(tags).where(eq(tags.id, tagId));

        return c.json({ message: "Tag deleted successfully" });
      })
  );
}
