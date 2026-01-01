# SnippetVault

> A modern code snippet manager for organizing multi-file code packs with variable templating.

## Overview

SnippetVault allows you to save, organize, and export reusable code snippets as **complete packages** - not just single files. Perfect for Docker setups, React hooks with types, API boilerplates, and configuration bundles.

### Key Features

- **Multi-file snippets**: Group related files together (Dockerfile + docker-compose + .dockerignore)
- **Variable templating**: Use `{{PROJECT_NAME}}` syntax with customizable defaults
- **Smart organization**: Tags, favorites, and full-text search
- **Export anywhere**: Copy to clipboard or download as ZIP
- **Type-safe API**: Full TypeScript support with Hono RPC

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono + Better Auth + Drizzle ORM
- **Frontend**: React + Vite + TanStack (Router, Query, Form)
- **Database**: PostgreSQL
- **UI**: shadcn/ui + Tailwind CSS

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for PostgreSQL)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd snippetvault

# Install dependencies
bun install

# Start PostgreSQL
docker compose up -d

# Push database schema
bun run db:push

# Start development servers
bun run dev
```

Visit:
- Frontend: http://localhost:5173
- API: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Development

```bash
# Start all services
bun run dev

# Start individually
bun run dev:api      # API server only
bun run dev:web      # Frontend only

# Database
bun run db:generate  # Generate migrations
bun run db:push      # Push schema (dev)
bun run db:migrate   # Run migrations (prod)
bun run db:studio    # Open Drizzle Studio

# Build for production
bun run build

# Type checking
bun run typecheck
```

## Project Structure

```
snippetvault/
├── apps/
│   ├── api/          # Hono backend
│   └── web/          # React frontend
├── packages/
│   └── db/           # Drizzle schema & migrations
└── docs/             # Documentation
```

## Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://snippetvault:snippetvault@localhost:5432/snippetvault
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

## Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions on deploying to:
- Docker Swarm (Dokploy)
- VPS with PostgreSQL
- SSL configuration

## Documentation

- [Project Description](docs/PROJECT_DESCRIPTION.md) - Full feature specification
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development roadmap
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

## Contributing

Read [AGENTS.md](AGENTS.md) for project conventions and coding guidelines.

## License

MIT
