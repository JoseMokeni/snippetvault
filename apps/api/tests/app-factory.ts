import type { Database } from "@snippetvault/db";
import { createApp } from "../src/routes";

/**
 * Create test app instance with test database.
 * Uses the real production routes with injected test db.
 */
export function createTestApp(db: Database) {
  return createApp(db);
}
