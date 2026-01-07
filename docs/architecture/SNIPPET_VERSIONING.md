# Snippet Versioning - Architecture Document

> **Version**: 1.0
> **Status**: Proposed
> **Author**: Architecture Team
> **Last Updated**: 2026-01-07

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Data Architecture](#data-architecture)
5. [API Design](#api-design)
6. [UI/UX Design](#uiux-design)
7. [Storage Strategy](#storage-strategy)
8. [Diff Algorithm](#diff-algorithm)
9. [Implementation Phases](#implementation-phases)
10. [Performance Considerations](#performance-considerations)
11. [Migration Strategy](#migration-strategy)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

Snippet Versioning introduces Git-like version control for code snippets in SnippetVault. Users can track changes over time, view history, compare versions, and restore previous states. This feature differentiates SnippetVault from competitors like GitHub Gist by providing built-in, user-friendly version management.

### Why Versioning?

- **Code evolves**: Snippets are updated, refined, and improved over time
- **Safety net**: Accidentally deleted code can be recovered
- **Learning tool**: See how a snippet evolved from simple to complex
- **Collaboration ready**: Foundation for future merge/conflict resolution
- **Audit trail**: Know what changed, when, and why

---

## Goals & Non-Goals

### Goals

- Track every edit to snippet files as a new version
- View complete history with timestamps and change summaries
- Compare any two versions side-by-side with diff highlighting
- Restore previous versions with one click
- Minimal storage overhead using delta compression
- Intuitive UI that doesn't require Git knowledge
- API support for programmatic version access

### Non-Goals

- Full Git compatibility (branches, merges, rebases)
- Real-time collaboration/CRDT (future feature)
- Version control for variables/tags (track files only)
- Unlimited history retention (implement cleanup policies)
- Binary file versioning (code only)

---

## User Stories

### Core User Stories

```
As a developer, I want to:

1. See the edit history of my snippet
   "Show me all versions of this Docker Compose file"

2. View what changed between versions
   "What did I modify last week?"

3. Restore a previous version
   "The new version broke something, let me go back"

4. Compare two specific versions
   "Show me the difference between v1 and v5"

5. Add a note explaining my changes
   "Document why I made this optimization"

6. Know when a snippet was last modified
   "When did I update this API middleware?"
```

### Edge Cases

```
As a developer, I also need to:

1. Handle large snippets efficiently
   "My snippet has 10 files, don't store 10 copies"

2. Version new files added to snippets
   "I added a test file, track it too"

3. Handle deleted files
   "Show that I removed the config file in v3"

4. See file renames
   "I renamed utils.ts to helpers.ts"
```

---

## Data Architecture

### Database Schema

```sql
-- ============================================
-- SNIPPET VERSIONS TABLE
-- ============================================
-- Stores metadata for each version
-- Does NOT store full content (see snippet_version_files)

CREATE TABLE snippet_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    -- Metadata
    message TEXT,                              -- Optional commit-like message
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),      -- For future collaboration

    -- Change summary (computed on save)
    files_added INTEGER DEFAULT 0,
    files_modified INTEGER DEFAULT 0,
    files_deleted INTEGER DEFAULT 0,
    lines_added INTEGER DEFAULT 0,
    lines_removed INTEGER DEFAULT 0,

    -- Constraints
    UNIQUE(snippet_id, version_number)
);

CREATE INDEX idx_versions_snippet ON snippet_versions(snippet_id);
CREATE INDEX idx_versions_created ON snippet_versions(created_at DESC);

-- ============================================
-- VERSION FILES TABLE
-- ============================================
-- Stores file states for each version
-- Uses content-addressable storage for deduplication

CREATE TABLE snippet_version_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES snippet_versions(id) ON DELETE CASCADE,

    -- File identification
    file_id UUID REFERENCES files(id),         -- Original file (NULL if deleted)
    filename TEXT NOT NULL,
    language TEXT NOT NULL,
    file_order INTEGER NOT NULL,

    -- Content storage (content-addressable)
    content_hash TEXT NOT NULL,                -- SHA-256 of content

    -- Change tracking
    change_type TEXT NOT NULL,                 -- 'added', 'modified', 'deleted', 'unchanged', 'renamed'
    previous_filename TEXT,                    -- For renames

    -- Diff data (optional, for quick display)
    diff_summary JSONB                         -- {added: 5, removed: 3, hunks: [...]}
);

CREATE INDEX idx_version_files_version ON snippet_version_files(version_id);
CREATE INDEX idx_version_files_hash ON snippet_version_files(content_hash);

-- ============================================
-- CONTENT STORE TABLE
-- ============================================
-- Content-addressable storage for file contents
-- Shared across all versions for deduplication

CREATE TABLE content_store (
    hash TEXT PRIMARY KEY,                     -- SHA-256 hash
    content TEXT NOT NULL,                     -- Actual file content
    size INTEGER NOT NULL,                     -- Content size in bytes
    created_at TIMESTAMP DEFAULT NOW(),
    reference_count INTEGER DEFAULT 1          -- For garbage collection
);

CREATE INDEX idx_content_size ON content_store(size);
```

### Drizzle Schema

```typescript
// packages/db/src/schema/versions.ts

import { pgTable, uuid, integer, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { snippets } from './snippets';
import { files } from './files';
import { users } from './users';

// ============================================
// Snippet Versions
// ============================================

export const snippetVersions = pgTable('snippet_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  snippetId: uuid('snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),

  // Metadata
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),

  // Change summary
  filesAdded: integer('files_added').default(0),
  filesModified: integer('files_modified').default(0),
  filesDeleted: integer('files_deleted').default(0),
  linesAdded: integer('lines_added').default(0),
  linesRemoved: integer('lines_removed').default(0),
}, (table) => ({
  snippetVersionUnique: uniqueIndex('idx_snippet_version').on(table.snippetId, table.versionNumber),
  snippetIdx: index('idx_versions_snippet').on(table.snippetId),
  createdIdx: index('idx_versions_created').on(table.createdAt),
}));

export const snippetVersionsRelations = relations(snippetVersions, ({ one, many }) => ({
  snippet: one(snippets, {
    fields: [snippetVersions.snippetId],
    references: [snippets.id],
  }),
  createdByUser: one(users, {
    fields: [snippetVersions.createdBy],
    references: [users.id],
  }),
  files: many(snippetVersionFiles),
}));

// ============================================
// Version Files
// ============================================

export const snippetVersionFiles = pgTable('snippet_version_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => snippetVersions.id, { onDelete: 'cascade' }),

  // File identification
  fileId: uuid('file_id').references(() => files.id),
  filename: text('filename').notNull(),
  language: text('language').notNull(),
  fileOrder: integer('file_order').notNull(),

  // Content storage
  contentHash: text('content_hash').notNull(),

  // Change tracking
  changeType: text('change_type').notNull(), // 'added' | 'modified' | 'deleted' | 'unchanged' | 'renamed'
  previousFilename: text('previous_filename'),

  // Diff summary
  diffSummary: jsonb('diff_summary'),
}, (table) => ({
  versionIdx: index('idx_version_files_version').on(table.versionId),
  hashIdx: index('idx_version_files_hash').on(table.contentHash),
}));

export const snippetVersionFilesRelations = relations(snippetVersionFiles, ({ one }) => ({
  version: one(snippetVersions, {
    fields: [snippetVersionFiles.versionId],
    references: [snippetVersions.id],
  }),
  originalFile: one(files, {
    fields: [snippetVersionFiles.fileId],
    references: [files.id],
  }),
}));

// ============================================
// Content Store
// ============================================

export const contentStore = pgTable('content_store', {
  hash: text('hash').primaryKey(),
  content: text('content').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  referenceCount: integer('reference_count').default(1),
}, (table) => ({
  sizeIdx: index('idx_content_size').on(table.size),
}));

// ============================================
// Type exports
// ============================================

export type SnippetVersion = typeof snippetVersions.$inferSelect;
export type NewSnippetVersion = typeof snippetVersions.$inferInsert;
export type VersionFile = typeof snippetVersionFiles.$inferSelect;
export type ContentEntry = typeof contentStore.$inferSelect;
```

### Entity Relationship Diagram

```
┌─────────────────┐
│    snippets     │
│─────────────────│
│ id (PK)         │
│ title           │
│ ...             │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│   snippet_versions      │
│─────────────────────────│
│ id (PK)                 │
│ snippet_id (FK)         │
│ version_number          │
│ message                 │
│ created_at              │
│ files_added             │
│ files_modified          │
│ lines_added             │
│ lines_removed           │
└────────┬────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│  snippet_version_files  │
│─────────────────────────│
│ id (PK)                 │
│ version_id (FK)         │
│ filename                │
│ content_hash ───────────┼─────┐
│ change_type             │     │
│ diff_summary            │     │
└─────────────────────────┘     │
                                │
                                │ N:1
                                ▼
                    ┌─────────────────────┐
                    │    content_store    │
                    │─────────────────────│
                    │ hash (PK)           │
                    │ content             │
                    │ size                │
                    │ reference_count     │
                    └─────────────────────┘
```

---

## API Design

### Endpoints

```typescript
// apps/api/src/routes/versions.ts

import { Hono } from 'hono';
import { z } from 'zod';

// ============================================
// GET /api/snippets/:id/versions
// List all versions of a snippet
// ============================================

const listVersionsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Response
interface ListVersionsResponse {
  versions: {
    id: string;
    versionNumber: number;
    message: string | null;
    createdAt: string;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    linesAdded: number;
    linesRemoved: number;
  }[];
  total: number;
  hasMore: boolean;
}

// ============================================
// GET /api/snippets/:id/versions/:versionId
// Get specific version details with files
// ============================================

// Response
interface VersionDetailResponse {
  version: {
    id: string;
    versionNumber: number;
    message: string | null;
    createdAt: string;
    files: {
      id: string;
      filename: string;
      language: string;
      content: string;          // Full content from content_store
      changeType: 'added' | 'modified' | 'deleted' | 'unchanged' | 'renamed';
      previousFilename?: string;
      diffSummary?: {
        added: number;
        removed: number;
      };
    }[];
  };
}

// ============================================
// GET /api/snippets/:id/versions/:v1/diff/:v2
// Compare two versions
// ============================================

// Response
interface DiffResponse {
  fromVersion: number;
  toVersion: number;
  files: {
    filename: string;
    changeType: 'added' | 'modified' | 'deleted' | 'renamed';
    previousFilename?: string;
    diff: {
      // Unified diff format
      hunks: {
        oldStart: number;
        oldLines: number;
        newStart: number;
        newLines: number;
        lines: {
          type: 'context' | 'add' | 'remove';
          content: string;
          oldLineNumber?: number;
          newLineNumber?: number;
        }[];
      }[];
    };
    stats: {
      additions: number;
      deletions: number;
    };
  }[];
  summary: {
    filesChanged: number;
    additions: number;
    deletions: number;
  };
}

// ============================================
// POST /api/snippets/:id/versions/:versionId/restore
// Restore snippet to a specific version
// ============================================

const restoreSchema = z.object({
  message: z.string().optional(), // Optional message for the restore
});

// Response
interface RestoreResponse {
  success: true;
  newVersion: {
    id: string;
    versionNumber: number;
    message: string;
  };
}

// ============================================
// PATCH /api/snippets/:id/versions/:versionId
// Update version metadata (message only)
// ============================================

const updateVersionSchema = z.object({
  message: z.string().max(500),
});
```

### Full Route Implementation

```typescript
// apps/api/src/routes/versions.ts

import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { createHash } from 'crypto';
import * as Diff from 'diff';

export function createVersionsRoute(db: Database) {
  return new Hono()

    // List versions
    .get('/snippets/:snippetId/versions', async (c) => {
      const userId = c.get('userId');
      const snippetId = c.req.param('snippetId');
      const { limit, offset } = listVersionsSchema.parse(c.req.query());

      // Verify ownership
      const snippet = await db.query.snippets.findFirst({
        where: and(
          eq(snippets.id, snippetId),
          eq(snippets.userId, userId)
        ),
      });

      if (!snippet) {
        return c.json({ error: 'Snippet not found' }, 404);
      }

      const versions = await db.query.snippetVersions.findMany({
        where: eq(snippetVersions.snippetId, snippetId),
        orderBy: [desc(snippetVersions.versionNumber)],
        limit: limit + 1,
        offset,
      });

      const hasMore = versions.length > limit;
      const total = await db
        .select({ count: sql`count(*)` })
        .from(snippetVersions)
        .where(eq(snippetVersions.snippetId, snippetId));

      return c.json({
        versions: versions.slice(0, limit),
        total: Number(total[0].count),
        hasMore,
      });
    })

    // Get version detail
    .get('/snippets/:snippetId/versions/:versionId', async (c) => {
      const userId = c.get('userId');
      const { snippetId, versionId } = c.req.param();

      // Verify ownership and get version
      const version = await db.query.snippetVersions.findFirst({
        where: eq(snippetVersions.id, versionId),
        with: {
          snippet: true,
          files: true,
        },
      });

      if (!version || version.snippet.userId !== userId) {
        return c.json({ error: 'Version not found' }, 404);
      }

      // Fetch content for each file
      const filesWithContent = await Promise.all(
        version.files.map(async (file) => {
          const content = await db.query.contentStore.findFirst({
            where: eq(contentStore.hash, file.contentHash),
          });
          return {
            ...file,
            content: content?.content || '',
          };
        })
      );

      return c.json({
        version: {
          ...version,
          files: filesWithContent,
        },
      });
    })

    // Compare versions
    .get('/snippets/:snippetId/versions/:v1/diff/:v2', async (c) => {
      const userId = c.get('userId');
      const { snippetId, v1, v2 } = c.req.param();

      // Fetch both versions with files and content
      const [version1, version2] = await Promise.all([
        getVersionWithContent(db, v1, userId),
        getVersionWithContent(db, v2, userId),
      ]);

      if (!version1 || !version2) {
        return c.json({ error: 'Version not found' }, 404);
      }

      // Compute diff
      const diff = computeDiff(version1.files, version2.files);

      return c.json({
        fromVersion: version1.versionNumber,
        toVersion: version2.versionNumber,
        ...diff,
      });
    })

    // Restore version
    .post('/snippets/:snippetId/versions/:versionId/restore', async (c) => {
      const userId = c.get('userId');
      const { snippetId, versionId } = c.req.param();
      const body = await c.req.json();
      const { message } = restoreSchema.parse(body);

      // Get version to restore
      const versionToRestore = await getVersionWithContent(db, versionId, userId);

      if (!versionToRestore) {
        return c.json({ error: 'Version not found' }, 404);
      }

      // Create new version with restored content
      const newVersion = await db.transaction(async (tx) => {
        // Get next version number
        const latestVersion = await tx.query.snippetVersions.findFirst({
          where: eq(snippetVersions.snippetId, snippetId),
          orderBy: [desc(snippetVersions.versionNumber)],
        });
        const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        // Update current files to match version
        await updateSnippetFiles(tx, snippetId, versionToRestore.files);

        // Create version record
        const [version] = await tx.insert(snippetVersions).values({
          snippetId,
          versionNumber: nextVersionNumber,
          message: message || `Restored from version ${versionToRestore.versionNumber}`,
          createdBy: userId,
        }).returning();

        // Create version file records
        await createVersionFiles(tx, version.id, versionToRestore.files, 'restored');

        return version;
      });

      return c.json({
        success: true,
        newVersion,
      });
    })

    // Update version message
    .patch('/snippets/:snippetId/versions/:versionId', async (c) => {
      const userId = c.get('userId');
      const { versionId } = c.req.param();
      const body = await c.req.json();
      const { message } = updateVersionSchema.parse(body);

      const version = await db.query.snippetVersions.findFirst({
        where: eq(snippetVersions.id, versionId),
        with: { snippet: true },
      });

      if (!version || version.snippet.userId !== userId) {
        return c.json({ error: 'Version not found' }, 404);
      }

      const [updated] = await db
        .update(snippetVersions)
        .set({ message })
        .where(eq(snippetVersions.id, versionId))
        .returning();

      return c.json({ version: updated });
    });
}
```

### Version Creation Hook

```typescript
// apps/api/src/lib/versioning.ts

import { createHash } from 'crypto';
import * as Diff from 'diff';

/**
 * Called automatically when a snippet's files are updated
 * Creates a new version record with file snapshots
 */
export async function createSnippetVersion(
  db: Database,
  snippetId: string,
  userId: string,
  message?: string
): Promise<SnippetVersion> {
  return db.transaction(async (tx) => {
    // Get current files
    const currentFiles = await tx.query.files.findMany({
      where: eq(files.snippetId, snippetId),
      orderBy: [asc(files.order)],
    });

    // Get previous version's files for comparison
    const previousVersion = await tx.query.snippetVersions.findFirst({
      where: eq(snippetVersions.snippetId, snippetId),
      orderBy: [desc(snippetVersions.versionNumber)],
      with: { files: true },
    });

    const previousFiles = previousVersion?.files || [];
    const nextVersionNumber = (previousVersion?.versionNumber || 0) + 1;

    // Compute changes
    const changes = computeFileChanges(previousFiles, currentFiles);

    // Store content in content-addressable storage
    const contentHashes = await Promise.all(
      currentFiles.map(async (file) => {
        const hash = computeHash(file.content);

        // Insert or update reference count
        await tx
          .insert(contentStore)
          .values({
            hash,
            content: file.content,
            size: file.content.length,
          })
          .onConflictDoUpdate({
            target: contentStore.hash,
            set: {
              referenceCount: sql`${contentStore.referenceCount} + 1`,
            },
          });

        return { fileId: file.id, hash };
      })
    );

    // Create version record
    const [version] = await tx.insert(snippetVersions).values({
      snippetId,
      versionNumber: nextVersionNumber,
      message,
      createdBy: userId,
      filesAdded: changes.added.length,
      filesModified: changes.modified.length,
      filesDeleted: changes.deleted.length,
      linesAdded: changes.linesAdded,
      linesRemoved: changes.linesRemoved,
    }).returning();

    // Create version file records
    const versionFiles = currentFiles.map((file, index) => {
      const hashEntry = contentHashes.find(h => h.fileId === file.id);
      const change = changes.all.find(c => c.fileId === file.id);

      return {
        versionId: version.id,
        fileId: file.id,
        filename: file.filename,
        language: file.language,
        fileOrder: index,
        contentHash: hashEntry!.hash,
        changeType: change?.type || 'unchanged',
        previousFilename: change?.previousFilename,
        diffSummary: change?.diffSummary,
      };
    });

    // Add deleted files
    for (const deleted of changes.deleted) {
      versionFiles.push({
        versionId: version.id,
        fileId: null,
        filename: deleted.filename,
        language: deleted.language,
        fileOrder: -1,
        contentHash: deleted.contentHash,
        changeType: 'deleted',
      });
    }

    await tx.insert(snippetVersionFiles).values(versionFiles);

    return version;
  });
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function computeFileChanges(
  previousFiles: VersionFile[],
  currentFiles: File[]
): FileChanges {
  const changes: FileChanges = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    all: [],
    linesAdded: 0,
    linesRemoved: 0,
  };

  const previousMap = new Map(previousFiles.map(f => [f.fileId, f]));
  const currentMap = new Map(currentFiles.map(f => [f.id, f]));

  // Find added and modified files
  for (const current of currentFiles) {
    const previous = previousMap.get(current.id);

    if (!previous) {
      // New file
      changes.added.push({
        fileId: current.id,
        type: 'added',
      });
      changes.linesAdded += current.content.split('\n').length;
    } else {
      // Check for modifications
      const currentHash = computeHash(current.content);

      if (currentHash !== previous.contentHash) {
        const diff = Diff.diffLines(
          /* previous content */ '',  // Fetch from content_store
          current.content
        );

        let added = 0, removed = 0;
        for (const part of diff) {
          if (part.added) added += part.count || 0;
          if (part.removed) removed += part.count || 0;
        }

        changes.modified.push({
          fileId: current.id,
          type: 'modified',
          diffSummary: { added, removed },
        });
        changes.linesAdded += added;
        changes.linesRemoved += removed;
      }

      // Check for renames
      if (current.filename !== previous.filename) {
        changes.renamed.push({
          fileId: current.id,
          type: 'renamed',
          previousFilename: previous.filename,
        });
      }
    }
  }

  // Find deleted files
  for (const previous of previousFiles) {
    if (!currentMap.has(previous.fileId!)) {
      changes.deleted.push({
        fileId: previous.fileId,
        filename: previous.filename,
        language: previous.language,
        contentHash: previous.contentHash,
        type: 'deleted',
      });
      // Count lines removed (would need to fetch content)
    }
  }

  changes.all = [
    ...changes.added,
    ...changes.modified,
    ...changes.renamed,
    ...changes.deleted,
  ];

  return changes;
}
```

---

## UI/UX Design

### Version History Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Version History                                          [Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ● v12 (current)                              Today, 2:30 PM    │
│    └─ "Optimized Docker build stages"                           │
│       +15 -8 in 2 files                                         │
│       [View] [Compare with...]                                  │
│                                                                 │
│  ○ v11                                        Yesterday, 4:15 PM│
│    └─ "Added health check"                                      │
│       +23 -0 in 1 file                                          │
│       [View] [Restore] [Compare]                                │
│                                                                 │
│  ○ v10                                        Jan 5, 11:00 AM   │
│    └─ "Refactored nginx config"                                 │
│       +45 -32 in 2 files                                        │
│       [View] [Restore] [Compare]                                │
│                                                                 │
│  ○ v9                                         Jan 4, 3:20 PM    │
│    └─ No message                                                │
│       +5 -2 in 1 file                                           │
│       [View] [Restore] [Compare]                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ○ v1 (initial)                               Dec 28, 9:00 AM   │
│    └─ "Initial version"                                         │
│       3 files created                                           │
│       [View] [Restore]                                          │
│                                                                 │
│                        [Load More...]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Diff View

```
┌─────────────────────────────────────────────────────────────────┐
│ Comparing v10 → v12                                      [Close]│
├─────────────────────────────────────────────────────────────────┤
│ Files changed: 2    +60 additions    -40 deletions              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📄 docker-compose.yml                              +35 -20      │
│ ├────────────────────────────────────────────────────────────┤ │
│ │  @@ -15,7 +15,12 @@                                        │ │
│ │                                                            │ │
│ │   15   services:                                           │ │
│ │   16     app:                                              │ │
│ │   17       build: .                                        │ │
│ │ - 18       ports:                                          │ │
│ │ - 19         - "3000:3000"                                 │ │
│ │ + 18       healthcheck:                                    │ │
│ │ + 19         test: ["CMD", "curl", "-f", "http://localhost"]│ │
│ │ + 20         interval: 30s                                 │ │
│ │ + 21         timeout: 10s                                  │ │
│ │ + 22         retries: 3                                    │ │
│ │ + 23       ports:                                          │ │
│ │ + 24         - "3000:3000"                                 │ │
│ │   25     db:                                               │ │
│ │                                                            │ │
│ ├────────────────────────────────────────────────────────────┤ │
│                                                                 │
│ 📄 Dockerfile                                      +25 -20      │
│ └── [Expand to view changes]                                    │
│                                                                 │
│                                                                 │
│           [← Previous File]  [Next File →]                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              [Restore v10]    [Close]                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### React Components

```typescript
// apps/web/src/components/version-history.tsx

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, GitBranch, RotateCcw, GitCompare } from 'lucide-react';

interface VersionHistoryProps {
  snippetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistory({ snippetId, isOpen, onClose }: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['versions', snippetId],
    queryFn: ({ pageParam = 0 }) =>
      fetchVersions(snippetId, { offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
  });

  const versions = data?.pages.flatMap(p => p.versions) || [];

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setShowDiff(true);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (confirm('Restore this version? This will create a new version with the restored content.')) {
      await restoreVersion(snippetId, versionId);
      // Refresh data
    }
  };

  if (showDiff && selectedVersions.length === 2) {
    return (
      <VersionDiff
        snippetId={snippetId}
        versionId1={selectedVersions[0]}
        versionId2={selectedVersions[1]}
        onClose={() => setShowDiff(false)}
      />
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-bg-primary border-l border-border shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={20} />
          <h2 className="font-semibold">Version History</h2>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          ×
        </button>
      </div>

      {/* Compare button */}
      {selectedVersions.length === 2 && (
        <div className="p-4 border-b border-border bg-bg-elevated">
          <button
            onClick={handleCompare}
            className="w-full flex items-center justify-center gap-2 bg-accent text-bg-primary py-2 px-4"
          >
            <GitCompare size={16} />
            Compare Selected Versions
          </button>
        </div>
      )}

      {/* Version list */}
      <div className="overflow-y-auto h-full pb-20">
        {versions.map((version, index) => (
          <VersionItem
            key={version.id}
            version={version}
            isCurrent={index === 0}
            isSelected={selectedVersions.includes(version.id)}
            onSelect={() => {
              setSelectedVersions(prev => {
                if (prev.includes(version.id)) {
                  return prev.filter(id => id !== version.id);
                }
                if (prev.length >= 2) {
                  return [prev[1], version.id];
                }
                return [...prev, version.id];
              });
            }}
            onRestore={() => handleRestore(version.id)}
          />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-4 text-accent hover:bg-bg-elevated"
          >
            Load More...
          </button>
        )}
      </div>
    </div>
  );
}

function VersionItem({
  version,
  isCurrent,
  isSelected,
  onSelect,
  onRestore
}: VersionItemProps) {
  return (
    <div
      className={`p-4 border-b border-border ${
        isSelected ? 'bg-accent/10' : 'hover:bg-bg-elevated'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1"
        />

        {/* Version indicator */}
        <div className={`w-3 h-3 rounded-full mt-1.5 ${
          isCurrent ? 'bg-accent' : 'border-2 border-border'
        }`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">
              v{version.versionNumber}
              {isCurrent && (
                <span className="ml-2 text-xs text-accent">(current)</span>
              )}
            </span>
            <span className="text-xs text-text-tertiary">
              {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
            </span>
          </div>

          {version.message && (
            <p className="text-sm text-text-secondary mt-1 truncate">
              {version.message}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            {version.linesAdded > 0 && (
              <span className="text-green-500">+{version.linesAdded}</span>
            )}
            {version.linesRemoved > 0 && (
              <span className="text-red-500">-{version.linesRemoved}</span>
            )}
            <span className="text-text-tertiary">
              in {version.filesModified + version.filesAdded} file(s)
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button className="text-xs text-accent hover:underline">
              View
            </button>
            {!isCurrent && (
              <button
                onClick={onRestore}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Restore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Diff Component

```typescript
// apps/web/src/components/version-diff.tsx

import { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface VersionDiffProps {
  snippetId: string;
  versionId1: string;
  versionId2: string;
  onClose: () => void;
}

export function VersionDiff({ snippetId, versionId1, versionId2, onClose }: VersionDiffProps) {
  const { data: diff, isLoading } = useQuery({
    queryKey: ['diff', snippetId, versionId1, versionId2],
    queryFn: () => fetchDiff(snippetId, versionId1, versionId2),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Computing diff...</div>;
  }

  return (
    <div className="fixed inset-0 bg-bg-primary z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">
            Comparing v{diff.fromVersion} → v{diff.toVersion}
          </h2>
          <div className="text-sm text-text-tertiary">
            {diff.summary.filesChanged} files changed
            <span className="text-green-500 ml-2">+{diff.summary.additions}</span>
            <span className="text-red-500 ml-2">-{diff.summary.deletions}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          Close
        </button>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto p-4">
        {diff.files.map((file) => (
          <FileDiff key={file.filename} file={file} />
        ))}
      </div>
    </div>
  );
}

function FileDiff({ file }: { file: DiffFile }) {
  return (
    <div className="mb-6 border border-border rounded">
      {/* File header */}
      <div className="flex items-center justify-between p-3 bg-bg-elevated border-b border-border">
        <div className="flex items-center gap-2 font-mono text-sm">
          <FileIcon language={file.language} />
          {file.previousFilename && file.previousFilename !== file.filename ? (
            <>
              <span className="text-text-tertiary">{file.previousFilename}</span>
              <span>→</span>
            </>
          ) : null}
          <span>{file.filename}</span>
        </div>
        <div className="text-xs">
          <span className="text-green-500">+{file.stats.additions}</span>
          <span className="text-red-500 ml-2">-{file.stats.deletions}</span>
        </div>
      </div>

      {/* Diff hunks */}
      <div className="font-mono text-sm">
        {file.diff.hunks.map((hunk, i) => (
          <DiffHunk key={i} hunk={hunk} />
        ))}
      </div>
    </div>
  );
}

function DiffHunk({ hunk }: { hunk: DiffHunk }) {
  return (
    <div>
      {/* Hunk header */}
      <div className="px-4 py-1 bg-blue-500/10 text-blue-400 text-xs">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>

      {/* Lines */}
      {hunk.lines.map((line, i) => (
        <div
          key={i}
          className={`px-4 py-0.5 flex ${
            line.type === 'add'
              ? 'bg-green-500/10 text-green-400'
              : line.type === 'remove'
              ? 'bg-red-500/10 text-red-400'
              : ''
          }`}
        >
          {/* Line numbers */}
          <span className="w-12 text-text-tertiary text-right pr-4 select-none">
            {line.oldLineNumber || ''}
          </span>
          <span className="w-12 text-text-tertiary text-right pr-4 select-none">
            {line.newLineNumber || ''}
          </span>

          {/* Change indicator */}
          <span className="w-4 select-none">
            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
          </span>

          {/* Content */}
          <span className="flex-1 whitespace-pre">{line.content}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Storage Strategy

### Content Deduplication

```
Scenario: User has 50 versions of a snippet with 5 files each.
Without deduplication: 50 × 5 = 250 file contents stored
With deduplication: Only unique contents stored (typically ~20-30)

How it works:
1. Compute SHA-256 hash of file content
2. Check if hash exists in content_store
3. If exists: increment reference_count, reuse hash
4. If not: store content, set reference_count = 1
```

### Storage Calculation

```typescript
// Estimated storage per snippet with versioning

interface StorageEstimate {
  snippetMetadata: 1;      // KB - title, description, etc.
  versionMetadata: 0.5;    // KB per version - message, timestamps
  fileMetadata: 0.2;       // KB per file per version
  contentStorage: number;  // Depends on deduplication ratio
}

// Example: 10 files, 100 versions, 80% deduplication
// Metadata: 1 + (0.5 × 100) + (0.2 × 10 × 100) = 251 KB
// Content: 10 files × avg 5KB × 20% unique = 10 KB
// Total: ~261 KB per heavily-versioned snippet
```

### Garbage Collection

```typescript
// apps/api/src/jobs/content-gc.ts

/**
 * Runs periodically to clean up orphaned content
 * Content is orphaned when reference_count reaches 0
 */
export async function runContentGarbageCollection(db: Database) {
  // Find content with no references
  const orphaned = await db
    .select()
    .from(contentStore)
    .where(lte(contentStore.referenceCount, 0));

  if (orphaned.length === 0) return;

  // Delete orphaned content
  await db
    .delete(contentStore)
    .where(lte(contentStore.referenceCount, 0));

  console.log(`GC: Removed ${orphaned.length} orphaned content entries`);
}

// Decrement reference on version deletion
export async function decrementContentReferences(
  db: Database,
  contentHashes: string[]
) {
  for (const hash of contentHashes) {
    await db
      .update(contentStore)
      .set({
        referenceCount: sql`${contentStore.referenceCount} - 1`,
      })
      .where(eq(contentStore.hash, hash));
  }
}
```

### Version Retention Policy

```typescript
// Configuration options for version retention

interface VersionRetentionPolicy {
  // Keep all versions for this duration
  keepAllForDays: 30;

  // After that, keep only significant versions
  keepSignificantForDays: 365;

  // What makes a version "significant"
  significantCriteria: {
    hasMessage: true;           // Has a commit message
    linesChanged: 50;           // More than 50 lines changed
    filesChanged: 2;            // More than 2 files changed
    isRestore: true;            // Is a restore point
  };

  // Always keep first and last N versions
  alwaysKeepFirst: 1;
  alwaysKeepLast: 10;

  // Maximum versions per snippet (0 = unlimited)
  maxVersionsPerSnippet: 100;
}
```

---

## Diff Algorithm

### Using `diff` Library

```typescript
// apps/api/src/lib/diff.ts

import { diffLines, diffWords, Change } from 'diff';

interface DiffResult {
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
  };
}

export function computeLineDiff(oldContent: string, newContent: string): DiffResult {
  const changes = diffLines(oldContent, newContent);

  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let oldLine = 1;
  let newLine = 1;

  for (const change of changes) {
    const lineCount = change.count || 0;

    if (change.added || change.removed) {
      // Start new hunk if needed
      if (!currentHunk) {
        currentHunk = {
          oldStart: oldLine,
          oldLines: 0,
          newStart: newLine,
          newLines: 0,
          lines: [],
        };
      }

      // Add context lines before (3 lines)
      // ... (context handling logic)

      const lines = change.value.split('\n').filter(Boolean);

      for (const line of lines) {
        currentHunk.lines.push({
          type: change.added ? 'add' : 'remove',
          content: line,
          oldLineNumber: change.removed ? oldLine++ : undefined,
          newLineNumber: change.added ? newLine++ : undefined,
        });

        if (change.added) currentHunk.newLines++;
        if (change.removed) currentHunk.oldLines++;
      }
    } else {
      // Context lines
      if (currentHunk) {
        // Add trailing context and close hunk
        const lines = change.value.split('\n').slice(0, 3);
        for (const line of lines) {
          currentHunk.lines.push({
            type: 'context',
            content: line,
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
          });
          currentHunk.oldLines++;
          currentHunk.newLines++;
        }
        hunks.push(currentHunk);
        currentHunk = null;
      }

      oldLine += lineCount;
      newLine += lineCount;
    }
  }

  // Close final hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  // Compute stats
  const stats = {
    additions: hunks.reduce((sum, h) =>
      sum + h.lines.filter(l => l.type === 'add').length, 0),
    deletions: hunks.reduce((sum, h) =>
      sum + h.lines.filter(l => l.type === 'remove').length, 0),
  };

  return { hunks, stats };
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Database schema and basic version creation

- [ ] Create database migrations for versioning tables
- [ ] Implement content-addressable storage
- [ ] Add version creation hook to snippet update flow
- [ ] Create version on every file save
- [ ] Basic API endpoint: GET /versions

**Deliverable**: Versions are automatically created on save

### Phase 2: Read Operations (Week 3-4)

**Goal**: View versions and history

- [ ] API: List versions with pagination
- [ ] API: Get version detail with files
- [ ] UI: Version history panel
- [ ] UI: Version detail view
- [ ] Add version indicator to snippet view

**Deliverable**: Users can view version history

### Phase 3: Diff & Compare (Week 5-6)

**Goal**: Compare versions with visual diff

- [ ] Implement diff algorithm
- [ ] API: Compare two versions
- [ ] UI: Diff viewer component
- [ ] UI: Side-by-side diff mode
- [ ] UI: Inline diff mode

**Deliverable**: Full diff functionality

### Phase 4: Restore & Polish (Week 7-8)

**Goal**: Restore versions and UX polish

- [ ] API: Restore version endpoint
- [ ] UI: Restore confirmation dialog
- [ ] Add version messages on save
- [ ] Keyboard shortcuts for history
- [ ] Performance optimization
- [ ] Version retention policy

**Deliverable**: Production-ready versioning

---

## Performance Considerations

### Query Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_versions_snippet_created ON snippet_versions(snippet_id, created_at DESC);
CREATE INDEX idx_version_files_version ON snippet_version_files(version_id);
CREATE INDEX idx_content_hash ON content_store(hash);

-- Partial index for recent versions
CREATE INDEX idx_versions_recent ON snippet_versions(snippet_id, version_number DESC)
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Caching Strategy

```typescript
// Cache version list (changes less frequently)
const VERSION_LIST_CACHE_TTL = 60; // 1 minute

// Cache individual version content (immutable)
const VERSION_CONTENT_CACHE_TTL = 3600; // 1 hour

// Cache diffs (immutable, computed once)
const DIFF_CACHE_TTL = 86400; // 24 hours
```

### Lazy Loading

```typescript
// Load versions in batches
const VERSIONS_PAGE_SIZE = 20;

// Load diff on demand (not precomputed)
// Store only diff summary, compute full diff when requested
```

---

## Migration Strategy

### Existing Snippets

```typescript
// Migration script to create initial version for existing snippets

export async function migrateExistingSnippets(db: Database) {
  const snippets = await db.query.snippets.findMany({
    with: { files: true },
  });

  for (const snippet of snippets) {
    // Check if snippet already has versions
    const existingVersion = await db.query.snippetVersions.findFirst({
      where: eq(snippetVersions.snippetId, snippet.id),
    });

    if (existingVersion) continue;

    // Create initial version
    await createSnippetVersion(
      db,
      snippet.id,
      snippet.userId,
      'Initial version (migrated)'
    );
  }
}
```

### Database Migration

```sql
-- Migration: 20260107_add_versioning.sql

-- Create tables
CREATE TABLE snippet_versions (...);
CREATE TABLE snippet_version_files (...);
CREATE TABLE content_store (...);

-- Create indexes
CREATE INDEX ...;

-- Migrate existing snippets (run in batches)
-- See migration script above
```

---

## Future Enhancements

### Version 1.1

- [ ] Version labels/tags ("stable", "production", "experimental")
- [ ] Bulk version operations (delete old versions)
- [ ] Version export (download specific version as ZIP)
- [ ] Version sharing (share link to specific version)

### Version 1.2

- [ ] Branching (create variant from version)
- [ ] Merge versions (combine changes from two versions)
- [ ] Conflict resolution UI

### Version 2.0

- [ ] Collaborative editing with real-time versioning
- [ ] Version annotations (comments on specific lines)
- [ ] Automated version descriptions (AI-generated)
- [ ] Version analytics (change frequency, file hotspots)

---

## Appendix

### A. Version Message Best Practices

```markdown
Good version messages:
- "Fixed SQL injection vulnerability in user query"
- "Added Docker health check configuration"
- "Refactored authentication middleware for clarity"
- "Updated dependencies to latest versions"

Poor version messages:
- "update"
- "fixed"
- "changes"
- ""  (empty)
```

### B. Storage Projections

| Snippets | Avg Versions | Dedup Rate | Est. Storage |
|----------|--------------|------------|--------------|
| 100      | 20           | 80%        | ~50 MB       |
| 1,000    | 20           | 80%        | ~500 MB      |
| 10,000   | 20           | 80%        | ~5 GB        |

### C. API Rate Limits

| Endpoint | Rate Limit | Reason |
|----------|------------|--------|
| List versions | 100/min | Lightweight |
| Get version | 60/min | Content fetch |
| Compare versions | 30/min | Compute intensive |
| Restore version | 10/min | Write operation |

---

## References

- [Git Internals - Content-Addressable Storage](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
- [diff npm package](https://www.npmjs.com/package/diff)
- [GitHub - Comparing commits](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/viewing-and-comparing-commits)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation) (for future real-time collab)
