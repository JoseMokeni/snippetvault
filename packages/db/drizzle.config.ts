import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle/migrations',
  schema: './src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://snippetvault:snippetvault@localhost:5432/snippetvault',
  },
  verbose: true,
  strict: true,
})
