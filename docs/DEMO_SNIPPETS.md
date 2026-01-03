# Demo Snippets for LinkedIn Launch

These are high-quality, impressive snippets to create as public examples for showcasing SnippetVault's capabilities.

## Priority Snippets (Create These First)

### 1. Production Docker Setup
**Title:** Production-Ready Docker Stack
**Description:** Complete Docker setup with Node.js, Nginx reverse proxy, and PostgreSQL database
**Language:** dockerfile
**Tags:** docker, devops, production

**Files:**
- `Dockerfile` - Multi-stage Node.js production build
- `docker-compose.yml` - Full stack orchestration (app, nginx, postgres, redis)
- `.dockerignore` - Optimized build context
- `nginx/nginx.conf` - Production reverse proxy config

**Variables:**
- `PROJECT_NAME` (default: "my-app")
- `NODE_VERSION` (default: "20")
- `APP_PORT` (default: "3000")
- `POSTGRES_VERSION` (default: "16-alpine")

**Instructions:**
```markdown
# Production Docker Stack

Complete production-ready Docker setup for Node.js applications.

## Features
- Multi-stage builds for optimized image size
- Nginx reverse proxy with SSL ready
- PostgreSQL database with health checks
- Redis for caching/sessions
- Non-root user for security

## Quick Start
1. Update variables for your project
2. Run `docker-compose up -d`
3. Access at http://localhost

## Production Notes
- Configure SSL certificates in nginx/
- Set strong passwords in .env
- Review resource limits in compose file
```

---

### 2. React Custom Hook Template
**Title:** TypeScript React Hook Starter
**Description:** Production-ready custom React hook with TypeScript, tests, and documentation
**Language:** typescript
**Tags:** react, typescript, hooks, testing

**Files:**
- `hooks/use{{HOOK_NAME}}.ts` - Main hook implementation
- `hooks/use{{HOOK_NAME}}.test.ts` - Comprehensive test suite
- `types/{{HOOK_NAME}}.types.ts` - TypeScript definitions
- `README.md` - Usage documentation and examples

**Variables:**
- `HOOK_NAME` (default: "Api")
- `RETURN_TYPE` (default: "{ data, loading, error }")

**Instructions:**
```markdown
# Custom React Hook Template

Scaffolding for building type-safe, tested React hooks.

## What's Included
- TypeScript hook implementation
- Comprehensive test coverage with React Testing Library
- Proper TypeScript definitions
- Usage examples and API documentation

## Usage
1. Replace `{{HOOK_NAME}}` with your hook name (e.g., "Auth", "LocalStorage")
2. Implement your hook logic
3. Update types as needed
4. Run tests: `npm test`

## Example
\`\`\`tsx
const { data, loading, error } = use{{HOOK_NAME}}();
\`\`\`
```

---

### 3. GitHub Actions CI/CD Pipeline
**Title:** Complete GitHub Actions Workflow
**Description:** Professional CI/CD pipeline with testing, linting, building, and deployment
**Language:** yaml
**Tags:** github-actions, ci-cd, devops, automation

**Files:**
- `.github/workflows/ci.yml` - Main CI pipeline (lint, test, build)
- `.github/workflows/deploy.yml` - Production deployment
- `.github/workflows/pr-checks.yml` - Pull request validation

**Variables:**
- `NODE_VERSION` (default: "20.x")
- `PROJECT_NAME` (default: "my-project")
- `DEPLOY_BRANCH` (default: "main")

**Instructions:**
```markdown
# GitHub Actions CI/CD

Production-grade GitHub Actions workflows for Node.js projects.

## Workflows

### CI Pipeline
- Runs on every push and PR
- Parallel jobs for speed
- Linting, type checking, tests
- Build verification

### Deployment
- Triggered on main branch
- Automated versioning
- Docker image builds
- Health check verification

### PR Checks
- Code quality gates
- Coverage reports
- No force push to main

## Setup
1. Add secrets: `DEPLOY_TOKEN`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`
2. Update variables for your project
3. Push to trigger workflows
```

---

## Bonus Snippets (If Time Permits)

### 4. Tailwind CSS + TypeScript Setup
**Title:** Tailwind CSS Configuration Bundle
**Description:** Complete Tailwind setup with TypeScript, custom theme, and utilities
**Language:** typescript
**Tags:** tailwind, css, typescript, styling

**Files:**
- `tailwind.config.ts` - Custom theme configuration
- `postcss.config.js` - PostCSS setup
- `src/styles/globals.css` - Base styles and custom utilities
- `src/styles/theme.ts` - TypeScript theme tokens

**Variables:**
- `PRIMARY_COLOR` (default: "#3b82f6")
- `FONT_FAMILY` (default: "Inter")
- `BREAKPOINT_PREFIX` (default: "sm")

---

### 5. Express API Middleware Stack
**Title:** Express.js Production Middleware
**Description:** Battle-tested Express middleware for security, logging, and error handling
**Language:** typescript
**Tags:** express, api, middleware, nodejs

**Files:**
- `middleware/auth.ts` - JWT authentication
- `middleware/errorHandler.ts` - Global error handling
- `middleware/logger.ts` - Request/response logging
- `middleware/validator.ts` - Request validation
- `middleware/rateLimit.ts` - Rate limiting
- `types/middleware.types.ts` - TypeScript definitions

**Variables:**
- `JWT_SECRET_ENV` (default: "JWT_SECRET")
- `RATE_LIMIT_WINDOW` (default: "15")
- `RATE_LIMIT_MAX` (default: "100")

---

### 6. Drizzle ORM Schema Starter
**Title:** Drizzle ORM Multi-Table Schema
**Description:** Full-featured database schema with relations, indexes, and migrations
**Language:** typescript
**Tags:** drizzle, database, orm, postgresql

**Files:**
- `schema/users.ts` - Users table with auth fields
- `schema/posts.ts` - Posts with foreign keys
- `schema/comments.ts` - Nested comments
- `schema/relations.ts` - Drizzle relations config
- `migrations/0001_init.sql` - Initial migration
- `seed.ts` - Sample data script

**Variables:**
- `TABLE_PREFIX` (default: "")
- `ENABLE_SOFT_DELETE` (default: "true")

---

## LinkedIn Post Recommendations

When sharing on LinkedIn:

1. **Lead with the Docker Setup** - Most universally useful
2. **Include a screenshot** - Show the terminal UI with the multi-file structure
3. **Highlight the unique value:**
   - "Tired of copying Dockerfiles one by one?"
   - "Here's how I save 10+ minutes every new project"
4. **Include the public link** to the Docker snippet
5. **Call to action:** "Try it free at [your-url]"

## Public Snippet URLs

After creating these, the public URLs will be:
- `https://yourdomain.com/s/[slug]`

Make these the first snippets you create after deployment so they're available for the LinkedIn post.
