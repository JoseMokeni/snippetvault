# CI/CD Pipeline Documentation

This document describes the GitHub Actions CI/CD pipeline for SnippetVault.

## Workflow Overview

The CI/CD pipeline runs on:

- **Push to `main`**: Runs all checks and publishes Docker images
- **Pull Requests**: Runs all checks without publishing
- **Version Tags** (`v*.*.*`): Runs all checks and publishes with semantic versioning

## Pipeline Features

- **Concurrency Control**: Automatically cancels in-progress runs when new commits are pushed
- **Dependency Caching**: Bun dependencies are cached for 30-50% faster builds
- **Pinned Runtime**: Bun version is pinned (1.3.3) for reproducible builds
- **Security Scanning**: Trivy vulnerability scanner with GitHub Security integration
- **Discord Notifications**: Real-time pipeline status notifications to Discord
- **Reusable Actions**: DRY workflow with composite actions for Bun setup

## Pipeline Stages

### 1. Quality Checks (parallel execution)

- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript type safety verification
- **Test**: Full test suite with PostgreSQL service
- **Security**: Trivy vulnerability scan (CRITICAL/HIGH severity)

### 2. Build & Push (runs after all checks pass)

- Multi-platform Docker builds (amd64, arm64)
- Layer caching for faster builds
- Automated tagging strategy
- Push to GitHub Container Registry (GHCR)

### 3. Notify (runs always)

- Sends Discord notification with pipeline results
- Includes status of all jobs (lint, typecheck, test, security, build)

## Image Tagging Strategy

Images are automatically tagged with:

- `latest`: Latest build from main branch
- `main-<sha>`: Main branch with commit SHA
- `v1.2.3`: Semantic version tags (if tagged)
- `v1.2`: Major.minor version
- `v1`: Major version only

## Using Published Images

Pull and run the latest image from GHCR:

```bash
# Pull the latest image
docker pull ghcr.io/josemokeni/snippetvault:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_URL=https://yourdomain.com \
  -e NODE_ENV=production \
  ghcr.io/josemokeni/snippetvault:latest

# Or use docker-compose with the published image
# Update docker-compose.yml to use: image: ghcr.io/josemokeni/snippetvault:latest
docker compose up -d
```

## Setup Requirements

The workflow uses GitHub's automatic `GITHUB_TOKEN` - no manual secrets needed. The token automatically has permissions to:

- Read repository contents
- Write to GitHub Container Registry

To enable GHCR package visibility:

1. Go to your repository → Settings → Actions → General
2. Under "Workflow permissions", ensure "Read and write permissions" is selected
3. After first build, go to the package settings and make it public (optional)

## Discord Notifications Setup

To enable Discord notifications for pipeline status:

1. Create a Discord webhook in your server:
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook" and copy the URL
2. Add the webhook URL as a repository secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Create a new secret named `DISCORD_WEBHOOK` with the webhook URL

## Local Development Testing

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

## Troubleshooting

### Build Failures

- Check that all dependencies are in `package.json`
- Verify Docker build context in Dockerfile
- Clear build cache: `docker builder prune`

### Test Failures

- Ensure tests pass locally first: `bun run test`
- Check PostgreSQL service configuration
- Verify test database connection string

### GHCR Push Failures

- Verify repository permissions are set to "Read and write"
- Check that GITHUB_TOKEN has package write permissions
- Ensure image names follow lowercase conventions

### Discord Notifications Not Working

- Verify `DISCORD_WEBHOOK` secret is set correctly
- Check webhook URL is still valid in Discord
- Ensure webhook has permissions to post in the channel
