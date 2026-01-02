/**
 * Preload file for bun tests.
 * This runs once before all test files.
 */

// Set environment variables BEFORE any imports that might validate them
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5433/test";
process.env.BETTER_AUTH_SECRET =
  "test-secret-that-is-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

import { beforeAll, afterAll } from "bun:test";
import { setupTestDatabase, teardownTestDatabase } from "./setup";

// Setup database before any tests run
beforeAll(async () => {
  await setupTestDatabase();
}, 30000); // 30 second timeout

// Cleanup after all tests complete
afterAll(async () => {
  await teardownTestDatabase();
});
