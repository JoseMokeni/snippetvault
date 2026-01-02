import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { snippets, variables, type Database } from "@snippetvault/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuthMiddleware } from "../middleware/auth";
import { createVariableSchema, updateVariableSchema } from "../lib/validators";

type AuthVariables = {
  userId: string;
  sessionId: string;
};

export function createVariablesRoute(db: Database) {
  return (
    new Hono<{ Variables: AuthVariables }>()
      // Apply auth middleware to all routes
      .use("*", createAuthMiddleware(db))

      // POST /api/snippets/:snippetId/variables - Add variable to snippet
      .post(
        "/snippets/:snippetId/variables",
        zValidator("json", createVariableSchema),
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
          let variableOrder = data.order;
          if (variableOrder === undefined) {
            const existingVariables = await db
              .select({ order: variables.order })
              .from(variables)
              .where(eq(variables.snippetId, snippetId));

            variableOrder =
              existingVariables.length > 0
                ? Math.max(...existingVariables.map((v) => v.order)) + 1
                : 0;
          }

          // Create variable
          const [newVariable] = await db
            .insert(variables)
            .values({
              id: nanoid(),
              snippetId,
              name: data.name,
              defaultValue: data.defaultValue,
              description: data.description,
              order: variableOrder,
            })
            .returning();

          // Update snippet's updatedAt
          await db
            .update(snippets)
            .set({ updatedAt: new Date() })
            .where(eq(snippets.id, snippetId));

          return c.json({ variable: newVariable }, 201);
        }
      )

      // GET /api/variables/:id - Get variable details
      .get("/:id", async (c) => {
        const userId = c.get("userId");
        const variableId = c.req.param("id");

        // Get variable with snippet for ownership check
        const variable = await db.query.variables.findFirst({
          where: eq(variables.id, variableId),
          with: {
            snippet: true,
          },
        });

        if (!variable) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Check ownership
        if (variable.snippet.userId !== userId) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Return variable without snippet details
        return c.json({
          variable: {
            id: variable.id,
            snippetId: variable.snippetId,
            name: variable.name,
            defaultValue: variable.defaultValue,
            description: variable.description,
            order: variable.order,
            createdAt: variable.createdAt,
            updatedAt: variable.updatedAt,
          },
        });
      })

      // PUT /api/variables/:id - Update variable
      .put("/:id", zValidator("json", updateVariableSchema), async (c) => {
        const userId = c.get("userId");
        const variableId = c.req.param("id");
        const data = c.req.valid("json");

        // Get variable with snippet for ownership check
        const existingVariable = await db.query.variables.findFirst({
          where: eq(variables.id, variableId),
          with: {
            snippet: true,
          },
        });

        if (!existingVariable) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Check ownership
        if (existingVariable.snippet.userId !== userId) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Update variable
        const [updatedVariable] = await db
          .update(variables)
          .set({
            ...(data.name && { name: data.name }),
            ...(data.defaultValue !== undefined && {
              defaultValue: data.defaultValue,
            }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.order !== undefined && { order: data.order }),
            updatedAt: new Date(),
          })
          .where(eq(variables.id, variableId))
          .returning();

        // Update snippet's updatedAt
        await db
          .update(snippets)
          .set({ updatedAt: new Date() })
          .where(eq(snippets.id, existingVariable.snippetId));

        return c.json({ variable: updatedVariable });
      })

      // DELETE /api/variables/:id - Delete variable
      .delete("/:id", async (c) => {
        const userId = c.get("userId");
        const variableId = c.req.param("id");

        // Get variable with snippet for ownership check
        const existingVariable = await db.query.variables.findFirst({
          where: eq(variables.id, variableId),
          with: {
            snippet: true,
          },
        });

        if (!existingVariable) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Check ownership
        if (existingVariable.snippet.userId !== userId) {
          return c.json({ error: "Variable not found" }, 404);
        }

        // Delete variable
        await db.delete(variables).where(eq(variables.id, variableId));

        // Update snippet's updatedAt
        await db
          .update(snippets)
          .set({ updatedAt: new Date() })
          .where(eq(snippets.id, existingVariable.snippetId));

        return c.json({ message: "Variable deleted successfully" });
      })
  );
}
