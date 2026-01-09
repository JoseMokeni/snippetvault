<div align="center">
  <img src="docs/assets/banner.svg" alt="SnippetVault Banner" width="100%">
  
  <p align="center">
    <strong>Multi-file code snippets with variable templating</strong>
  </p>

  <p align="center">
    <a href="https://github.com/JoseMokeni/snippetvault/actions/workflows/release.yml">
      <img src="https://github.com/JoseMokeni/snippetvault/actions/workflows/release.yml/badge.svg" alt="CI/CD Pipeline">
    </a>
    <a href="https://github.com/JoseMokeni/snippetvault/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://github.com/JoseMokeni/snippetvault/releases">
      <img src="https://img.shields.io/github/v/release/JoseMokeni/snippetvault?include_prereleases" alt="Release">
    </a>
    <a href="https://bun.sh">
      <img src="https://img.shields.io/badge/runtime-Bun-black?logo=bun" alt="Bun">
    </a>
  </p>

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## 🎯 Why SnippetVault?

Traditional snippet managers store **single files**. SnippetVault stores **complete packages** of related files with smart variable templating - perfect for Docker stacks, React component libraries, API boilerplates, and any reusable code that spans multiple files.

### The Problem

You need to share a Docker setup with your team. That's not just a `Dockerfile` - it's:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `README.md` with setup instructions

Copy-pasting 4+ files manually? Tedious. Storing them separately? Unorganized.

### The Solution

**SnippetVault** lets you save all those files as a single snippet with variables like `{{PROJECT_NAME}}`, share it with your team, and export it as a complete package with one click.

## ✨ Features

### Core Functionality

- 📦 **Multi-file Packages** - Group related files together (Dockerfile + docker-compose.yml + configs)
- 🔧 **Variable Templating** - Use `{{PROJECT_NAME}}` syntax with customizable defaults
- 📤 **Export Anywhere** - Copy to clipboard or download as ZIP
- 🏷️ **Smart Organization** - Tags, favorites, and full-text search

### Social & Sharing

- 🌐 **Explore Public Snippets** - Discover snippets shared by the community
- ⭐ **Star & Fork** - Bookmark favorites and create your own versions
- 👤 **User Profiles** - Public profile pages at `/u/username` with stats
- 🔗 **Share Links** - Generate read-only links (no login required)

### Developer Experience

- 🔐 **Multiple Auth Methods** - Email/password + GitHub OAuth
- 🎨 **Terminal Brutalism UI** - Clean, distraction-free interface
- ⚡ **Lightning Fast** - Built with Bun + Hono + React
- 📘 **Type-safe** - Full TypeScript with Hono RPC

## 📸 Screenshots

### Multi-File Snippet Editor

Create and organize snippets with multiple files, add descriptions, and configure visibility.

![Snippet Editor](docs/assets/screenshots/editor.png)

### Variable Templating

Define reusable variables with defaults like `{{PROJECT_NAME}}` that can be customized during export.

![Variable Templating](docs/assets/screenshots/variables.png)

### Explore Public Snippets

Discover community-shared snippets, search by language, and filter by popularity.

![Explore Page](docs/assets/screenshots/explore.png)

### User Profiles

Public profile pages showcasing user's snippets, stars, and contributions.

![User Profile](docs/assets/screenshots/profile.png)

### Export & Share

Download as ZIP, copy to clipboard, or generate shareable links.

![Export Options](docs/assets/screenshots/export.png)

## 🎬 Demo

> **Coming soon**: Live demo instance and walkthrough video

**Quick Example Use Cases:**

- 🐳 Docker development environments
- ⚛️ React component libraries with types
- 🔌 API endpoint boilerplates
- 🛠️ Configuration file bundles
- 📝 Project scaffolding templates

## 🛠️ Tech Stack

Built with modern, performant technologies:

| Layer        | Technologies                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Runtime**  | [Bun](https://bun.sh)                                                                                            |
| **Backend**  | [Hono](https://hono.dev) + [Better Auth](https://better-auth.com) + [Drizzle ORM](https://orm.drizzle.team)      |
| **Frontend** | [React](https://react.dev) + [Vite](https://vitejs.dev) + [TanStack](https://tanstack.com) (Router, Query, Form) |
| **Database** | [PostgreSQL](https://postgresql.org)                                                                             |
| **UI**       | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)                                     |
| **Auth**     | Email/Password + GitHub OAuth                                                                                    |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/JoseMokeni/snippetvault.git
cd snippetvault

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Start PostgreSQL
docker compose up -d

# Push database schema
bun run db:push

# (Optional) Seed with demo data
bun run db:seed

# Start development servers
bun run dev
```

### Access the Application

| Service            | URL                              |
| ------------------ | -------------------------------- |
| **Frontend**       | http://localhost:5173            |
| **API**            | http://localhost:3000            |
| **Health Check**   | http://localhost:3000/api/health |
| **Drizzle Studio** | `bun run db:studio`              |

## ⚙️ Environment Variables

Create a `.env` file in the root directory. See [.env.example](.env.example) for all available options.

### Required Variables

```env
# Database
DATABASE_URL=postgresql://snippetvault:snippetvault@localhost:5432/snippetvault

# Authentication (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:5173  # Frontend URL for OAuth

# Server
NODE_ENV=development
PORT=3000
```

### Optional: GitHub OAuth

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set **Authorization callback URL** to: `http://localhost:5173/api/auth/callback/github`
3. Add to `.env`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

For production, update the callback URL to your production domain.

## 💻 Development

### Common Commands

```bash
# Development
bun run dev          # Start all services
bun run dev:api      # API server only
bun run dev:web      # Frontend only

# Database
bun run db:generate  # Generate migrations
bun run db:push      # Push schema (dev)
bun run db:migrate   # Run migrations (prod)
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed with demo data

# Build & Quality
bun run build        # Build for production
bun run typecheck    # TypeScript checks
bun run lint         # ESLint
bun run test         # Run test suite
```

### Testing

```bash
# Start test database (first time only)
docker compose up db-test -d

# Run tests
bun run test

# Watch mode
cd apps/api && bun test --watch
```

Test database runs on port 5433 to avoid conflicts with development.

### Git Hooks

Quality checks run automatically via Husky:

- **pre-commit**: `bun lint && bun typecheck`
- **pre-push**: `bun test`

## 📁 Project Structure

```
snippetvault/
├── apps/
│   ├── api/              # Hono backend with Better Auth
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── lib/      # Auth & utilities
│   │   │   └── schemas/  # Zod validation
│   │   └── test/         # API tests
│   └── web/              # React frontend
│       ├── src/
│       │   ├── routes/   # TanStack Router pages
│       │   ├── components/
│       │   └── lib/      # API client & utils
│       └── public/
├── packages/
│   └── db/               # Drizzle ORM
│       ├── src/schema/   # Database schema
│       └── drizzle/      # Migrations
└── docs/                 # Documentation
    ├── assets/           # Images & logos
    └── architecture/     # Technical docs
```

## 🐳 Deployment

### Using Docker (Recommended)

Pull the pre-built image from GitHub Container Registry:

```bash
# Pull latest image
docker pull ghcr.io/josemokeni/snippetvault:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_URL=https://yourdomain.com \
  -e NODE_ENV=production \
  ghcr.io/josemokeni/snippetvault:latest
```

### Building Locally

```bash
docker build -t snippetvault .
docker compose up -d
docker exec snippetvault-app bun run --filter @snippetvault/db migrate
```

### Production Setup

See [docs/old/DEPLOYMENT.md](docs/old/DEPLOYMENT.md) for detailed guides on:

- VPS deployment with PostgreSQL
- SSL/TLS configuration
- Backup strategies
- Environment variables

See [.github/CI_CD.md](.github/CI_CD.md) for CI/CD pipeline documentation.

## 📖 Documentation

| Document                                | Description                              |
| --------------------------------------- | ---------------------------------------- |
| [AGENTS.md](AGENTS.md)                  | Project directives & coding guidelines   |
| [.github/CI_CD.md](.github/CI_CD.md)    | CI/CD pipeline & Docker deployment       |
| [Architecture Docs](docs/architecture/) | Technical architecture & future features |
| [Old Docs](docs/old/)                   | Project description, implementation plan |

## 🚀 Roadmap

- [ ] **CLI Tool** - Install snippets directly from terminal
- [ ] **VS Code Extension** - Browse and insert snippets in your editor
- [ ] **Snippet Versioning** - Track changes and roll back
- [ ] **Collections** - Group related snippets together
- [ ] **API Keys** - Programmatic access to snippets
- [ ] **Teams** - Collaborative snippet management

See [docs/architecture/](docs/architecture/) for detailed feature specs.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read [AGENTS.md](AGENTS.md) for coding guidelines and project conventions.

### Development Guidelines

- Follow the existing code style
- Run `bun lint` and `bun typecheck` before committing
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Hono](https://hono.dev) - Ultrafast web framework
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [TanStack](https://tanstack.com) - Powerful React tools
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/JoseMokeni/snippetvault/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JoseMokeni/snippetvault/discussions)

---

<div align="center">
  <p>Made with ⚡ by <a href="https://github.com/JoseMokeni">Jose Mokeni</a></p>
  <p>
    <a href="https://github.com/JoseMokeni/snippetvault">⭐ Star this repo</a> •
    <a href="https://github.com/JoseMokeni/snippetvault/fork">🍴 Fork it</a> •
    <a href="https://github.com/JoseMokeni/snippetvault/issues">🐛 Report Bug</a>
  </p>
</div>
