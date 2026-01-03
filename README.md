# SnippetVault

> A modern code snippet manager for organizing multi-file code packs with variable templating.

## Overview

SnippetVault allows you to save, organize, and export reusable code snippets as **complete packages** - not just single files. Perfect for Docker setups, React hooks with types, API boilerplates, and configuration bundles.

### Key Features

- **Multi-file snippets**: Group related files together (Dockerfile + docker-compose + .dockerignore)
- **Variable templating**: Use `{{PROJECT_NAME}}` syntax with customizable defaults
- **Public sharing**: Generate shareable links for read-only snippet access (no login required)
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

# Code quality
bun run typecheck    # Type checking
bun run lint         # ESLint
```

### Git Hooks

Husky is configured to automatically run quality checks:

- **pre-commit**: Runs `bun lint && bun typecheck` to check code style and types
- **pre-push**: Runs `bun test` to verify all tests pass

These hooks ensure code quality before committing and pushing changes.

### Testing

Tests use a dedicated PostgreSQL container via docker-compose for fast, isolated test execution.

```bash
# Start the test database (first time only, or after docker compose down)
docker compose up db-test -d

# Run tests
bun run test

# Run tests in watch mode
cd apps/api && bun test --watch
```

The test database runs on port 5433 to avoid conflicts with the development database.

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

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment with a professional DevOps workflow.

### Workflow Overview

The CI/CD pipeline runs on:

- **Push to `main`**: Runs all checks and publishes Docker images
- **Pull Requests**: Runs all checks without publishing
- **Version Tags** (`v*.*.*`): Runs all checks and publishes with semantic versioning

### Pipeline Stages

1. **Quality Checks** (parallel execution):

   - **Lint**: ESLint code quality checks
   - **Type Check**: TypeScript type safety verification
   - **Test**: Full test suite with PostgreSQL service

2. **Build & Push** (runs after quality checks pass):
   - Multi-platform Docker builds (amd64, arm64)
   - Layer caching for faster builds
   - Automated tagging strategy
   - Push to GitHub Container Registry (GHCR)

### Image Tagging Strategy

Images are automatically tagged with:

- `latest`: Latest build from main branch
- `main-<sha>`: Main branch with commit SHA
- `v1.2.3`: Semantic version tags (if tagged)
- `v1.2`: Major.minor version
- `v1`: Major version only

### Using Published Images

Pull and run the latest image from GHCR:

```bash
# Pull the latest image
docker pull ghcr.io/JoseMokeni/snippetvault:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_URL=https://your-domain.com \
  -e NODE_ENV=production \
  ghcr.io/JoseMokeni/snippetvault:latest

# Or use docker-compose with the published image
# Update docker-compose.yml to use: image: ghcr.io/JoseMokeni/snippetvault:latest
docker compose up -d
```

### Setup Requirements

The workflow uses GitHub's automatic `GITHUB_TOKEN` - no manual secrets needed. The token automatically has permissions to:

- Read repository contents
- Write to GitHub Container Registry

To enable GHCR package visibility:

1. Go to your repository → Settings → Actions → General
2. Under "Workflow permissions", ensure "Read and write permissions" is selected
3. After first build, go to the package settings and make it public (optional)

### Local Development Testing

Test the CI pipeline locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run the full CI pipeline locally
act push

# Run specific jobs
act -j lint
act -j test
act -j build
```

## Docker Deployment

### Building Locally

Build and run with Docker:

```bash
# Build the image
docker build -t snippetvault .

# Run with docker-compose (includes PostgreSQL)
# Uncomment the 'app' service in docker-compose.yml, then:
docker compose up -d

# Run migrations inside the container
docker exec snippetvault-app bun run --filter @snippetvault/db migrate

# Optional: seed the database
docker exec snippetvault-app bun run --filter @snippetvault/db seed
```

The app will be available at http://localhost:3000

### Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed production deployment instructions:

- Docker Swarm (Dokploy)
- VPS with PostgreSQL
- SSL configuration
- Backup strategies
- Using GHCR images in production

## Documentation

- [Project Description](docs/PROJECT_DESCRIPTION.md) - Full feature specification
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development roadmap
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

## Contributing

Read [AGENTS.md](AGENTS.md) for project conventions and coding guidelines.

## License

MIT
