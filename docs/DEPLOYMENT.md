# SnippetVault - Deployment Guide

## Architecture: Single Container on Docker Swarm (Dokploy)

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPS (Dokploy)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Traefik (reverse proxy)                │  │
│  │                    SSL auto via Let's Encrypt             │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              snippetvault (Docker Service)                │  │
│  │                                                           │  │
│  │   Bun + Hono Server                                       │  │
│  │   ├── /api/*      → API routes                           │  │
│  │   ├── /api/auth/* → Better Auth                          │  │
│  │   └── /*          → Static React                         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Docker Service)                  │  │
│  │              Volume: postgres_data                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Pourquoi un seul container app ?

| Avantage | Description |
|----------|-------------|
| **Pas de CORS** | Même origine = pas de configuration cross-origin |
| **Simple** | Un seul service à déployer et monitorer |
| **Cookies simples** | Session cookies sans `SameSite` complexe |
| **Moins de ressources** | Un process Bun au lieu de deux |

---

## Structure du projet

```
snippetvault/
├── apps/
│   ├── api/                      # Backend Hono
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point + static serving
│   │   │   ├── routes/
│   │   │   │   ├── index.ts      # Route aggregator + AppType export
│   │   │   │   ├── auth.ts
│   │   │   │   ├── snippets.ts
│   │   │   │   ├── files.ts
│   │   │   │   ├── variables.ts
│   │   │   │   └── tags.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── lib/
│   │   │       ├── db.ts         # Drizzle client
│   │   │       ├── auth.ts       # Better Auth config
│   │   │       └── env.ts
│   │   ├── public/               # Built React app (generated)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                      # Frontend React
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.ts        # Hono RPC client
│       │   │   └── auth-client.ts # Better Auth client
│       │   └── ...
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   └── db/                       # Drizzle schema + migrations
│       ├── src/
│       │   ├── index.ts
│       │   ├── schema/
│       │   └── seed.ts
│       ├── drizzle/
│       │   └── migrations/
│       └── drizzle.config.ts
│
├── docker-compose.yml            # Dev: PostgreSQL local
├── docker-compose.prod.yml       # Prod: Pour référence (Dokploy gère)
├── Dockerfile                    # Production build
└── package.json                  # Workspace root
```

---

## Configuration des apps

### apps/api/src/index.ts

```typescript
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { app as apiRoutes } from './routes'

const app = new Hono()

// Logging
app.use('*', logger())

// En dev uniquement: CORS pour Vite (port différent)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/*', cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
}

// API routes
app.route('/api', apiRoutes)

// Serve static files (React build)
app.use('/*', serveStatic({ root: './public' }))

// SPA fallback - serve index.html for client-side routing
app.get('/*', serveStatic({ path: './public/index.html' }))

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
```

### apps/api/src/routes/index.ts

```typescript
import { Hono } from 'hono'
import { authRoute } from './auth'
import { snippetsRoute } from './snippets'
import { filesRoute } from './files'
import { variablesRoute } from './variables'
import { tagsRoute } from './tags'

// Chaîner les routes pour le type inference
export const app = new Hono()
  .route('/auth', authRoute)
  .route('/snippets', snippetsRoute)
  .route('/files', filesRoute)
  .route('/variables', variablesRoute)
  .route('/tags', tagsRoute)

// Export du type pour le client RPC
export type AppType = typeof app
```

### apps/api/src/lib/auth.ts

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import { env } from './env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})
```

### apps/api/src/routes/auth.ts

```typescript
import { Hono } from 'hono'
import { auth } from '../lib/auth'

export const authRoute = new Hono()
  .on(['POST', 'GET'], '/*', (c) => auth.handler(c.req.raw))
```

### apps/web/src/lib/api.ts

```typescript
import { hc } from 'hono/client'
import type { AppType } from '@snippetvault/api/routes'

// En production: même origine, pas besoin de baseURL
// En dev: pointer vers le serveur API
const baseUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : ''

export const client = hc<AppType>(`${baseUrl}/api`, {
  init: {
    credentials: 'include', // Important pour les cookies de session
  },
})

// Helpers typés
export const api = {
  snippets: client.snippets,
  files: client.files,
  variables: client.variables,
  tags: client.tags,
}
```

### apps/web/src/lib/auth-client.ts

```typescript
import { createAuthClient } from 'better-auth/react'

const baseUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : ''

export const authClient = createAuthClient({
  baseURL: baseUrl,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession
} = authClient
```

---

## Dockerfile (Production)

```dockerfile
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build packages
RUN bun run --filter @snippetvault/db build

# Build frontend
RUN bun run --filter @snippetvault/web build

# Build backend
RUN bun run --filter @snippetvault/api build

# Move frontend build to API public folder
RUN cp -r apps/web/dist/* apps/api/public/

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/public ./public
COPY --from=builder /app/apps/api/package.json ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["bun", "run", "dist/index.js"]
```

---

## docker-compose.yml (Développement local)

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: snippetvault-db
    environment:
      POSTGRES_USER: snippetvault
      POSTGRES_PASSWORD: snippetvault
      POSTGRES_DB: snippetvault
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snippetvault"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## Déploiement sur Dokploy

### Option 1: Déploiement depuis Git (Recommandé)

1. **Dans Dokploy, créer un nouveau projet**

2. **Ajouter un service PostgreSQL**
   - Type: Database → PostgreSQL
   - Nom: `snippetvault-db`
   - Version: 16
   - Créer un mot de passe fort
   - Noter la connection string interne: `postgresql://postgres:PASSWORD@snippetvault-db:5432/snippetvault`

3. **Ajouter le service Application**
   - Type: Application
   - Source: Git (connecter ton repo)
   - Build: Dockerfile
   - Port: 3000

4. **Configurer les variables d'environnement**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:PASSWORD@snippetvault-db:5432/snippetvault
   BETTER_AUTH_SECRET=your-secret-min-32-chars-use-openssl-rand
   BETTER_AUTH_URL=https://snippetvault.yourdomain.com
   ```

5. **Configurer le domaine**
   - Ajouter ton domaine: `snippetvault.yourdomain.com`
   - Activer HTTPS (Let's Encrypt automatique)

6. **Déployer**

### Option 2: Déploiement manuel avec docker-compose

Si tu préfères gérer toi-même:

#### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/yourusername/snippetvault:latest
    # Ou build local:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    container_name: snippetvault-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://snippetvault:${DB_PASSWORD}@db:5432/snippetvault
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - snippetvault-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  db:
    image: postgres:16-alpine
    container_name: snippetvault-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: snippetvault
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: snippetvault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - snippetvault-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snippetvault"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  snippetvault-network:
    driver: overlay

volumes:
  postgres_data:
```

#### .env.prod (sur le serveur, ne pas commit)

```env
DB_PASSWORD=super-secure-password-here
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=https://snippetvault.yourdomain.com
```

---

## Migrations en production

### Option A: Dans le Dockerfile (simple)

Ajouter avant le CMD:

```dockerfile
# Run migrations on startup
COPY --from=builder /app/packages/db/drizzle ./drizzle
CMD bun run drizzle-kit push && bun run dist/index.js
```

### Option B: Script séparé (recommandé pour production)

Créer un job de migration dans Dokploy ou exécuter manuellement:

```bash
# SSH sur le serveur ou via Dokploy terminal
docker exec -it snippetvault-app bun run db:migrate
```

### Option C: GitHub Actions avant déploiement

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run migrations
        run: bun run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Dokploy webhook
        run: |
          curl -X POST "${{ secrets.DOKPLOY_WEBHOOK_URL }}"
```

---

## Variables d'environnement

### Développement (.env)

```env
# Database
DATABASE_URL=postgresql://snippetvault:snippetvault@localhost:5432/snippetvault

# Better Auth
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# App
NODE_ENV=development
PORT=3000
```

### Production (dans Dokploy)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Mode production |
| `PORT` | `3000` | Port interne (Traefik reverse proxy) |
| `DATABASE_URL` | `postgresql://...` | Connection string PostgreSQL |
| `BETTER_AUTH_SECRET` | (généré) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://snippetvault.domain.com` | URL publique |

---

## Health Check Endpoint

Ajouter dans `apps/api/src/routes/index.ts`:

```typescript
import { Hono } from 'hono'
// ... autres imports

export const app = new Hono()
  // Health check pour Docker/Dokploy
  .get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))
  .route('/auth', authRoute)
  .route('/snippets', snippetsRoute)
  // ...
```

---

## Scripts package.json (root)

```json
{
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:api": "bun run --filter @snippetvault/api dev",
    "dev:web": "bun run --filter @snippetvault/web dev",
    "build": "bun run build:packages && bun run build:apps",
    "build:packages": "bun run --filter './packages/*' build",
    "build:apps": "bun run --filter './apps/*' build",
    "db:generate": "bun run --filter @snippetvault/db generate",
    "db:migrate": "bun run --filter @snippetvault/db migrate",
    "db:push": "bun run --filter @snippetvault/db push",
    "db:seed": "bun run --filter @snippetvault/db seed",
    "db:studio": "bun run --filter @snippetvault/db studio",
    "typecheck": "bun run --filter '*' typecheck",
    "lint": "bun run --filter '*' lint",
    "docker:build": "docker build -t snippetvault .",
    "docker:run": "docker run -p 3000:3000 --env-file .env.prod snippetvault"
  }
}
```

---

## Workflow de déploiement avec Dokploy

```
1. Push sur main (GitHub)
      ↓
2. Webhook Dokploy déclenché
      ↓
3. Dokploy pull le repo
      ↓
4. Build Docker image
   - Build packages (db)
   - Build frontend (React → dist/)
   - Build backend (Hono → dist/)
   - Copy frontend to api/public/
      ↓
5. Rolling update du service
      ↓
6. Health check
      ↓
7. ✅ Live sur https://snippetvault.domain.com
```

---

## Commandes utiles

```bash
# Développement local
docker compose up -d              # Démarrer PostgreSQL local
bun run dev                       # Démarrer API + Web en parallèle

# Database
bun run db:generate               # Générer les migrations
bun run db:push                   # Push schema (dev)
bun run db:migrate                # Appliquer les migrations (prod)
bun run db:studio                 # Ouvrir Drizzle Studio

# Docker local
bun run docker:build              # Build l'image
bun run docker:run                # Run localement

# Sur le serveur (via SSH ou Dokploy terminal)
docker logs snippetvault-app -f   # Voir les logs
docker exec -it snippetvault-app sh  # Shell dans le container
```

---

## Backup PostgreSQL

### Script de backup automatique

Créer un cron job sur le VPS:

```bash
#!/bin/bash
# /opt/scripts/backup-snippetvault.sh

BACKUP_DIR="/opt/backups/snippetvault"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER="snippetvault-db"

mkdir -p $BACKUP_DIR

# Dump
docker exec $CONTAINER pg_dump -U snippetvault snippetvault | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Garder les 7 derniers backups
ls -t $BACKUP_DIR/*.sql.gz | tail -n +8 | xargs -r rm
```

Crontab:
```bash
# Backup quotidien à 3h du matin
0 3 * * * /opt/scripts/backup-snippetvault.sh
```

---

## Checklist avant production

- [ ] PostgreSQL créé dans Dokploy
- [ ] Variables d'environnement configurées
- [ ] `BETTER_AUTH_SECRET` généré (`openssl rand -base64 32`)
- [ ] Domaine configuré avec SSL
- [ ] Health check endpoint ajouté (`/api/health`)
- [ ] Webhook Dokploy connecté au repo Git
- [ ] Migrations exécutées
- [ ] Backup PostgreSQL configuré
- [ ] Logs accessibles via Dokploy
