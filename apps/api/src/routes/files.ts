import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { snippets, files, type Database } from "@snippetvault/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuthMiddleware } from "../middleware/auth";
import {
  createFileSchema,
  updateFileSchema,
  reorderFilesSchema,
} from "../lib/validators";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createFilesRoute(db: Database) {
  return (
    new Hono<{ Variables: AuthVariables }>()
      // Apply auth middleware to all routes
      .use("*", createAuthMiddleware(db))

      // POST /api/snippets/:snippetId/files - Add file to snippet
      .post(
        "/snippets/:snippetId/files",
        zValidator("json", createFileSchema),
        async (c) => {
          const userId = c.get("userId");
          const snippetId = c.req.param("snippetId");
          const data = c.req.valid("json");

          // Verify snippet ownership
          const snippet = await db.query.snippets.findFirst({
            where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
          });

          if (!snippet) {
            return c.json({ error: "Snippet not found" }, 404);
          }

          // Get max order if not provided
          let fileOrder = data.order;
          if (fileOrder === undefined) {
            const existingFiles = await db
              .select({ order: files.order })
              .from(files)
              .where(eq(files.snippetId, snippetId));

            fileOrder =
              existingFiles.length > 0
                ? Math.max(...existingFiles.map((f) => f.order)) + 1
                : 0;
          }

          // Create file
          const [newFile] = await db
            .insert(files)
            .values({
              id: nanoid(),
              snippetId,
              filename: data.filename,
              content: data.content,
              language: data.language,
              order: fileOrder,
            })
            .returning();

          // Update snippet's updatedAt
          await db
            .update(snippets)
            .set({ updatedAt: new Date() })
            .where(eq(snippets.id, snippetId));

          return c.json({ file: newFile }, 201);
        }
      )

      // GET /api/files/:id - Get file details
      .get("/:id", async (c) => {
        const userId = c.get("userId");
        const fileId = c.req.param("id");

        // Get file with snippet for ownership check
        const file = await db.query.files.findFirst({
          where: eq(files.id, fileId),
          with: {
            snippet: true,
          },
        });

        if (!file) {
          return c.json({ error: "File not found" }, 404);
        }

        // Check ownership
        if (file.snippet.userId !== userId) {
          return c.json({ error: "File not found" }, 404);
        }

        // Return file without snippet details
        return c.json({
          file: {
            id: file.id,
            snippetId: file.snippetId,
            filename: file.filename,
            content: file.content,
            language: file.language,
            order: file.order,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
          },
        });
      })

      // PUT /api/files/:id - Update file
      .put("/:id", zValidator("json", updateFileSchema), async (c) => {
        const userId = c.get("userId");
        const fileId = c.req.param("id");
        const data = c.req.valid("json");

        // Get file with snippet for ownership check
        const existingFile = await db.query.files.findFirst({
          where: eq(files.id, fileId),
          with: {
            snippet: true,
          },
        });

        if (!existingFile) {
          return c.json({ error: "File not found" }, 404);
        }

        // Check ownership
        if (existingFile.snippet.userId !== userId) {
          return c.json({ error: "File not found" }, 404);
        }

        // Update file
        const [updatedFile] = await db
          .update(files)
          .set({
            ...(data.filename && { filename: data.filename }),
            ...(data.content !== undefined && { content: data.content }),
            ...(data.language && { language: data.language }),
            ...(data.order !== undefined && { order: data.order }),
            updatedAt: new Date(),
          })
          .where(eq(files.id, fileId))
          .returning();

        // Update snippet's updatedAt
        await db
          .update(snippets)
          .set({ updatedAt: new Date() })
          .where(eq(snippets.id, existingFile.snippetId));

        return c.json({ file: updatedFile });
      })

      // DELETE /api/files/:id - Delete file
      .delete("/:id", async (c) => {
        const userId = c.get("userId");
        const fileId = c.req.param("id");

        // Get file with snippet for ownership check
        const existingFile = await db.query.files.findFirst({
          where: eq(files.id, fileId),
          with: {
            snippet: true,
          },
        });

        if (!existingFile) {
          return c.json({ error: "File not found" }, 404);
        }

        // Check ownership
        if (existingFile.snippet.userId !== userId) {
          return c.json({ error: "File not found" }, 404);
        }

        // Delete file
        await db.delete(files).where(eq(files.id, fileId));

        // Update snippet's updatedAt
        await db
          .update(snippets)
          .set({ updatedAt: new Date() })
          .where(eq(snippets.id, existingFile.snippetId));

        return c.json({ message: "File deleted successfully" });
      })

      // PATCH /api/snippets/:snippetId/files/reorder - Reorder files
      .patch(
        "/snippets/:snippetId/files/reorder",
        zValidator("json", reorderFilesSchema),
        async (c) => {
          const userId = c.get("userId");
          const snippetId = c.req.param("snippetId");
          const data = c.req.valid("json");

          // Verify snippet ownership
          const snippet = await db.query.snippets.findFirst({
            where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
          });

          if (!snippet) {
            return c.json({ error: "Snippet not found" }, 404);
          }

          // Update each file's order based on position in array
          await Promise.all(
            data.fileIds.map((fileId, index) =>
              db
                .update(files)
                .set({ order: index, updatedAt: new Date() })
                .where(
                  and(eq(files.id, fileId), eq(files.snippetId, snippetId))
                )
            )
          );

          // Update snippet's updatedAt
          await db
            .update(snippets)
            .set({ updatedAt: new Date() })
            .where(eq(snippets.id, snippetId));

          // Fetch updated files
          const updatedFiles = await db
            .select()
            .from(files)
            .where(eq(files.snippetId, snippetId))
            .orderBy(files.order);

          return c.json({ files: updatedFiles });
        }
      )
  );
}
