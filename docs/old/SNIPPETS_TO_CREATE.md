# 10 Public Snippets for SnippetVault Profile

## 1. Bun + Hono API Starter ⚡

**Description:** Lightning-fast REST API built with Bun runtime and Hono framework. 3x faster than Node.js. Includes CRUD routes, JWT auth, Zod validation, and error handling. Same stack powering SnippetVault in production.  
**Tags:** `bun`, `hono`, `api`, `typescript`, `jwt`  
**Setup Time:** 10 minutes

### Files:

#### `src/index.ts`

```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { usersRoute } from "./routes/users";
import { authRoute } from "./routes/auth";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

// Global error handler
app.onError(errorHandler);

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: Date.now(),
    bun: Bun.version,
  });
});

// Routes
app.route("/api/auth", authRoute);
app.route("/api/users", usersRoute);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};

export type AppType = typeof app;
```

#### `src/routes/users.ts`

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth";
import { NotFoundError } from "../lib/errors";

const app = new Hono();

// Mock database
const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

// Schemas
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// GET /api/users
app.get("/", authMiddleware, (c) => {
  return c.json({ users });
});

// GET /api/users/:id
app.get("/:id", authMiddleware, (c) => {
  const id = c.req.param("id");
  const user = users.find((u) => u.id === id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return c.json({ user });
});

// POST /api/users
app.post("/", authMiddleware, zValidator("json", createUserSchema), (c) => {
  const data = c.req.valid("json");
  const newUser = {
    id: String(users.length + 1),
    ...data,
  };
  users.push(newUser);

  return c.json({ user: newUser }, 201);
});

export { app as usersRoute };
```

#### `src/routes/auth.ts`

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sign } from "hono/jwt";
import { UnauthorizedError } from "../lib/errors";

const app = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  // Mock auth - replace with real database check
  if (email === "user@example.com" && password === "password123") {
    const token = await sign(
      {
        sub: "1",
        email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      process.env.JWT_SECRET || "your-secret-key"
    );

    return c.json({ token });
  }

  throw new UnauthorizedError("Invalid credentials");
});

export { app as authRoute };
```

#### `src/middleware/auth.ts`

```typescript
import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { UnauthorizedError } from "../lib/errors";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid token");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    c.set("user", payload);
    await next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
```

#### `src/middleware/error-handler.ts`

```typescript
import { Context } from "hono";
import { AppError } from "../lib/errors";

export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  if (err instanceof AppError && err.isOperational) {
    return c.json({ error: err.message }, err.statusCode);
  }

  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Internal server error" }, 500);
  }

  return c.json({ error: err.message, stack: err.stack }, 500);
}
```

#### `src/lib/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}
```

#### `package.json`

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "zod": "^3.22.0",
    "@hono/zod-validator": "^0.2.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

#### `.env.example`

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://user:pass@localhost:5432/{{PROJECT_NAME}}
```

#### `Dockerfile`

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json .

USER bun
EXPOSE 3000/tcp
CMD ["bun", "run", "src/index.ts"]
```

#### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: {{PROJECT_NAME}}-db
    environment:
      POSTGRES_DB: {{PROJECT_NAME}}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

#### `.dockerignore`

```
node_modules
.git
.env
.env.local
*.md
.vscode
.idea
.DS_Store
```

### Variables:

- `{{PROJECT_NAME}}` = "my-api"

### Instructions:

1. **Start PostgreSQL:**

   ```bash
   docker compose up -d
   ```

2. **Install Bun** (if not already installed):

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Setup Project:**

   ```bash
   bun install
   cp .env.example .env
   ```

4. **Update `.env` file:**

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{PROJECT_NAME}}
   JWT_SECRET=your-secret-key-min-32-chars
   ```

5. **Start development server:**

   ```bash
   bun run dev
   ```

6. **Test the API:**

```bash
   # Health check
   curl http://localhost:3000/health

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'

   # Get users (requires token)
   curl http://localhost:3000/api/users \
     -H "Authorization: Bearer YOUR_TOKEN"
```

### Variables:

- `{{PROJECT_NAME}}` = "my-api"

**Why Bun + Hono:**

- 🚀 3-4x faster than Node.js + Express
- 📦 Built-in TypeScript support
- 🎯 Lightweight and modern
- 🐘 PostgreSQL included via Docker Compose
- ✅ Production-proven (powers SnippetVault)

---

## 2. TypeScript Strict Configuration 📘

**Description:** Battle-tested tsconfig.json with strict mode, path aliases (@/ imports), and optimal compiler settings. Includes separate config for Node tooling. Works with any TypeScript project.  
**Tags:** `typescript`, `config`, `tooling`, `strict-mode`  
**Setup Time:** 2 minutes

### Files:

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

#### `tsconfig.node.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

### Variables:

None (copy-paste ready)

### Instructions:

1. Copy `tsconfig.json` to your project root
2. Copy `tsconfig.node.json` if using Vite or other Node.js tooling
3. Install TypeScript:
   ```bash
   **Why Bun + Hono:**
   ```

- 🚀 3-4x faster than Node.js + Express
- 📦 Built-in TypeScript support
- 🎯 Lightweight and modern
- 🐘 PostgreSQL included via Docker Composeths` if needed for your project structure

5. Run type checking:
   ```bash
   npx tsc --noEmit
   ```

**Note:** The `paths` configuration enables clean imports like `@/components/Button` instead of `../../components/Button`.

---

## 3. ESLint + Prettier Code Quality Setup ✨

**Description:** Complete linting and formatting configuration with TypeScript support. Includes ESLint, Prettier, and EditorConfig for consistent code style across your team. Catches bugs before runtime.  
**Tags:** `eslint`, `prettier`, `code-quality`, `typescript`, `formatting`  
**Setup Time:** 2 minutes

### Files:

#### `.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

#### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### `.prettierignore`

```
node_modules
dist
build
coverage
.next
.cache
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
bun.lockb
```

#### `.editorconfig`

````ini
root = true

### Instructions:
1. Copy all config files to your project root
2. Install required dependencies:
   ```bash
   npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
````

3. Add scripts to your `package.json`:
   ```json
   {
     "scripts": {
       "lint": "eslint . --ext .ts,.tsx",
       "lint:fix": "eslint . --ext .ts,.tsx --fix",
       "format": "prettier --write ."
     }
   }
   ```
4. Run linting:
   ```bash
   npm run lint
   ```
5. Run formatting:
   ```bash
   npm run format
   ```

**Pro tip:** Install the ESLint and Prettier extensions in VS Code for automatic formatting on save.

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

````

### Variables:
None (copy-paste ready)

---

## 4. Type-Safe Environment Variables with Zod 🔧

**Description:** Never deploy with missing env vars again. Validates environment variables at startup with Zod schema. Full TypeScript types, runtime validation, and helpful error messages. Catches config issues before production.
**Tags:** `environment`, `config`, `zod`, `typescript`, `validation`
**Setup Time:** 10 minutes

### Files:

#### `.env.example`
```env
# Application
NODE_ENV=development
PORT={{PORT}}
APP_URL=http://localhost:{{PORT}}

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/{{PROJECT_NAME}}

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# External Services (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# Feature Flags
ENABLE_SIGNUP=true
ENABLE_OAUTH=false
````

#### `src/config/env.ts`

````typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  APP_URL: z.string().url(),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),

  ENABLE_SIGNUP: z.string().transform((val) => val === "true").default("true"),
  ENABLE_OAUTH: z.string().transform((val) => val === "true").default("false"),
### Instructions:
1. Copy `.env.example` to your project root and rename to `.env`
2. Copy `src/config/env.ts` to your project
3. Install Zod for validation:
   ```bash
   npm install zod
````

4. Fill in your actual values in `.env` file
5. Import and use in your app:

   ```typescript
   import { env } from "./config/env";

   const port = env.PORT; // Type-safe, validated!
   ```

6. Add `.env` to your `.gitignore`
7. Commit `.env.example` to version control

**Security tip:** Never commit `.env` files with real credentials. Always use `.env.example` with placeholder values.

});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
console.error("❌ Invalid environment variables:");
console.error(JSON.stringify(parsed.error.format(), null, 2));
process.exit(1);
}

return parsed.data;
}

export const env = loadEnv();

// Type-safe access
// import { env } from "@/config/env";
// const port = env.PORT; // number, validated

````

### Variables:
- `{{PROJECT_NAME}}` = "my-app"
- `{{PORT}}` = "3000"

---

## 5. Production Error Handling for APIs ⚠️

**Description:** Stop leaking stack traces in production. Custom error classes with proper status codes, centralized error middleware for Express/Hono. Handles validation, auth, and unexpected errors gracefully.
**Tags:** `error-handling`, `middleware`, `api`, `express`, `hono`
**Setup Time:** 15 minutes

### Files:

#### `src/lib/errors.ts`
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    public errors?: Record<string, string[]>
  ) {
    super(422, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message, false);
  }
}
````

#### `src/middleware/error-handler.ts` (Hono)

````typescript
import { Context } from "hono";
import { AppError } from "@/lib/errors";

export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  // Operational errors (known)
  if (err instanceof AppError && err.isOperational) {
    return c.json(
      {
        error: err.message,
        ...(err instanceof ValidationError && err.errors
          ? { errors: err.errors }
          : {}),
      },
      err.statusCode
    );
  }

  // Programming errors (unknown) - don't leak details in production
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Internal server error" }, 500);
  }

  // Development - return full error
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    },
    500
  );
}

// Usage in Hono app:
### Instructions:
1. Copy `src/lib/errors.ts` to your project
2. Copy the appropriate middleware file (Hono or Express)
3. Add to your app setup:

   **For Hono:**
   ```typescript
   import { Hono } from "hono";
   import { errorHandler } from "./middleware/error-handler";

   const app = new Hono();
   app.onError(errorHandler);
````

**For Express:**

```typescript
import express from "express";
import { errorHandler } from "./middleware/error-handler-express";

const app = express();
// ... other middleware
app.use(errorHandler); // MUST be last
```

4. Use error classes in your routes:

   ```typescript
   import { NotFoundError, BadRequestError } from "./lib/errors";

   if (!user) {
     throw new NotFoundError("User not found");
   }
   ```

**Note:** The error handler automatically formats responses based on environment (dev vs production).

// app.onError(errorHandler);

````

#### `src/middleware/error-handler-express.ts` (Express)
```typescript
import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "@/lib/errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Operational errors (known)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError && err.errors
        ? { errors: err.errors }
        : {}),
    });
  }

  // Programming errors (unknown)
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "Internal server error" });
  }

  // Development
  return res.status(500).json({
    error: "Internal server error",
    message: err.message,
    stack: err.stack,
  });
}

// Usage in Express app:
// app.use(errorHandler);
````

### Variables:

None (copy-paste ready)

---

## 6. API Health Check Endpoint 💚

**Description:** Production-ready /health endpoint with database connectivity check, memory usage, uptime stats. Perfect for Docker health checks, Kubernetes probes, and monitoring services like UptimeRobot.  
**Tags:** `health-check`, `monitoring`, `kubernetes`, `docker`, `observability`  
**Setup Time:** 5 minutes

### Files:

#### `src/routes/health.ts` (Hono)

```typescript
import { Hono } from "hono";
import { db } from "@/lib/database";

const app = new Hono();

app.get("/", async (c) => {
  const startTime = Date.now();

  // Check database connection
  let dbStatus = "unhealthy";
  try {
    await db.execute("SELECT 1");
    dbStatus = "healthy";
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const health = {
    status: dbStatus === "healthy" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    environment: process.env.NODE_ENV || "development",
    responseTime: `${Date.now() - startTime}ms`,
    checks: {
      database: dbStatus,
    },
    system: {
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      },
      node: process.version,
    },
  };

  const statusCode = health.status === "ok" ? 200 : 503;
  return c.json(health, statusCode);
});

export default app;

// Usage:
// app.route("/health", healthRoute);
```

### Instructions:

1. Copy the appropriate route file (Hono or Express)
2. Replace `@/lib/database` with your actual database import
3. Add route to your app:

   **For Hono:**

   ```typescript
   import healthRoute from "./routes/health";

   app.route("/health", healthRoute);
   ```

   **For Express:**

   ```typescript
   import healthRouter from "./routes/health-express";

   app.use("/health", healthRouter);
   ```

4. Test the endpoint:

   ```bash
   curl http://localhost:3000/health
   ```

5. Use for Docker health checks or monitoring services

**Docker example:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f http://localhost:3000/health || exit 1
```

#### `src/routes/health-express.ts` (Express)

```typescript
import { Router } from "express";
import { db } from "@/lib/database";

const router = Router();

router.get("/", async (req, res) => {
  const startTime = Date.now();

  // Check database connection
  let dbStatus = "unhealthy";
  try {
    await db.execute("SELECT 1");
    dbStatus = "healthy";
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const health = {
    status: dbStatus === "healthy" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    environment: process.env.NODE_ENV || "development",
    responseTime: `${Date.now() - startTime}ms`,
    checks: {
      database: dbStatus,
    },
    system: {
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      },
      node: process.version,
    },
  };

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;

// Usage:
// app.use("/health", healthRouter);
```

### Variables:

None (copy-paste ready)

---

## 7. API Security Middleware (CORS + Headers) 🛡️

**Description:** Essential security setup for public APIs. Configurable CORS, security headers (Helmet), and rate limiting to prevent abuse. Works with Express and Hono. Production-ready defaults included.  
**Tags:** `security`, `cors`, `rate-limiting`, `helmet`, `api`  
**Setup Time:** 10 minutes

### Files:

#### `src/middleware/security.ts` (Hono)

````typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";

export function setupSecurity(app: Hono) {
  // CORS
  app.use(
    "/*",
    cors({
      origin: process.env.NODE_ENV === "production"
        ? ["{{FRONTEND_URL}}"]
        : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400, // 24 hours
### Instructions:
1. Copy the appropriate security file (Hono or Express)
2. Install required packages:

   **For Hono:**
   ```bash
   npm install hono hono-rate-limiter
````

**For Express:**

```bash
npm install cors helmet express-rate-limit
npm install -D @types/cors
```

3. Update `{{FRONTEND_URL}}` with your actual frontend URL
4. Apply middleware to your app:

   **For Hono:**

   ```typescript
   import { setupSecurity } from "./middleware/security";

   const app = new Hono();
   setupSecurity(app);
   ```

   **For Express:**

   ```typescript
   import { setupSecurity } from "./middleware/security-express";

   const app = express();
   setupSecurity(app);
   ```

**Note:** Adjust rate limits based on your API usage patterns. Production apps might need stricter limits.

    })

);

// Security headers
app.use("/\*", secureHeaders());

// Rate limiting
app.use(
"/_",
rateLimiter({
windowMs: 15 _ 60 \* 1000, // 15 minutes
limit: 100, // Max 100 requests per windowMs
standardHeaders: "draft-7",
keyGenerator: (c) => c.req.header("x-forwarded-for") || "anonymous",
})
);

return app;
}

````

#### `src/middleware/security-express.ts` (Express)
```typescript
import { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export function setupSecurity(app: Express) {
  // CORS
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["{{FRONTEND_URL}}"]
          : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400, // 24 hours
    })
  );

  // Security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
### Instructions:
1. Copy all schema files to `src/schema/`
2. Copy `drizzle.config.ts` to project root
3. Install Drizzle ORM:
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit
````

4. Set `DATABASE_URL` in your `.env` file
5. Generate migrations:
   ```bash
   npx drizzle-kit generate
   ```
6. Apply migrations:
   ```bash
   npx drizzle-kit migrate
   ```
7. Use in your code:

   ```typescript
   import { db } from "./db";
   import { users } from "./schema/users";

   const allUsers = await db.select().from(users);
   ```

**Pro tip:** Run `npx drizzle-kit studio` to open a visual database browser.

    message: "Too many requests, please try again later",

});

app.use(limiter);

return app;
}

// Usage:
// setupSecurity(app);

````

### Variables:
- `{{FRONTEND_URL}}` = "https://example.com"

---

## 8. Drizzle ORM Schema Starter 🗄️

**Description:** Type-safe PostgreSQL schema with Drizzle ORM. Includes users and posts tables with relations, timestamps, and proper indexes. Full TypeScript inference - your database types are auto-generated from schema.
**Tags:** `drizzle`, `postgres`, `orm`, `typescript`, `database`
**Setup Time:** 10 minutes

### Files:

#### `src/schema/users.ts`
```typescript
import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
````

#### `src/schema/posts.ts`

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

#### `src/schema/index.ts`

```typescript
export * from "./users";
export * from "./posts";
```

#### `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Variables:

None (copy-paste ready)

---

## 9. React Form with Validation (Hook Form + Zod) 📝

**Description:** Type-safe React forms with client-side validation. Uses React Hook Form for performance and Zod for schema validation. Includes error handling, loading states, and accessible markup. Copy-paste ready login form example.  
**Tags:** `react`, `forms`, `validation`, `zod`, `react-hook-form`  
**Setup Time:** 15 minutes

### Files:

#### `src/components/login-form.tsx`

````typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // API call here
      console.log("Form data:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
### Instructions:
1. Copy component file to `src/components/`
2. Copy schema file to `src/schemas/`
3. Install required packages:
   ```bash
   npm install react-hook-form @hookform/resolvers zod
````

4. Import and use the form:

   ```typescript
   import { LoginForm } from "./components/login-form";

   function LoginPage() {
     return <LoginForm />;
   }
   ```

5. Customize styling to match your design system
6. Create additional forms by following the same pattern

**Pro tip:** Extract the form styles to a shared component for consistency across all forms.

        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          id="rememberMe"
          type="checkbox"
          {...register("rememberMe")}
          className="mr-2"
          disabled={isSubmitting}
        />
        <label htmlFor="rememberMe" className="text-sm">
          Remember me
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>

);
}

````

#### `src/schemas/auth.ts`
```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
````

### Variables:

None (copy-paste ready)

---

## 10. GitHub Actions for Bun Projects 🚀

**Description:** Lightning-fast CI/CD pipeline optimized for Bun runtime. 3x faster dependency installs than npm. Includes lint, typecheck, and test jobs with intelligent caching. Deploy with confidence using the same workflow as SnippetVault.  
**Tags:** `github-actions`, `ci-cd`, `bun`, `automation`, `typescript`  
**Setup Time:** 15 minutes

### Files:

#### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run linter
        run: bun run lint

      - name: Run type check
        run: bun run typecheck

      - name: Run tests
        run: bun test

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build
```

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - "v*.*.*"
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Deploy
        run: |
          echo "Add your deployment commands here"
          echo "Examples:"
          echo "  - Deploy to Fly.io: flyctl deploy"
          echo "  - Deploy to Railway: railway up"  
          echo "  - Push Docker image: docker push"
          echo "  - SSH deploy: scp dist/* user@server:/app"
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### Variables:

None (copy-paste ready)

### Instructions:

1. Copy workflow files to `.github/workflows/` in your repository
2. Ensure your `package.json` has these scripts:
   ```json
   {
     "scripts": {
       "lint": "eslint .",
       "typecheck": "tsc --noEmit",
       "test": "bun test",
       "build": "bun build src/index.ts --outdir dist --target bun"
     }
   }
   ```
3. Commit and push to GitHub
4. Workflows will run automatically on push/PR
5. For deployment:
   - Add deployment commands in `deploy.yml`
   - Add required secrets in GitHub Settings → Secrets → Actions
   - Examples: `DEPLOY_KEY`, `FLY_API_TOKEN`, `RAILWAY_TOKEN`

**Why Bun over Node.js:**

- ⚡ 3-10x faster `bun install` vs `npm ci`
- 🎯 Native TypeScript support (no compilation needed in dev)
- 📦 Smaller CI logs and faster feedback
- ✅ Drop-in replacement for npm/node commands

---

## 📋 Summary

**Description:** Automated testing and deployment pipeline for Node.js projects. Runs lint, typecheck, tests, and builds on every push/PR. Includes dependency caching for faster runs. Add your deployment script and ship with confidence.  
**Tags:** `github-actions`, `ci-cd`, `automation`, `testing`, `nodejs`  
**Setup Time:** 20 minutes

### Files:

#### `.github/workflows/ci.yml`

````yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
### Instructions:
1. Copy workflow files to `.github/workflows/` in your repository
2. Update `{{NODE_VERSION}}` to match your project
3. Ensure your `package.json` has these scripts:
   ```json
   {
     "scripts": {
       "lint": "eslint .",
       "typecheck": "tsc --noEmit",
       "test": "vitest run",
       "build": "vite build"
     }
   }
````

4. Commit and push to GitHub
5. Workflows will run automatically on push/PR
6. For deployment:
   - Add deployment commands in `deploy.yml`
   - Add required secrets in GitHub Settings → Secrets
   - Examples: SSH keys, API tokens, etc.

**Pro tip:** Start with just the CI workflow, then add deployment once you're confident everything works.

        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

typecheck:
name: Type Check
runs-on: ubuntu-latest
steps: - name: Checkout code
uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript
        run: npm run typecheck

test:
name: Test
runs-on: ubuntu-latest
steps: - name: Checkout code
uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

build:
name: Build
runs-on: ubuntu-latest
needs: [lint, typecheck, test]
steps: - name: Checkout code
uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

````

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: |
          echo "Add your deployment commands here"
          echo "Examples:"
          echo "  - SSH to server and restart"
          echo "  - Deploy to Vercel/Netlify"
          echo "  - Push Docker image"
          echo "  - Update Kubernetes manifests"
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
````

### Variables:

- `{{NODE_VERSION}}` = "20"

---

## 📋 Summary

| #   | Snippet               | Time   | Complexity | Use Case           |
| --- | --------------------- | ------ | ---------- | ------------------ |
| 1   | Docker Dev Setup      | 5 min  | ⭐⭐       | Local development  |
| 2   | TypeScript Config     | 2 min  | ⭐         | Any TS project     |
| 3   | ESLint + Prettier     | 2 min  | ⭐         | Code quality       |
| 4   | Environment Variables | 10 min | ⭐⭐       | Config management  |
| 5   | Error Handling        | 15 min | ⭐⭐       | API error handling |
| 6   | Health Check          | 5 min  | ⭐         | Monitoring         |
| 7   | CORS + Security       | 10 min | ⭐⭐       | API security       |
| 8   | Database Schema       | 10 min | ⭐⭐       | Drizzle setup      |
| 9   | React Hook Form       | 15 min | ⭐⭐       | Form validation    |
| 10  | GitHub Actions        | 20 min | ⭐⭐       | CI/CD pipeline     |

**Total setup time for all: ~1h 30min**

---

## 🎯 Next Steps

1. Create each snippet in your SnippetVault app
2. Make them all **public**
3. Add to your profile: `https://snippetvault.app/u/{{YOUR_USERNAME}}`
4. Share on Twitter/LinkedIn with examples

These snippets will:

- ✅ Show your expertise
- ✅ Actually help developers
- ✅ Drive traffic to your app
- ✅ Be immediately useful
