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
# Development
bun run dev          # Start all apps
bun run dev:api      # Start API only
bun run dev:web      # Start frontend only

# Database
bun run db:generate  # Generate migrations
bun run db:push      # Push schema to DB (dev)
bun run db:migrate   # Run migrations (prod)
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed database

# Build & Quality
bun run build        # Build all
bun run typecheck    # Type check all
bun run lint         # Run ESLint
bun run test         # Run tests

# Docker
bun run docker:build # Build Docker image
bun run docker:run   # Run Docker container
```

## Code Style & Guidelines

### General
- Use TypeScript strict mode
- Prefer `const` over `let`, never use `var`
- Use descriptive variable names
- Keep functions small and focused
- Follow ESLint rules - run `bun lint` before committing

### Backend (Hono)
- Chain routes for proper type inference: `new Hono().get(...).post(...)`
- Use Zod for request validation
- Return proper HTTP status codes
- Always check resource ownership before mutations
- Export route types for frontend RPC client

### Frontend (React)
- Use TanStack Router with file-based routing (`apps/web/src/routes/`)
- Use TanStack Query for server state
- Use TanStack Form for forms
- Protected routes: use `beforeLoad` hook with auth context
- Colocate components with their routes when specific
- Shared components go in `components/`
- Design System: Terminal Brutalism (see `apps/web/src/index.css` for theme)

### Database (Drizzle)
- Schema files in `packages/db/src/schema/`
- Use relations for type-safe joins
- Add indices for frequently queried columns
- Use timestamps (`createdAt`, `updatedAt`) on all tables

## Code Quality & Git Hooks

### Automated Checks
Git hooks run automatically via Husky:
- **pre-commit**: `bun lint && bun typecheck` - ensures code quality and type safety
- **pre-push**: `bun test` - ensures all tests pass before pushing

### Manual Quality Checks
```bash
bun run lint        # Run ESLint
bun run typecheck   # Check TypeScript types
bun run test        # Run test suite
```

### ESLint Rules
- Unused variables are errors (use `_` prefix for intentionally unused)
- React hooks rules enforced
- TypeScript recommended rules enabled

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
// apps/web/src/lib/api-client.ts
import { hc } from 'hono/client'
import type { AppType } from '@snippetvault/api/src/routes'

export const api = hc<AppType>('/api', {
  fetch: (input, init) => fetch(input, {
    ...init,
    credentials: 'include', // Important for auth cookies
  }),
})
```

### Better Auth Setup
```typescript
// Backend: apps/api/src/lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { /* schema */ }),
  emailAndPassword: { enabled: true },
  // ... config
})

// Backend: apps/api/src/index.ts
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// Frontend: apps/web/src/lib/auth-client.ts
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})

// Frontend: Protected routes with beforeLoad
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.data?.session) {
      throw redirect({ to: '/login', search: { redirect: '/dashboard' } })
    }
  },
})
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://snippetvault:snippetvault@localhost:5432/snippetvault
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

## CI/CD Pipeline

### GitHub Actions Workflow
Automated pipeline runs on every push and PR:
1. **Quality Checks** (parallel): lint, typecheck, test
2. **Build & Push**: Multi-platform Docker image to GHCR

### Workflow Triggers
- Push to `main`: Full pipeline + publish to GHCR
- Pull requests: Quality checks only (no publish)
- Version tags (`v*.*.*`): Full pipeline + semantic versioning

### Image Tagging
- `latest`: Latest build from main
- `main-<sha>`: Commit-specific build
- `v1.2.3`, `v1.2`, `v1`: Semantic versions

### Using CI/CD
```bash
# Local testing with act
act push              # Run full pipeline locally
act -j lint           # Run specific job

# Publishing
git tag v1.0.0        # Tag release
git push --tags       # Trigger versioned build
```

## Deployment

### Development
```bash
docker compose up -d  # Start PostgreSQL
bun run dev           # Start dev servers
```

### Production (Docker)
```bash
# Single-container deployment (API serves frontend)
docker build -t snippetvault .
docker run -p 3000:3000 --env-file .env.prod snippetvault

# Or use GHCR image
docker pull ghcr.io/<username>/snippetvault:latest
docker run -p 3000:3000 -e DATABASE_URL=... ghcr.io/<username>/snippetvault:latest

# Run migrations in container
docker exec <container> bun run --filter @snippetvault/db migrate
```

### Architecture Notes
- **Development**: Vite dev server (:5173) + API (:3000) with proxy
- **Production**: API serves static frontend build from `apps/api/public`
- Frontend builds to API's public directory for single-container deployment

## Common Issues

### Types not updating
Run `bun run typecheck` or restart TypeScript server in your IDE

### Database connection errors
Ensure PostgreSQL is running: `docker compose up -d`

### CORS errors in development
API runs on :3000, Vite on :5173 - proxy is configured in `vite.config.ts`

### Auth redirect issues
Use `window.location.href` instead of `navigate()` after auth to ensure fresh session state

### ESLint errors on commit
Fix errors with `bun run lint` or disable hooks temporarily with `git commit --no-verify` (not recommended)

### Tests failing in CI
Ensure tests pass locally first: `bun run test`
Check that PostgreSQL service is configured correctly in workflow

### Docker build failures
- Clear build cache: `docker builder prune`
- Check `.dockerignore` isn't excluding needed files
- Verify all dependencies are in `package.json`

## Documentation

- `PROJECT_DESCRIPTION.md` - Full project specification
- `DEPLOYMENT.md` - Docker/Dokploy deployment guide
- `IMPLEMENTATION_PLAN.md` - Step-by-step implementation plan
