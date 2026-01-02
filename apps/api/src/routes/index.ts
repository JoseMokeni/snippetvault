import { Hono } from "hono";
import { db, type Database } from "@snippetvault/db";
import { authRoute } from "./auth";
import { createSnippetsRoute } from "./snippets";
import { createFilesRoute } from "./files";
import { createVariablesRoute } from "./variables";
import { createTagsRoute } from "./tags";

/**
 * Create the main app with all routes.
 * Accepts optional db parameter for dependency injection (useful for testing).
 */
export function createApp(database: Database = db) {
  return new Hono()
    .get("/health", (c) => {
      return c.json({
        status: "ok",
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || "development",
      });
    })
    .route("/auth", authRoute)
    .route("/snippets", createSnippetsRoute(database))
    .route("/files", createFilesRoute(database))
    .route("/variables", createVariablesRoute(database))
    .route("/tags", createTagsRoute(database));
}

// Default export with production db
export const app = createApp();

// Export type for Hono RPC client
export type AppType = typeof app;
