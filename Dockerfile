# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install dependencies (--ignore-scripts to skip husky in Docker)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source files
COPY . .

# Build the frontend (outputs to apps/api/public)
RUN bun run --filter @snippetvault/web build

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy the entire workspace structure needed for runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy API source (Bun runs TypeScript directly)
COPY --from=builder /app/apps/api ./apps/api

# Copy db package (Bun runs TypeScript directly)
COPY --from=builder /app/packages/db ./packages/db

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use Bun to check health endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD ["bun", "run", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]

WORKDIR /app/apps/api

CMD ["bun", "run", "src/index.ts"]
