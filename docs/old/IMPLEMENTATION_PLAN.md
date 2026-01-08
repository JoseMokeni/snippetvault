# SnippetVault - Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for SnippetVault.
Each phase builds on the previous one, ensuring a working application at each stage.

---

## Phase 1: Project Setup & Monorepo Structure

### 1.1 Initialize Bun Workspace

- [ ] Create root `package.json` with workspaces config
- [ ] Create `bunfig.toml` for Bun configuration
- [ ] Create `AGENTS.md` with project directives (see section 1.0)
- [ ] Create `CLAUDE.md` referencing AGENTS.md (see section 1.0)
- [ ] Setup `.gitignore`
- [ ] Create folder structure: `apps/`, `packages/`

### 1.0 Project Directive Files

Create two files for AI assistant compatibility:

#### AGENTS.md (Main directives - agent-agnostic)

```markdown
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

\`\`\`bash
bun run dev          # Start all apps
bun run dev:api      # Start API only
bun run dev:web      # Start frontend only
bun run db:generate  # Generate migrations
bun run db:push      # Push schema to DB
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
bun run build        # Build all
bun run typecheck    # Type check all
\`\`\`

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
\`\`\`typescript
// apps/api/src/routes/index.ts
export const app = new Hono()
  .route('/snippets', snippetsRoute)
  .route('/tags', tagsRoute)

export type AppType = typeof app
\`\`\`

### Frontend API Client
\`\`\`typescript
// apps/web/src/lib/api.ts
import { hc } from 'hono/client'
import type { AppType } from '@snippetvault/api/routes'

export const client = hc<AppType>('/api')
\`\`\`

### Better Auth Setup
- Config in `apps/api/src/lib/auth.ts`
- Handler in `apps/api/src/routes/auth.ts`
- Client in `apps/web/src/lib/auth-client.ts`

## Environment Variables

Required in `.env`:
\`\`\`
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
\`\`\`

## Common Issues

### Types not updating
Run `bun run typecheck` or restart TypeScript server

### Database connection errors
Ensure PostgreSQL is running: `docker compose up -d`

### CORS errors in development
API runs on :3000, Vite on :5173 - CORS is configured for dev

## Documentation

- `PROJECT2_DESCRIPTION.md` - Full project specification
- `DEPLOYMENT.md` - Docker/Dokploy deployment guide
- `IMPLEMENTATION_PLAN.md` - Step-by-step implementation plan
```

#### CLAUDE.md (Claude Code specific - references AGENTS.md)

```markdown
# Claude Code Configuration

Read and follow all directives in AGENTS.md.

## Additional Claude-Specific Instructions

- When implementing features, follow the phased approach in `IMPLEMENTATION_PLAN.md`
- Test each endpoint with curl immediately after implementation
- Commit after each working feature with descriptive messages
- Use Context7 MCP to look up Hono, Better Auth, Drizzle, and TanStack documentation when needed

## Skills Usage

Use the following skills when appropriate:

### /frontend-design
Use this skill when:
- Creating new UI components (cards, modals, forms)
- Building pages and layouts
- Implementing responsive designs
- Styling with Tailwind CSS
- Working on any visual/UI task

### /feature-dev
Use this skill when:
- Implementing new features end-to-end
- Building API endpoints with their corresponding frontend
- Complex multi-file changes
- Full-stack feature development

### /plan
Use this skill when:
- Starting a new feature or phase
- Designing implementation strategy
- Breaking down complex tasks
- Architectural decisions

## MCP Tools

- **Context7**: Look up documentation for Hono, Better Auth, Drizzle, TanStack, shadcn/ui
```

### 1.2 Setup `packages/db`

- [ ] Initialize `packages/db/package.json` with name `@snippetvault/db`
- [ ] Install Drizzle ORM + drizzle-kit + postgres driver
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/client.ts` - Drizzle instance
- [ ] Create `src/index.ts` - exports

### 1.3 Setup `apps/api`

- [ ] Initialize `packages.json` with name `@snippetvault/api`
- [ ] Install Hono, Better Auth, Zod
- [ ] Add dependency on `@snippetvault/db` via `workspace:*`
- [ ] Create `tsconfig.json`
- [ ] Create basic `src/index.ts` entry point

### 1.4 Setup `apps/web`

- [ ] Initialize with Vite + React + TypeScript template
- [ ] Install TanStack Router, TanStack Query, TanStack Form
- [ ] Install Tailwind CSS v4
- [ ] Initialize shadcn/ui (`bunx shadcn@latest init`)
- [ ] Create `tsconfig.json` with path aliases
- [ ] Configure Vite for API proxy in dev

### 1.5 Development Environment

- [ ] Create `docker-compose.yml` for PostgreSQL
- [ ] Create root `.env` with DATABASE_URL
- [ ] Create root scripts: `dev`, `build`, `db:*`
- [ ] Verify `bun run dev` starts both apps

**Deliverable:** Empty monorepo that runs with `bun run dev`

---

## Phase 2: Database Schema

### 2.1 Create Schema Files

- [ ] `packages/db/src/schema/users.ts` - users table
- [ ] `packages/db/src/schema/sessions.ts` - Better Auth sessions
- [ ] `packages/db/src/schema/accounts.ts` - Better Auth accounts
- [ ] `packages/db/src/schema/verifications.ts` - Better Auth verifications
- [ ] `packages/db/src/schema/snippets.ts` - snippets table
- [ ] `packages/db/src/schema/files.ts` - files table
- [ ] `packages/db/src/schema/variables.ts` - variables table
- [ ] `packages/db/src/schema/tags.ts` - tags + snippets_tags tables
- [ ] `packages/db/src/schema/index.ts` - export all

### 2.2 Relations

- [ ] Define Drizzle relations between tables
- [ ] User → Snippets (one-to-many)
- [ ] Snippet → Files (one-to-many)
- [ ] Snippet → Variables (one-to-many)
- [ ] Snippet ↔ Tags (many-to-many via snippets_tags)
- [ ] User → Tags (one-to-many)

### 2.3 Migrations

- [ ] Generate initial migration: `bun run db:generate`
- [ ] Push to database: `bun run db:push`
- [ ] Verify tables in PostgreSQL

### 2.4 Seed Data

- [ ] Create `packages/db/src/seed.ts`
- [ ] Add example snippets (Docker setup, React hook, etc.)
- [ ] Add script to run seed

**Deliverable:** Database with all tables created and sample data

---

## Phase 3: Authentication (Backend)

### 3.1 Better Auth Setup

- [ ] Create `apps/api/src/lib/env.ts` - Zod env validation
- [ ] Create `apps/api/src/lib/auth.ts` - Better Auth config with Drizzle adapter
- [ ] Configure email/password authentication
- [ ] Configure session settings (7 days expiry)

### 3.2 Auth Routes

- [ ] Create `apps/api/src/routes/auth.ts`
- [ ] Mount Better Auth handler on `/api/auth/*`
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test session endpoint

### 3.3 Auth Middleware

- [ ] Create `apps/api/src/middleware/auth.ts`
- [ ] Extract and validate session from cookies
- [ ] Set `userId` in Hono context
- [ ] Create protected route wrapper

**Deliverable:** Working auth endpoints, can register/login via curl or Postman

---

## Phase 4: API Routes (Backend)

### 4.1 Route Structure

- [ ] Create `apps/api/src/routes/index.ts` - route aggregator
- [ ] Export `AppType` for Hono RPC
- [ ] Add health check endpoint `/api/health`

### 4.2 Snippets Routes

- [ ] `GET /api/snippets` - List user's snippets with filters
  - [ ] Filter by language
  - [ ] Filter by tag
  - [ ] Filter by favorite
  - [ ] Search by title/content
  - [ ] Sort by created_at/updated_at
- [ ] `GET /api/snippets/:id` - Get snippet with files + variables + tags
- [ ] `POST /api/snippets` - Create snippet
- [ ] `PUT /api/snippets/:id` - Update snippet
- [ ] `DELETE /api/snippets/:id` - Delete snippet (cascade files/variables)
- [ ] `PATCH /api/snippets/:id/favorite` - Toggle favorite
- [ ] `POST /api/snippets/:id/duplicate` - Duplicate snippet

### 4.3 Files Routes

- [ ] `POST /api/snippets/:id/files` - Add file to snippet
- [ ] `GET /api/files/:id` - Get file details
- [ ] `PUT /api/files/:id` - Update file
- [ ] `DELETE /api/files/:id` - Delete file
- [ ] `PATCH /api/snippets/:id/files/reorder` - Reorder files

### 4.4 Variables Routes

- [ ] `POST /api/snippets/:id/variables` - Add variable
- [ ] `GET /api/variables/:id` - Get variable
- [ ] `PUT /api/variables/:id` - Update variable
- [ ] `DELETE /api/variables/:id` - Delete variable

### 4.5 Tags Routes

- [ ] `GET /api/tags` - List user's tags
- [ ] `POST /api/tags` - Create tag
- [ ] `PUT /api/tags/:id` - Update tag
- [ ] `DELETE /api/tags/:id` - Delete tag

### 4.6 Validation

- [ ] Create Zod schemas for all request bodies
- [ ] Use Hono validator middleware
- [ ] Proper error responses with status codes

**Deliverable:** Complete REST API, testable via curl/Postman

---

## Phase 5: Authentication (Frontend)

### 5.1 Auth Client Setup

- [ ] Create `apps/web/src/lib/auth-client.ts` - Better Auth React client
- [ ] Export `signIn`, `signUp`, `signOut`, `useSession`

### 5.2 Auth Pages

- [ ] Create `apps/web/src/routes/login.tsx`
  - [ ] Email/password form
  - [ ] Link to register
  - [ ] Redirect to dashboard on success
- [ ] Create `apps/web/src/routes/register.tsx`
  - [ ] Name, email, password form
  - [ ] Link to login
  - [ ] Redirect to dashboard on success

### 5.3 Auth Guard

- [ ] Create `apps/web/src/components/layout/auth-guard.tsx`
- [ ] Check session, redirect to login if not authenticated
- [ ] Show loading state while checking

### 5.4 Route Protection

- [ ] Setup TanStack Router with auth guard on `/dashboard/*`
- [ ] Create `apps/web/src/routes/__root.tsx`
- [ ] Create `apps/web/src/routes/dashboard/route.tsx` with guard

**Deliverable:** Working login/register, protected dashboard route

---

## Phase 6: Frontend Core Setup

### 6.1 API Client

- [ ] Create `apps/web/src/lib/api.ts` - Hono RPC client
- [ ] Configure credentials for cookies
- [ ] Type-safe API calls

### 6.2 TanStack Query Setup

- [ ] Create `apps/web/src/lib/query.ts` - QueryClient config
- [ ] Setup QueryClientProvider in app root

### 6.3 Layout Components

- [ ] Install shadcn components: button, input, card, badge, dialog, etc.
- [ ] Create `apps/web/src/components/layout/header.tsx`
  - [ ] Logo
  - [ ] User menu (logout)
- [ ] Create `apps/web/src/components/layout/sidebar.tsx`
  - [ ] Navigation: All Snippets, Favorites
  - [ ] Tags list
  - [ ] New Snippet button

### 6.4 Base Styles

- [ ] Configure Tailwind theme (colors, fonts)
- [ ] Dark mode support (optional for MVP)

**Deliverable:** App shell with header, sidebar, protected routes

---

## Phase 7: Snippets List

### 7.1 Snippets Query Hook

- [ ] Create `apps/web/src/hooks/use-snippets.ts`
- [ ] `useSnippets(filters)` - list with filters
- [ ] `useSnippet(id)` - single snippet
- [ ] `useCreateSnippet()` - mutation
- [ ] `useUpdateSnippet()` - mutation
- [ ] `useDeleteSnippet()` - mutation
- [ ] `useToggleFavorite()` - mutation
- [ ] `useDuplicateSnippet()` - mutation

### 7.2 Snippet Card Component

- [ ] Create `apps/web/src/components/snippets/snippet-card.tsx`
- [ ] Display: title, description (truncated), language badge
- [ ] Display: tags, files count, favorite icon
- [ ] Click to navigate to snippet detail

### 7.3 Snippet List Component

- [ ] Create `apps/web/src/components/snippets/snippet-list.tsx`
- [ ] Grid of snippet cards
- [ ] Empty state when no snippets
- [ ] Loading skeleton

### 7.4 Dashboard Index Page

- [ ] Create `apps/web/src/routes/dashboard/index.tsx`
- [ ] Snippet list
- [ ] Search bar
- [ ] Filter dropdowns (language, tags)

### 7.5 Favorites Page

- [ ] Create `apps/web/src/routes/dashboard/favorites.tsx`
- [ ] Same as index but filtered by `isFavorite: true`

**Deliverable:** Browse snippets, filter, search, see favorites

---

## Phase 8: Snippet Creation & Editing

### 8.1 Snippet Form Component

- [ ] Create `apps/web/src/components/snippets/snippet-form.tsx`
- [ ] Title input
- [ ] Description textarea
- [ ] Instructions textarea (markdown)
- [ ] Language select
- [ ] Tags multi-select

### 8.2 File Editor Component

- [ ] Install Monaco Editor or CodeMirror
- [ ] Create `apps/web/src/components/files/file-editor.tsx`
- [ ] Syntax highlighting based on language
- [ ] Auto-detect language from filename

### 8.3 File Management

- [ ] Create `apps/web/src/components/files/file-tabs.tsx`
  - [ ] Tab for each file
  - [ ] Add file button
  - [ ] Close/delete file button
- [ ] Create `apps/web/src/components/files/file-form.tsx`
  - [ ] Filename input (with path support)
  - [ ] Language select
- [ ] Create `apps/web/src/hooks/use-files.ts`
  - [ ] CRUD mutations

### 8.4 Variable Management

- [ ] Create `apps/web/src/components/variables/variable-form.tsx`
  - [ ] Name input
  - [ ] Default value input
  - [ ] Description input
- [ ] Create `apps/web/src/components/variables/variable-list.tsx`
  - [ ] List of variables
  - [ ] Add/edit/delete

### 8.5 New Snippet Page

- [ ] Create `apps/web/src/routes/dashboard/new.tsx`
- [ ] Snippet form
- [ ] File tabs + editor
- [ ] Variables section
- [ ] Save button

### 8.6 Edit Snippet Page

- [ ] Create `apps/web/src/routes/dashboard/$snippetId/edit.tsx`
- [ ] Load existing snippet data
- [ ] Same UI as new page
- [ ] Save changes

**Deliverable:** Create and edit snippets with multiple files and variables

---

## Phase 9: Snippet Viewer

### 9.1 File Tree Component

- [ ] Install shadcn-tree-view (MrLightful)
- [ ] Create `apps/web/src/components/files/file-tree.tsx`
- [ ] Parse filenames into tree structure
- [ ] Click to select file

### 9.2 Code Preview Component

- [ ] Create `apps/web/src/components/files/code-preview.tsx`
- [ ] Syntax highlighting (read-only)
- [ ] Line numbers
- [ ] Copy button per file

### 9.3 Snippet Viewer Component

- [ ] Create `apps/web/src/components/snippets/snippet-viewer.tsx`
- [ ] Header: title, description, tags, favorite toggle
- [ ] Instructions section (render markdown)
- [ ] File tree or tabs
- [ ] Code preview for selected file

### 9.4 Snippet Detail Page

- [ ] Create `apps/web/src/routes/dashboard/$snippetId/index.tsx`
- [ ] Load snippet with files/variables/tags
- [ ] Snippet viewer
- [ ] Edit button → navigate to edit page
- [ ] Delete button (with confirmation)
- [ ] Export button → open export modal

**Deliverable:** View snippet details with syntax-highlighted code

---

## Phase 10: Export Feature

### 10.1 Template Substitution

- [ ] Create `apps/web/src/lib/template.ts`
- [ ] `substituteVariables(content, values)` function
- [ ] Regex: `{{VARIABLE_NAME}}`

### 10.2 Variable Preview

- [ ] Create `apps/web/src/components/variables/variable-preview.tsx`
- [ ] Form with variable inputs (prefilled with defaults)
- [ ] Live preview of substituted content

### 10.3 Export Utilities

- [ ] Install JSZip
- [ ] Create `apps/web/src/lib/export.ts`
- [ ] `exportAsZip(snippetTitle, files, variables)` → Blob
- [ ] `copyAllFiles(files, variables)` → formatted string with separators
- [ ] `copyFile(content, variables)` → single file content

### 10.4 Export Modal

- [ ] Create `apps/web/src/components/export/export-modal.tsx`
- [ ] Variable configuration form
- [ ] Preview tabs for each file
- [ ] Copy single file button
- [ ] Copy all button
- [ ] Download ZIP button

### 10.5 Copy Button Component

- [ ] Create `apps/web/src/components/export/copy-button.tsx`
- [ ] Copy to clipboard
- [ ] Success feedback (toast or icon change)

**Deliverable:** Export snippets with variable substitution to clipboard or ZIP

---

## Phase 11: Tags Management

### 11.1 Tags Query Hook

- [ ] Create `apps/web/src/hooks/use-tags.ts`
- [ ] `useTags()` - list
- [ ] `useCreateTag()` - mutation
- [ ] `useUpdateTag()` - mutation
- [ ] `useDeleteTag()` - mutation

### 11.2 Tag Components

- [ ] Create `apps/web/src/components/tags/tag-badge.tsx`
  - [ ] Colored badge
- [ ] Create `apps/web/src/components/tags/tag-select.tsx`
  - [ ] Multi-select for snippet form
  - [ ] Create new tag inline
- [ ] Create `apps/web/src/components/tags/tag-filter.tsx`
  - [ ] Filter chips in sidebar/header

### 11.3 Tags in Sidebar

- [ ] List all user tags
- [ ] Click to filter snippets by tag
- [ ] Edit/delete tags (optional modal)

**Deliverable:** Full tag management and filtering

---

## Phase 12: Search

### 12.1 Search Bar Component

- [ ] Create `apps/web/src/components/search/search-bar.tsx`
- [ ] Debounced input
- [ ] Clear button

### 12.2 Search Integration

- [ ] Pass search query to `useSnippets` hook
- [ ] Backend full-text search on title, description, file content
- [ ] Highlight matches (optional)

**Deliverable:** Search snippets by keyword

---

## Phase 13: Polish & UX

### 13.1 Loading States

- [ ] Skeleton loaders for lists
- [ ] Loading spinners for mutations
- [ ] Optimistic updates where appropriate

### 13.2 Error Handling

- [ ] Error boundaries
- [ ] Toast notifications for errors
- [ ] Retry buttons

### 13.3 Empty States

- [ ] No snippets yet → CTA to create
- [ ] No favorites → explanation
- [ ] No search results → suggestions

### 13.4 Toasts/Notifications

- [ ] Install sonner or react-hot-toast
- [ ] Success toasts: created, updated, deleted, copied
- [ ] Error toasts: API failures

### 13.5 Keyboard Shortcuts (Optional)

- [ ] `Cmd+K` → Search
- [ ] `Cmd+N` → New snippet
- [ ] `Cmd+S` → Save (in edit mode)
- [ ] `Escape` → Close modals

### 13.6 Responsive Design

- [ ] Mobile-friendly sidebar (collapsible)
- [ ] Responsive grid for snippet cards
- [ ] Mobile-friendly code viewer

**Deliverable:** Polished, production-ready UX

---

## Phase 14: Production Preparation

### 14.1 Dockerfile

- [ ] Create multi-stage Dockerfile
- [ ] Build packages → web → api
- [ ] Copy web dist to api public
- [ ] Minimal production image

### 14.2 Docker Compose

- [ ] Create `docker-compose.prod.yml` for reference
- [ ] App + PostgreSQL services

### 14.3 Environment Configuration

- [ ] Document all required env vars
- [ ] Validate env at startup with Zod
- [ ] Fail fast on missing config

### 14.4 Health Check

- [ ] `/api/health` endpoint
- [ ] Database connectivity check
- [ ] Docker HEALTHCHECK instruction

### 14.5 Logging

- [ ] Hono logger middleware
- [ ] Structured JSON logs (optional)

**Deliverable:** Production-ready Docker image

---

## Phase 15: Deployment

### 15.1 Dokploy Setup

- [ ] Create project in Dokploy
- [ ] Add PostgreSQL database service
- [ ] Add application service from Git
- [ ] Configure environment variables
- [ ] Configure domain + SSL

### 15.2 CI/CD

- [ ] GitHub Actions workflow
- [ ] Run migrations
- [ ] Trigger Dokploy webhook

### 15.3 Backup

- [ ] Setup PostgreSQL backup script
- [ ] Configure cron job on VPS

### 15.4 Monitoring

- [ ] Check Dokploy logs
- [ ] Setup uptime monitoring (optional: UptimeRobot, etc.)

**Deliverable:** Live application at `https://snippetvault.yourdomain.com`

---

## Summary

| Phase | Description | Est. Complexity |
|-------|-------------|-----------------|
| 1 | Project Setup | Low |
| 2 | Database Schema | Low |
| 3 | Auth Backend | Medium |
| 4 | API Routes | Medium |
| 5 | Auth Frontend | Medium |
| 6 | Frontend Core | Low |
| 7 | Snippets List | Medium |
| 8 | Create/Edit | High |
| 9 | Snippet Viewer | Medium |
| 10 | Export Feature | Medium |
| 11 | Tags Management | Low |
| 12 | Search | Low |
| 13 | Polish & UX | Medium |
| 14 | Production Prep | Low |
| 15 | Deployment | Low |

---

## Notes

### Test As You Go (Critical)
- **After each endpoint**: Test with `curl` or API client before moving on
- **After each component**: Verify in browser before building the next
- **After each phase**: Ensure everything works together before starting the next phase
- Don't accumulate untested code - bugs are easier to fix when fresh

### Development Workflow
- Each phase should result in a working (if incomplete) application
- Commit frequently with meaningful messages
- Run `bun run typecheck` regularly to catch type errors early
- Use `bun run db:studio` to inspect database state

### When Stuck
- Check `AGENTS.md` for patterns and conventions
- Review `PROJECT2_DESCRIPTION.md` for feature specifications
- Check `DEPLOYMENT.md` for environment/config issues
- The plan can be adjusted as you discover requirements during implementation
