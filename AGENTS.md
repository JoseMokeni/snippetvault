# SnippetVault - Project Directives

## Project Overview

SnippetVault is a snippet manager for saving, organizing, and retrieving reusable code packs.
Unlike classic snippet managers (1 snippet = 1 file), SnippetVault groups multiple related files
with a variable system for customization.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono + Hono RPC
- **Frontend**: React + Vite + TanStack (Router, Query, Form)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Better Auth
- **ORM**: Drizzle
- **Database**: PostgreSQL
- **Validation**: Zod

## Project Structure

This is a Bun monorepo with:
- `apps/api` - Hono backend (@snippetvault/api)
- `apps/web` - React frontend (@snippetvault/web)
- `packages/db` - Drizzle schema & migrations (@snippetvault/db)

## Development Commands

```bash
bun run dev          # Start all apps
bun run dev:api      # Start API only
bun run dev:web      # Start frontend only
bun run db:generate  # Generate migrations
bun run db:push      # Push schema to DB
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
bun run build        # Build all
bun run typecheck    # Type check all
```

## Code Style & Guidelines

### General
- Use TypeScript strict mode
- Prefer `const` over `let`, never use `var`
- Use descriptive variable names
- Keep functions small and focused

### Backend (Hono)
- Chain routes for proper type inference: `new Hono().get(...).post(...)`
- Use Zod for request validation
- Return proper HTTP status codes
- Always check resource ownership before mutations

### Frontend (React)
- Use TanStack Query for server state
- Use TanStack Form for forms
- Colocate components with their routes when specific
- Shared components go in `components/`

### Database (Drizzle)
- Schema files in `packages/db/src/schema/`
- Use relations for type-safe joins
- Add indices for frequently queried columns

## Testing Guidelines

### Test As You Go
- Test each feature immediately after implementation
- Don't wait until the end to test
- Use `curl` or API client to test endpoints
- Verify UI flows in browser after each component

### What to Test
- API endpoints: correct response, auth checks, validation errors
- Forms: submission, validation feedback, success/error states
- Edge cases: empty states, long content, special characters

## File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `snippet-card.tsx`)
- Routes: `kebab-case.tsx` or TanStack Router conventions
- Utilities: `kebab-case.ts`
- Schema: `plural.ts` (e.g., `snippets.ts` for snippets table)

## Important Patterns

### Hono RPC Type Export
```typescript
// apps/api/src/routes/index.ts
export const app = new Hono()
  .route('/snippets', snippetsRoute)
  .route('/tags', tagsRoute)

export type AppType = typeof app
```

### Frontend API Client
```typescript
// apps/web/src/lib/api.ts
import { hc } from 'hono/client'
import type { AppType } from '@snippetvault/api/routes'

export const client = hc<AppType>('/api')
```

### Better Auth Setup
- Config in `apps/api/src/lib/auth.ts`
- Handler in `apps/api/src/routes/auth.ts`
- Client in `apps/web/src/lib/auth-client.ts`

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

## Common Issues

### Types not updating
Run `bun run typecheck` or restart TypeScript server

### Database connection errors
Ensure PostgreSQL is running: `docker compose up -d`

### CORS errors in development
API runs on :3000, Vite on :5173 - CORS is configured for dev

## Documentation

- `PROJECT_DESCRIPTION.md` - Full project specification
- `DEPLOYMENT.md` - Docker/Dokploy deployment guide
- `IMPLEMENTATION_PLAN.md` - Step-by-step implementation plan
