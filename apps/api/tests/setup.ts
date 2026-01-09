import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@snippetvault/db/schema";
import { resolve } from "path";

export type TestDb = PostgresJsDatabase<typeof schema>;

let testDb: TestDb | null = null;
let client: ReturnType<typeof postgres> | null = null;

// Test database connection string
// - CI: Uses TEST_DATABASE_URL env var
// - Local: Falls back to docker-compose db-test service (port 5433)
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5433/test";

/**
 * Setup test database connection.
 * Requires docker-compose db-test service to be running:
 *   docker compose up db-test -d
 */
export async function setupTestDatabase(): Promise<TestDb> {
  if (testDb) return testDb;

  console.log("🐘 Connecting to test database...");
  const startTime = Date.now();

  // Create postgres client
  client = postgres(TEST_DATABASE_URL);
  testDb = drizzle(client, { schema });

  // Run migrations - resolve from workspace root
  console.log("📦 Running migrations...");
  const migrationsPath = resolve(
    import.meta.dir,
    "../../../packages/db/drizzle/migrations"
  );
  await migrate(testDb, { migrationsFolder: migrationsPath });
  console.log(`✅ Database ready in ${Date.now() - startTime}ms`);

  return testDb;
}

/**
 * Get the test database instance.
 */
export function getTestDb(): TestDb {
  if (!testDb) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first."
    );
  }
  return testDb;
}

/**
 * Clean up the test database connection.
 */
export async function teardownTestDatabase(): Promise<void> {
  console.log("🧹 Cleaning up test database...");

  if (client) {
    await client.end();
    client = null;
  }

  testDb = null;
  console.log("✅ Test database cleaned up");
}

/**
 * Clear all data from tables (for test isolation).
 */
export async function clearTestData(): Promise<void> {
  if (!testDb) {
    throw new Error("Test database not initialized");
  }

  // Delete in order respecting foreign keys
  await testDb.delete(schema.stars);
  await testDb.delete(schema.snippetsTags);
  await testDb.delete(schema.files);
  await testDb.delete(schema.variables);
  await testDb.delete(schema.tags);
  await testDb.delete(schema.snippets);
  await testDb.delete(schema.sessions);
  await testDb.delete(schema.accounts);
  await testDb.delete(schema.verifications);
  await testDb.delete(schema.users);
}
