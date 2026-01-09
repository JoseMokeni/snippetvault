/**
 * Database seed script for development/testing
 * Creates sample users, snippets, tags, stars, and forks
 *
 * Usage: bun run seed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { nanoid } from "nanoid";
import * as schema from "@snippetvault/db/schema";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://snippetvault:snippetvault@localhost:5432/snippetvault";

// Sample users data
const sampleUsers = [
  { name: "Alice Chen", username: "alicechen", email: "alice@example.com" },
  { name: "Bob Martinez", username: "bobmartinez", email: "bob@example.com" },
  { name: "Carol Williams", username: "caroldev", email: "carol@example.com" },
  { name: "David Kim", username: "davidkim", email: "david@example.com" },
  { name: "Emma Johnson", username: "emmaj", email: "emma@example.com" },
  { name: "Frank Lee", username: "franklee", email: "frank@example.com" },
  { name: "Grace Park", username: "gracepark", email: "grace@example.com" },
  { name: "Henry Wilson", username: "henryw", email: "henry@example.com" },
  {
    name: "Isabella Garcia",
    username: "isabellag",
    email: "isabella@example.com",
  },
  { name: "James Brown", username: "jamesbrown", email: "james@example.com" },
];

// Sample snippet templates with realistic code
const snippetTemplates = [
  {
    title: "Docker Node.js Setup",
    description:
      "Production-ready Docker configuration for Node.js applications with multi-stage builds",
    language: "dockerfile",
    tags: ["docker", "nodejs", "devops"],
    files: [
      {
        filename: "Dockerfile",
        language: "dockerfile",
        content: `# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]`,
      },
      {
        filename: "docker-compose.yml",
        language: "yaml",
        content: `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`,
      },
      {
        filename: ".dockerignore",
        language: "plaintext",
        content: `node_modules
npm-debug.log
.git
.env
*.md`,
      },
    ],
    variables: [
      {
        name: "NODE_VERSION",
        defaultValue: "20",
        description: "Node.js version to use",
      },
      { name: "PORT", defaultValue: "3000", description: "Application port" },
    ],
  },
  {
    title: "React Custom Hook - useDebounce",
    description:
      "A reusable debounce hook for React applications with TypeScript support",
    language: "typescript",
    tags: ["react", "hooks", "typescript"],
    files: [
      {
        filename: "useDebounce.ts",
        language: "typescript",
        content: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
      },
      {
        filename: "useDebounce.test.ts",
        language: "typescript",
        content: `import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });
});`,
      },
    ],
    variables: [],
  },
  {
    title: "Express API Middleware Stack",
    description:
      "Essential middleware setup for Express.js APIs with security, logging, and error handling",
    language: "typescript",
    tags: ["express", "nodejs", "api", "middleware"],
    files: [
      {
        filename: "middleware.ts",
        language: "typescript",
        content: `import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

export function setupMiddleware(app: Express) {
  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Request logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }));
}

// Error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}`,
      },
    ],
    variables: [
      {
        name: "CORS_ORIGIN",
        defaultValue: "http://localhost:3000",
        description: "Allowed CORS origin",
      },
    ],
  },
  {
    title: "PostgreSQL Database Schema",
    description: "User authentication schema with sessions and audit logging",
    language: "sql",
    tags: ["postgresql", "database", "auth"],
    files: [
      {
        filename: "schema.sql",
        language: "sql",
        content: `-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);`,
      },
    ],
    variables: [],
  },
  {
    title: "GitHub Actions CI Pipeline",
    description:
      "Complete CI/CD pipeline with testing, linting, and deployment",
    language: "yaml",
    tags: ["github-actions", "ci-cd", "devops"],
    files: [
      {
        filename: "ci.yml",
        language: "yaml",
        content: `name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/`,
      },
    ],
    variables: [],
  },
  {
    title: "Python FastAPI CRUD",
    description:
      "FastAPI CRUD operations with SQLAlchemy and Pydantic validation",
    language: "python",
    tags: ["python", "fastapi", "api"],
    files: [
      {
        filename: "main.py",
        language: "python",
        content: `from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, Item as ItemModel

app = FastAPI(title="Items API")

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ItemResponse(ItemCreate):
    id: int

    class Config:
        from_attributes = True

@app.get("/items", response_model=List[ItemResponse])
def list_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(ItemModel).offset(skip).limit(limit).all()

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = ItemModel(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()`,
      },
    ],
    variables: [],
  },
  {
    title: "Tailwind Config with Custom Theme",
    description:
      "Extended Tailwind CSS configuration with custom colors, fonts, and animations",
    language: "javascript",
    tags: ["tailwind", "css", "frontend"],
    files: [
      {
        filename: "tailwind.config.js",
        language: "javascript",
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
        accent: '#00ff9f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};`,
      },
    ],
    variables: [],
  },
  {
    title: "ESLint + Prettier Config",
    description:
      "Modern ESLint and Prettier configuration for TypeScript projects",
    language: "json",
    tags: ["eslint", "prettier", "typescript", "config"],
    files: [
      {
        filename: ".eslintrc.json",
        language: "json",
        content: `{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "import"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": { "order": "asc" }
    }]
  }
}`,
      },
      {
        filename: ".prettierrc",
        language: "json",
        content: `{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}`,
      },
    ],
    variables: [],
  },
  {
    title: "Zustand Store with Persist",
    description: "Type-safe Zustand store with persistence and devtools",
    language: "typescript",
    tags: ["zustand", "react", "state-management"],
    files: [
      {
        filename: "store.ts",
        language: "typescript",
        content: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        login: (user, token) =>
          set({ user, token, isAuthenticated: true }, false, 'login'),

        logout: () =>
          set({ user: null, token: null, isAuthenticated: false }, false, 'logout'),

        updateUser: (updates) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...updates } : null,
            }),
            false,
            'updateUser'
          ),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, token: state.token }),
      }
    ),
    { name: 'AuthStore' }
  )
);`,
      },
    ],
    variables: [],
  },
  {
    title: "Next.js API Route Handler",
    description:
      "Type-safe Next.js 14 API route with validation and error handling",
    language: "typescript",
    tags: ["nextjs", "api", "typescript"],
    files: [
      {
        filename: "route.ts",
        language: "typescript",
        content: `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch items from database
    const items = await db.item.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ items, page, limit });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createItemSchema.parse(body);

    const item = await db.item.create({
      data: validated,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`,
      },
    ],
    variables: [],
  },
  {
    title: "Bash Deploy Script",
    description: "Automated deployment script with rollback capability",
    language: "bash",
    tags: ["bash", "devops", "deployment"],
    files: [
      {
        filename: "deploy.sh",
        language: "bash",
        content: `#!/bin/bash
set -euo pipefail

# Configuration
APP_NAME="myapp"
DEPLOY_DIR="/var/www/\${APP_NAME}"
BACKUP_DIR="/var/backups/\${APP_NAME}"
REPO_URL="git@github.com:user/repo.git"
BRANCH="\${1:-main}"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
NC='\\033[0m'

log() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
error() { echo -e "\${RED}[ERROR]\${NC} $1"; exit 1; }

# Create backup
backup() {
  log "Creating backup..."
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mkdir -p "\${BACKUP_DIR}"
  tar -czf "\${BACKUP_DIR}/backup_\${TIMESTAMP}.tar.gz" -C "\${DEPLOY_DIR}" . 2>/dev/null || true
  log "Backup created: backup_\${TIMESTAMP}.tar.gz"
}

# Rollback to previous version
rollback() {
  log "Rolling back to previous version..."
  LATEST_BACKUP=$(ls -t "\${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -1)
  if [[ -n "\${LATEST_BACKUP}" ]]; then
    rm -rf "\${DEPLOY_DIR:?}"/*
    tar -xzf "\${LATEST_BACKUP}" -C "\${DEPLOY_DIR}"
    log "Rollback complete"
  else
    error "No backup found for rollback"
  fi
}

# Deploy
deploy() {
  log "Starting deployment of branch: \${BRANCH}"

  backup

  cd "\${DEPLOY_DIR}"
  git fetch origin
  git checkout "\${BRANCH}"
  git pull origin "\${BRANCH}"

  log "Installing dependencies..."
  npm ci --production

  log "Building application..."
  npm run build

  log "Restarting service..."
  systemctl restart "\${APP_NAME}"

  log "Deployment complete!"
}

# Main
case "\${1:-deploy}" in
  rollback) rollback ;;
  *) deploy ;;
esac`,
      },
    ],
    variables: [
      {
        name: "APP_NAME",
        defaultValue: "myapp",
        description: "Application name",
      },
      {
        name: "DEPLOY_DIR",
        defaultValue: "/var/www/myapp",
        description: "Deployment directory",
      },
    ],
  },
  {
    title: "Rust HTTP Client",
    description: "Async HTTP client with retry logic using reqwest",
    language: "rust",
    tags: ["rust", "http", "async"],
    files: [
      {
        filename: "client.rs",
        language: "rust",
        content: `use reqwest::{Client, Response, StatusCode};
use serde::{de::DeserializeOwned, Serialize};
use std::time::Duration;
use tokio::time::sleep;

pub struct HttpClient {
    client: Client,
    base_url: String,
    max_retries: u32,
}

impl HttpClient {
    pub fn new(base_url: &str) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            base_url: base_url.to_string(),
            max_retries: 3,
        }
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T, ApiError> {
        let url = format!("{}{}", self.base_url, path);
        self.request_with_retry(|| self.client.get(&url)).await
    }

    pub async fn post<T: DeserializeOwned, B: Serialize>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T, ApiError> {
        let url = format!("{}{}", self.base_url, path);
        self.request_with_retry(|| self.client.post(&url).json(body))
            .await
    }

    async fn request_with_retry<T, F, Fut>(&self, request_fn: F) -> Result<T, ApiError>
    where
        T: DeserializeOwned,
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<Response, reqwest::Error>>,
    {
        let mut last_error = None;

        for attempt in 0..self.max_retries {
            match request_fn().await {
                Ok(response) if response.status().is_success() => {
                    return response.json().await.map_err(ApiError::Parse);
                }
                Ok(response) => {
                    last_error = Some(ApiError::Status(response.status()));
                }
                Err(e) => {
                    last_error = Some(ApiError::Request(e));
                }
            }

            if attempt < self.max_retries - 1 {
                sleep(Duration::from_millis(100 * 2u64.pow(attempt))).await;
            }
        }

        Err(last_error.unwrap())
    }
}

#[derive(Debug)]
pub enum ApiError {
    Request(reqwest::Error),
    Parse(reqwest::Error),
    Status(StatusCode),
}`,
      },
    ],
    variables: [],
  },
];

// Additional private snippets
const privateSnippets = [
  {
    title: "Internal API Keys Config",
    description: "Configuration template for internal services",
    language: "typescript",
    files: [
      {
        filename: "config.ts",
        language: "typescript",
        content: `export const config = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
};`,
      },
    ],
  },
  {
    title: "Personal Notes Template",
    description: "My meeting notes template",
    language: "markdown",
    files: [
      {
        filename: "notes.md",
        language: "markdown",
        content: `# Meeting Notes

## Date: {{DATE}}

## Attendees
-

## Agenda
1.

## Action Items
- [ ]

## Notes
`,
      },
    ],
  },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    await db.delete(schema.stars);
    await db.delete(schema.snippetsTags);
    await db.delete(schema.files);
    await db.delete(schema.variables);
    await db.delete(schema.tags);
    await db.delete(schema.snippets);
    await db.delete(schema.sessions);
    await db.delete(schema.accounts);
    await db.delete(schema.users);
    console.log("✅ Data cleared\n");

    // Create users
    console.log("👥 Creating users...");
    const createdUsers: { id: string; username: string }[] = [];

    for (const userData of sampleUsers) {
      const userId = nanoid();
      await db.insert(schema.users).values({
        id: userId,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        emailVerified: true,
      });
      createdUsers.push({ id: userId, username: userData.username });
      console.log(`  ✓ Created user: @${userData.username}`);
    }
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Create tags for each user
    console.log("🏷️  Creating tags...");
    const tagColors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const globalTags: { userId: string; tagId: string; name: string }[] = [];

    for (const user of createdUsers) {
      const userTags = [
        "docker",
        "react",
        "typescript",
        "nodejs",
        "api",
        "devops",
        "python",
        "database",
      ];
      for (let i = 0; i < userTags.length; i++) {
        const tagId = nanoid();
        await db.insert(schema.tags).values({
          id: tagId,
          userId: user.id,
          name: userTags[i],
          color: tagColors[i % tagColors.length],
        });
        globalTags.push({ userId: user.id, tagId, name: userTags[i] });
      }
    }
    console.log(`✅ Created ${globalTags.length} tags\n`);

    // Create snippets
    console.log("📝 Creating snippets...");
    const createdSnippets: {
      id: string;
      userId: string;
      isPublic: boolean;
      title: string;
    }[] = [];

    // Distribute public snippets among users
    for (let i = 0; i < snippetTemplates.length; i++) {
      const template = snippetTemplates[i];
      const user = createdUsers[i % createdUsers.length];
      const snippetId = nanoid();
      const slug = `${generateSlug(template.title)}-${snippetId.slice(0, 8)}`;

      await db.insert(schema.snippets).values({
        id: snippetId,
        userId: user.id,
        title: template.title,
        description: template.description,
        language: template.language,
        isPublic: true,
        slug,
        starCount: 0,
        forkCount: 0,
      });

      // Create files
      for (let j = 0; j < template.files.length; j++) {
        const file = template.files[j];
        await db.insert(schema.files).values({
          id: nanoid(),
          snippetId,
          filename: file.filename,
          content: file.content,
          language: file.language,
          order: j,
        });
      }

      // Create variables
      if (template.variables) {
        for (const variable of template.variables) {
          await db.insert(schema.variables).values({
            id: nanoid(),
            snippetId,
            name: variable.name,
            defaultValue: variable.defaultValue,
            description: variable.description,
          });
        }
      }

      // Associate tags
      const userTags = globalTags.filter((t) => t.userId === user.id);
      for (const tagName of template.tags) {
        const tag = userTags.find((t) => t.name === tagName);
        if (tag) {
          await db.insert(schema.snippetsTags).values({
            snippetId,
            tagId: tag.tagId,
          });
        }
      }

      createdSnippets.push({
        id: snippetId,
        userId: user.id,
        isPublic: true,
        title: template.title,
      });
      console.log(
        `  ✓ Created public snippet: "${template.title}" by @${user.username}`
      );
    }

    // Create some private snippets for each user
    for (const user of createdUsers.slice(0, 5)) {
      for (const template of privateSnippets) {
        const snippetId = nanoid();
        await db.insert(schema.snippets).values({
          id: snippetId,
          userId: user.id,
          title: `${template.title} (${user.username})`,
          description: template.description,
          language: template.language,
          isPublic: false,
          starCount: 0,
          forkCount: 0,
        });

        for (let j = 0; j < template.files.length; j++) {
          const file = template.files[j];
          await db.insert(schema.files).values({
            id: nanoid(),
            snippetId,
            filename: file.filename,
            content: file.content,
            language: file.language,
            order: j,
          });
        }

        createdSnippets.push({
          id: snippetId,
          userId: user.id,
          isPublic: false,
          title: template.title,
        });
      }
      console.log(`  ✓ Created private snippets for @${user.username}`);
    }
    console.log(`✅ Created ${createdSnippets.length} snippets\n`);

    // Create stars (users starring each other's public snippets)
    console.log("⭐ Creating stars...");
    const publicSnippets = createdSnippets.filter((s) => s.isPublic);
    let starCount = 0;

    for (const snippet of publicSnippets) {
      // Random users star each snippet (excluding the owner)
      const otherUsers = createdUsers.filter((u) => u.id !== snippet.userId);
      const numStars = Math.floor(Math.random() * 6) + 1; // 1-6 stars per snippet
      const starringUsers = otherUsers
        .sort(() => Math.random() - 0.5)
        .slice(0, numStars);

      for (const user of starringUsers) {
        await db.insert(schema.stars).values({
          userId: user.id,
          snippetId: snippet.id,
        });
        starCount++;
      }

      // Update snippet star count
      await db
        .update(schema.snippets)
        .set({ starCount: starringUsers.length })
        .where(eq(schema.snippets.id, snippet.id));
    }
    console.log(`✅ Created ${starCount} stars\n`);

    // Create forks
    console.log("🍴 Creating forks...");
    let forkCount = 0;

    // Fork some popular snippets
    const snippetsToFork = publicSnippets.slice(0, 5);
    for (const original of snippetsToFork) {
      const otherUsers = createdUsers.filter((u) => u.id !== original.userId);
      const forkingUser =
        otherUsers[Math.floor(Math.random() * otherUsers.length)];

      const forkId = nanoid();
      const forkSlug = `${generateSlug(original.title)}-fork-${forkId.slice(
        0,
        8
      )}`;

      await db.insert(schema.snippets).values({
        id: forkId,
        userId: forkingUser.id,
        title: original.title,
        description: `Forked from @${
          createdUsers.find((u) => u.id === original.userId)?.username
        }`,
        language: publicSnippets
          .find((s) => s.id === original.id)
          ?.title.includes("Docker")
          ? "dockerfile"
          : "typescript",
        isPublic: true,
        slug: forkSlug,
        forkedFromId: original.id,
        starCount: 0,
        forkCount: 0,
      });

      // Copy files from original
      const originalFiles = await db.query.files.findMany({
        where: eq(schema.files.snippetId, original.id),
      });

      for (const file of originalFiles) {
        await db.insert(schema.files).values({
          id: nanoid(),
          snippetId: forkId,
          filename: file.filename,
          content: file.content,
          language: file.language,
          order: file.order,
        });
      }

      // Update original's fork count
      await db
        .update(schema.snippets)
        .set({ forkCount: 1 })
        .where(eq(schema.snippets.id, original.id));

      forkCount++;
      console.log(`  ✓ @${forkingUser.username} forked "${original.title}"`);
    }
    console.log(`✅ Created ${forkCount} forks\n`);

    console.log("🎉 Database seeding complete!");
    console.log("\n📊 Summary:");
    console.log(`   • ${createdUsers.length} users`);
    console.log(
      `   • ${createdSnippets.length} snippets (${publicSnippets.length} public)`
    );
    console.log(`   • ${starCount} stars`);
    console.log(`   • ${forkCount} forks`);
    console.log(`   • ${globalTags.length} tags`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
