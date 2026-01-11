# Architecture & Technical Decisions

SnippetVault is a multi-file snippet manager with variable templating. Built for speed, type safety, and developer experience.

---

## Tech Stack

| Layer        | Choice            | Why                                                               |
| ------------ | ----------------- | ----------------------------------------------------------------- |
| **Runtime**  | Bun               | 3-4x faster than Node.js, built-in TypeScript, all-in-one tooling |
| **Backend**  | Hono              | End-to-end type safety with RPC, ultra-fast, lightweight          |
| **Database** | PostgreSQL (Neon) | Serverless, auto-backups, branching, generous free tier           |
| **ORM**      | Drizzle           | Type-safe, minimal overhead, SQL-like API                         |
| **Frontend** | React + Vite      | Industry standard, instant HMR, huge ecosystem                    |
| **Router**   | TanStack Router   | Type-safe routing, file-based, search params support              |
| **State**    | TanStack Query    | Server state caching, auto-refetch, optimistic updates            |
| **Auth**     | Better Auth       | Framework-agnostic, email/password + GitHub OAuth                 |
| **Styling**  | Tailwind CSS      | Utility-first, custom "Terminal Brutalism" theme                  |
| **Hosting**  | Dokploy           | Self-hosted, Docker-native, automatic SSL, ~$5-10/month           |

---

## Key Decisions & Trade-offs

### 1. Bun over Node.js

**Gain**: 3-4x faster, simpler toolchain, native TypeScript  
**Cost**: Smaller ecosystem, potential compatibility issues  
**Worth it?**: ✅ Yes

### 2. Hono RPC over REST

**Gain**: End-to-end type safety, compile-time guarantees  
**Cost**: Frontend coupled to backend  
**Worth it?**: ✅ Yes - prevents entire classes of bugs

### 3. Monorepo

**Gain**: Shared types, atomic changes, easier refactors  
**Cost**: Larger repo, all-or-nothing deploys  
**Worth it?**: ✅ Yes - type sharing is critical

### 4. Neon over Self-hosted PostgreSQL

**Gain**: Zero maintenance, auto-backups, branching, free tier  
**Cost**: Potential vendor lock-in, costs at scale  
**Worth it?**: ✅ Yes - free now, saves maintenance time

### 5. Files in Database over S3

**Gain**: Simpler architecture, atomic transactions, full-text search  
**Cost**: Database size growth  
**Worth it?**: ✅ Yes for now - will migrate to S3 if files exceed 100KB average

### 6. Dokploy over Managed Platforms

**Gain**: Full control, 75% cost savings (~$5 vs $20/month)  
**Cost**: Manual VPS management  
**Worth it?**: ✅ Yes

---

## Architecture Patterns

### Monorepo Structure

```
snippetvault/
├── apps/
│   ├── api/          # Hono backend
│   └── web/          # React frontend
└── packages/
    └── db/           # Shared Drizzle schema
```

### API Design: Hono RPC

```typescript
// Backend exports types
export const app = new Hono().route("/snippets", snippetsRoute);
export type AppType = typeof app;

// Frontend imports types
import type { AppType } from "@snippetvault/api";
const client = hc<AppType>("/api");

// Fully typed API calls
const snippets = await client.snippets.$get();
```

**Why**: Compile-time type safety, autocomplete, refactor-safe

### Database

- Normalized relational schema with foreign keys
- Indexes on common queries
- File content stored as TEXT in PostgreSQL
- Will migrate to S3 if files exceed 100KB average

---

## Security

- **Auth**: Bcrypt passwords, HTTP-only cookies, GitHub OAuth
- **SQL Injection**: Prevented by Drizzle's parameterized queries
- **XSS**: React auto-escaping + CSP headers
- **HTTPS**: Enforced via Traefik with Let's Encrypt

---

## Performance Targets

| Metric                 | Target |
| ---------------------- | ------ |
| First Contentful Paint | <1s    |
| Time to Interactive    | <2s    |
| API Response (p95)     | <100ms |
| Lighthouse Score       | >90    |

---

## Lessons Learned

**What worked**:

- ✅ Bun delivered on performance promises
- ✅ Hono RPC eliminated API contract bugs
- ✅ Monorepo made refactors trivial
- ✅ Dokploy + Neon = production-ready for $5-10/month

**What could be improved**:

- ⚠️ Should have added monitoring from day one
- ⚠️ File storage might need S3 sooner than expected

---

**References**: [AGENTS.md](../../AGENTS.md) • [CI_CD.md](../../.github/CI_CD.md) • [Bun](https://bun.sh) • [Hono](https://hono.dev) • [Drizzle](https://orm.drizzle.team)

**Last updated**: January 11, 2026
