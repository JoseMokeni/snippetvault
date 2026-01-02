import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://snippetvault:snippetvault@localhost:5432/snippetvault";

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export Database type for dependency injection
export type Database = PostgresJsDatabase<typeof schema>;
