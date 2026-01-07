# SnippetVault Social Discovery - Architecture Document

> **Version**: 1.0
> **Status**: Proposed
> **Author**: Architecture Team
> **Last Updated**: 2026-01-07

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Feature Specifications](#feature-specifications)
5. [Technical Architecture](#technical-architecture)
6. [Data Models](#data-models)
7. [API Requirements](#api-requirements)
8. [UI/UX Design](#uiux-design)
9. [Implementation Phases](#implementation-phases)
10. [Security Considerations](#security-considerations)
11. [Performance Considerations](#performance-considerations)
12. [Testing Strategy](#testing-strategy)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The Social Discovery feature set transforms SnippetVault from a personal snippet manager into a community-driven platform where developers can discover, appreciate, and reuse code from others.

### Three Core Features

| Feature | Description | Value |
|---------|-------------|-------|
| **Explore** | Public discovery page for browsing community snippets | Content discovery, user acquisition |
| **Star** | Bookmark public snippets from other users | Engagement, social proof |
| **Fork** | Copy a public snippet to your own account | Content reuse, virality |

### Why Social Discovery?

- **Network effects**: Each public snippet attracts users who may create more public snippets
- **Content quality signal**: Stars indicate valuable snippets, improving discovery
- **Reduced friction**: Fork allows instant adoption without manual recreation
- **Community building**: Transforms isolated users into a community

---

## Goals & Non-Goals

### Goals

- Enable discovery of high-quality public snippets
- Allow users to star/bookmark snippets they find useful
- Enable one-click forking of public snippets
- Maintain attribution to original authors
- Provide meaningful metrics (star count, fork count)
- Support filtering and sorting on the explore page
- Keep the experience fast and responsive

### Non-Goals

- Social features like comments or discussions (future consideration)
- Following users or user profiles (future consideration)
- Private sharing between specific users (different feature)
- Real-time collaboration on snippets
- Monetization of popular snippets
- Pull request / merge functionality for forks

---

## User Stories

### Explore Stories

```
As a developer, I want to:

1. Browse all public snippets from the community
   → Navigate to /explore to see public snippets

2. Search public snippets by keyword
   → Use search bar to find snippets matching "docker nginx"

3. Filter public snippets by language
   → Select "TypeScript" to see only TS snippets

4. Filter by tags
   → Click "react" tag to see React-related snippets

5. Sort snippets by popularity, recency, or stars
   → Toggle between "Most Stars", "Recent", "Most Forked"

6. View snippet details without authentication
   → Click a snippet card to see full content (read-only)
```

### Star Stories

```
As an authenticated user, I want to:

1. Star a public snippet I find useful
   → Click star icon on snippet card or detail page

2. Unstar a previously starred snippet
   → Click filled star icon to remove star

3. View all snippets I've starred
   → Navigate to "Starred" in sidebar to see my starred snippets

4. See how many stars a snippet has
   → View star count displayed on snippet cards

5. Know if I've already starred a snippet
   → See filled star icon vs outline star icon
```

### Fork Stories

```
As an authenticated user, I want to:

1. Fork a public snippet to my account
   → Click "Fork" button on snippet detail page

2. Have full ownership of my forked snippet
   → Edit, delete, make private - full control

3. See that a snippet is a fork with attribution
   → "Forked from @username/snippet-title" displayed

4. See how many times a snippet has been forked
   → Fork count displayed on original snippet

5. Fork and immediately customize variables
   → Fork modal allows setting initial variable values
```

---

## Feature Specifications

### 1. Explore Page

#### Route
```
/explore
```

#### Query Parameters
```
?q=search-term          # Full-text search
&language=typescript    # Filter by language
&tag=react             # Filter by tag
&sort=stars|recent|forks  # Sort order
&page=1                # Pagination
```

#### Behavior
- Publicly accessible (no auth required to browse)
- Shows only `isPublic: true` snippets
- Excludes current user's own snippets (if authenticated)
- Default sort: Most Stars (descending)
- Pagination: 20 snippets per page
- Infinite scroll or traditional pagination

#### Snippet Card Display
```
┌────────────────────────────────────────────────────┐
│  📘 React useAuth Hook                    ★ 142    │
│  ──────────────────────────────────────────────── │
│  Custom authentication hook with JWT refresh...   │
│                                                    │
│  typescript  │  react  auth  hooks  │  3 files    │
│                                                    │
│  by @johndoe  •  2 days ago  •  🍴 28 forks       │
└────────────────────────────────────────────────────┘
```

### 2. Star System

#### UI Locations
- Explore page snippet cards
- Snippet detail page (`/s/:slug`)
- User's starred snippets list (`/dashboard?filter=starred`)

#### Star States
```
☆  Not starred (outline)     → Click to star
★  Starred (filled, accent)  → Click to unstar
```

#### Star Count Display
- Always visible on public snippets
- Format: `★ 142` or `★ 1.2k` for large numbers
- Animate count change on star/unstar

#### Starred Snippets View
- New sidebar item: "Starred" with star icon
- Shows all snippets user has starred
- Can unstar from this view
- Sort by: Date starred, Stars count, Recent activity

### 3. Fork System

#### Fork Button
- Visible on public snippet detail pages
- Disabled if user owns the snippet
- Disabled if user has already forked this snippet (show "View Fork")

#### Fork Flow
```
User clicks "Fork"
    │
    ▼
┌─────────────────────────────────────────┐
│         Fork "React useAuth Hook"        │
│  ─────────────────────────────────────  │
│                                          │
│  Title: [React useAuth Hook (copy)    ]  │
│                                          │
│  ☑ Copy all files (3 files)              │
│  ☑ Copy variables (2 variables)          │
│  ☑ Copy tags                             │
│  ☐ Make private                          │
│                                          │
│  [Cancel]              [Fork Snippet]    │
└─────────────────────────────────────────┘
    │
    ▼
Snippet created → Redirect to /dashboard/:id/edit
```

#### Fork Attribution
- Forked snippet stores `forkedFromId` reference
- Display: "Forked from @username/title" with link
- If original is deleted: "Forked from [deleted snippet]"
- Attribution is permanent (cannot be removed)

#### Fork Behavior
- Creates complete copy: files, variables, tags
- New unique ID generated
- User becomes owner
- `isFavorite` reset to false
- `isPublic` optionally set during fork
- `slug` regenerated if public
- `forkedFromId` set to original snippet ID
- Original snippet's `forkCount` incremented

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Explore Page│  │ Star Button │  │ Fork Modal/Button   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Hono)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │GET /explore │  │POST /stars  │  │POST /snippets/fork  │  │
│  │             │  │DELETE /stars│  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  snippets   │  │   stars     │  │  snippets (fork)    │  │
│  │  (public)   │  │  (junction) │  │  forkedFromId       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Query Patterns

#### Explore Query (Optimized)
```sql
SELECT
  s.*,
  u.name as author_name,
  u.image as author_image,
  COUNT(DISTINCT st.user_id) as star_count,
  COUNT(DISTINCT f.id) as fork_count,
  EXISTS(SELECT 1 FROM stars WHERE snippet_id = s.id AND user_id = $current_user) as is_starred
FROM snippets s
JOIN users u ON s.user_id = u.id
LEFT JOIN stars st ON st.snippet_id = s.id
LEFT JOIN snippets f ON f.forked_from_id = s.id
WHERE s.is_public = true
  AND s.user_id != $current_user  -- Exclude own snippets
  AND ($search IS NULL OR s.title ILIKE '%' || $search || '%')
  AND ($language IS NULL OR s.language = $language)
GROUP BY s.id, u.id
ORDER BY
  CASE WHEN $sort = 'stars' THEN COUNT(DISTINCT st.user_id) END DESC,
  CASE WHEN $sort = 'recent' THEN s.created_at END DESC,
  CASE WHEN $sort = 'forks' THEN COUNT(DISTINCT f.id) END DESC
LIMIT 20 OFFSET $offset;
```

---

## Data Models

### New Table: `stars`

```typescript
// packages/db/src/schema/stars.ts

import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { snippets } from './snippets';

export const stars = pgTable('stars', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  snippetId: text('snippet_id')
    .notNull()
    .references(() => snippets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.snippetId] }),
  snippetIdx: index('idx_stars_snippet_id').on(table.snippetId),
  userIdx: index('idx_stars_user_id').on(table.userId),
}));

// Relations
export const starsRelations = relations(stars, ({ one }) => ({
  user: one(users, {
    fields: [stars.userId],
    references: [users.id],
  }),
  snippet: one(snippets, {
    fields: [stars.snippetId],
    references: [snippets.id],
  }),
}));
```

### Modified Table: `snippets`

```typescript
// Add to existing snippets table

export const snippets = pgTable('snippets', {
  // ... existing fields ...

  // New fields for fork support
  forkedFromId: text('forked_from_id')
    .references(() => snippets.id, { onDelete: 'set null' }),

}, (table) => ({
  // ... existing indexes ...

  // New index for fork queries
  forkedFromIdx: index('idx_snippets_forked_from').on(table.forkedFromId),
}));
```

### TypeScript Types

```typescript
// Explore snippet with counts
interface ExploreSnippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;

  // Author info
  author: {
    id: string;
    name: string;
    image: string | null;
  };

  // Counts
  starCount: number;
  forkCount: number;
  fileCount: number;

  // User-specific (if authenticated)
  isStarred: boolean;

  // Tags
  tags: Array<{ id: string; name: string; color: string | null }>;
}

// Star record
interface Star {
  userId: string;
  snippetId: string;
  createdAt: Date;
}

// Fork metadata on snippet
interface SnippetWithForkInfo {
  // ... all snippet fields ...
  forkedFromId: string | null;
  forkedFrom: {
    id: string;
    title: string;
    slug: string;
    author: {
      id: string;
      name: string;
    };
  } | null;
}
```

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   snippets   │       │    files     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)      │◄──────│ snippet_id   │
│ name         │   │   │ user_id (FK) │───────│ filename     │
│ email        │   │   │ title        │       │ content      │
│ image        │   │   │ description  │       └──────────────┘
└──────────────┘   │   │ language     │
       ▲           │   │ is_public    │       ┌──────────────┐
       │           │   │ forked_from  │──┐    │  variables   │
       │           │   │ slug         │  │    ├──────────────┤
       │           │   │ created_at   │  │    │ snippet_id   │
       │           └───│──────────────│  │    │ name         │
       │               └──────────────┘  │    │ default_value│
       │                      ▲          │    └──────────────┘
       │                      │          │
       │               ┌──────┴──────┐   │
       │               │             │   │
       │          ┌────┴────┐   ┌────┴───┴┐
       │          │  stars  │   │ (self)  │
       │          ├─────────┤   │ fork    │
       └──────────│ user_id │   │ reference│
                  │snippet_id│   └─────────┘
                  │created_at│
                  └─────────┘
```

---

## API Requirements

### Explore Endpoints

#### GET `/api/explore`

Fetch public snippets for discovery.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (title, description) |
| `language` | string | Filter by language |
| `tag` | string | Filter by tag name |
| `sort` | enum | `stars` \| `recent` \| `forks` (default: `stars`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |

**Response:**
```typescript
{
  snippets: ExploreSnippet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    languages: Array<{ language: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
  };
}
```

#### GET `/api/explore/trending`

Get trending snippets (most starred in last 7 days).

**Response:**
```typescript
{
  snippets: ExploreSnippet[];
}
```

### Star Endpoints

#### POST `/api/stars/:snippetId`

Star a snippet. Requires authentication.

**Response:**
```typescript
{
  success: true;
  starCount: number; // Updated count
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Snippet not found
- `400` - Cannot star own snippet
- `400` - Snippet is not public
- `409` - Already starred

#### DELETE `/api/stars/:snippetId`

Unstar a snippet. Requires authentication.

**Response:**
```typescript
{
  success: true;
  starCount: number; // Updated count
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Star not found

#### GET `/api/stars`

Get user's starred snippets. Requires authentication.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `sort` | enum | `starred_at` \| `stars` \| `recent` |
| `page` | number | Page number |

**Response:**
```typescript
{
  snippets: Array<ExploreSnippet & { starredAt: Date }>;
  pagination: { ... };
}
```

### Fork Endpoints

#### POST `/api/snippets/:id/fork`

Fork a public snippet. Requires authentication.

**Request Body:**
```typescript
{
  title?: string;      // Optional custom title (default: "Original Title")
  isPublic?: boolean;  // Make fork public? (default: false)
}
```

**Response:**
```typescript
{
  success: true;
  snippet: {
    id: string;
    slug: string | null;
  };
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Snippet not found
- `400` - Snippet is not public
- `400` - Cannot fork own snippet
- `409` - Duplicate title (user already has snippet with this title)

#### GET `/api/snippets/:id/forks`

Get forks of a snippet.

**Response:**
```typescript
{
  forks: Array<{
    id: string;
    title: string;
    slug: string | null;
    isPublic: boolean;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      image: string | null;
    };
  }>;
  total: number;
}
```

---

## UI/UX Design

### Navigation Updates

```
Sidebar (Authenticated)
├── All Snippets
├── Favorites (existing - user's own favorites)
├── Starred ⭐ (NEW - other users' snippets)
├── Public
├── ─────────────
├── Explore 🌍 (NEW - discover snippets)
└── Tags
    └── ...
```

### Explore Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🌍 Explore Snippets                                    [Search...] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Language: [All ▼]  Tag: [All ▼]  Sort: [★ Most Stars ▼]           │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────┐ │
│  │ React useAuth Hook  │  │ Docker Compose Stack│  │ Go REST API │ │
│  │ ★ 142  🍴 28        │  │ ★ 98   🍴 15       │  │ ★ 76  🍴 8  │ │
│  │ typescript          │  │ yaml                │  │ go          │ │
│  │ @johndoe • 2d ago   │  │ @devops_pro • 1w   │  │ @gopher     │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────┘ │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────┐ │
│  │ Python FastAPI      │  │ Tailwind Config     │  │ Jest Setup  │ │
│  │ ...                 │  │ ...                 │  │ ...         │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────┘ │
│                                                                      │
│                      [Load More]                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Snippet Detail Page Updates

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  React useAuth Hook                               ☆ Star  [Fork]    │
│  Custom authentication hook with JWT refresh                        │
│                                                                      │
│  ★ 142 stars  •  🍴 28 forks  •  by @johndoe  •  Updated 2 days ago │
│                                                                      │
│  ┌─ If forked ──────────────────────────────────────────────────┐   │
│  │  🍴 Forked from @original_author/original-snippet-name       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [typescript]  [react]  [auth]  [hooks]                             │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Files  |  Variables  |  Instructions                               │
│  ─────────────────────────────────────────────────────────────────  │
│  ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Fork Modal Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  🍴 Fork Snippet                                              [✕]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  You're forking "React useAuth Hook" by @johndoe                    │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Title                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ React useAuth Hook                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ☐ Make this snippet public                                         │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  This will copy:                                                     │
│  • 3 files                                                           │
│  • 2 variables                                                       │
│  • 4 tags                                                            │
│                                                                      │
│  Attribution to the original author will be preserved.               │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [🍴 Fork Snippet]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Backend Foundation (2-3 days)

**Tasks:**
1. Create `stars` table schema and migration
2. Add `forkedFromId` column to `snippets` table
3. Create star API endpoints (POST, DELETE, GET)
4. Create fork API endpoint
5. Update explore query with counts
6. Add indexes for performance

**Deliverables:**
- [ ] `packages/db/src/schema/stars.ts`
- [ ] Migration files
- [ ] `apps/api/src/routes/stars.ts`
- [ ] `apps/api/src/routes/explore.ts`
- [ ] Fork endpoint in snippets routes

### Phase 2: Explore Page (2-3 days)

**Tasks:**
1. Create `/explore` route
2. Build explore page component
3. Implement search functionality
4. Add language/tag filters
5. Add sort options
6. Implement pagination/infinite scroll
7. Create snippet card component for explore

**Deliverables:**
- [ ] `apps/web/src/routes/explore.tsx`
- [ ] `apps/web/src/components/explore-snippet-card.tsx`
- [ ] `apps/web/src/components/explore-filters.tsx`

### Phase 3: Star System UI (1-2 days)

**Tasks:**
1. Create star button component
2. Add star button to explore cards
3. Add star button to snippet detail page
4. Create "Starred" sidebar item and page
5. Implement optimistic UI updates
6. Add star count animations

**Deliverables:**
- [ ] `apps/web/src/components/star-button.tsx`
- [ ] Starred snippets view
- [ ] Sidebar navigation update

### Phase 4: Fork System UI (1-2 days)

**Tasks:**
1. Create fork button component
2. Create fork modal/dialog
3. Handle fork flow and redirect
4. Display fork attribution on snippets
5. Show fork count on original snippets
6. Handle "already forked" state

**Deliverables:**
- [ ] `apps/web/src/components/fork-button.tsx`
- [ ] `apps/web/src/components/fork-modal.tsx`
- [ ] Fork attribution display component

### Phase 5: Polish & Testing (1-2 days)

**Tasks:**
1. End-to-end testing
2. Performance optimization
3. Error handling improvements
4. Loading states and skeletons
5. Mobile responsiveness
6. Accessibility audit

---

## Security Considerations

### Authorization Rules

| Action | Rule |
|--------|------|
| View explore | Anyone (public) |
| Star snippet | Authenticated + snippet is public + not own snippet |
| Unstar snippet | Authenticated + user owns the star |
| Fork snippet | Authenticated + snippet is public + not own snippet |
| View starred | Authenticated (only own) |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| GET /explore | 100 req/min |
| POST /stars | 30 req/min |
| DELETE /stars | 30 req/min |
| POST /fork | 10 req/min |

### Data Privacy

- Stars are private (users can't see who starred their snippets)
- Fork attribution shows only author name (not email)
- Deleted users: stars removed, forks preserved with "[deleted user]"

---

## Performance Considerations

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Caching Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. React Query (Client)                                     │
│     - Explore results: 5 min stale time                      │
│     - Star state: Optimistic updates                         │
│     - Starred list: 1 min stale time                         │
│                                                              │
│  2. Database Indexes                                         │
│     - stars(snippet_id) for count queries                    │
│     - stars(user_id) for user's starred list                 │
│     - snippets(forked_from_id) for fork counts               │
│     - snippets(is_public, created_at) for explore            │
│                                                              │
│  3. Materialized Counts (Future)                             │
│     - star_count on snippets table                           │
│     - fork_count on snippets table                           │
│     - Updated via triggers or async job                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Query Optimization

1. **Star counts**: Use `COUNT(*)` with proper indexes initially, consider denormalization if slow
2. **Explore pagination**: Keyset pagination for large result sets
3. **User's starred check**: Single JOIN vs batch query for lists

---

## Testing Strategy

### Unit Tests

```typescript
// Star service tests
describe('StarService', () => {
  it('should create a star for public snippet');
  it('should fail to star private snippet');
  it('should fail to star own snippet');
  it('should delete star');
  it('should return correct star count');
});

// Fork service tests
describe('ForkService', () => {
  it('should create fork with all files');
  it('should create fork with all variables');
  it('should set forkedFromId correctly');
  it('should fail for private snippets');
  it('should handle duplicate titles');
});
```

### Integration Tests

```typescript
describe('Explore API', () => {
  it('should return only public snippets');
  it('should exclude own snippets when authenticated');
  it('should filter by language');
  it('should sort by stars correctly');
  it('should include star counts');
});
```

### E2E Tests

```typescript
describe('Social Discovery Flow', () => {
  it('should browse explore page');
  it('should search and filter snippets');
  it('should star and unstar snippet');
  it('should fork snippet and redirect');
  it('should show fork attribution');
});
```

---

## Future Enhancements

### Near-term (Post-MVP)

1. **Trending Section**: Snippets gaining stars rapidly
2. **Related Snippets**: "Users who starred this also starred..."
3. **Star Notifications**: Notify when your snippet gets starred
4. **Fork Sync**: Option to pull updates from original (like GitHub)

### Long-term

1. **User Profiles**: Public profile pages showing user's public snippets
2. **Following**: Follow users to see their new public snippets
3. **Collections**: Curated lists of snippets
4. **Comments**: Discussion on snippets
5. **Snippet Requests**: "I need a snippet for X"

---

## Appendix

### Migration SQL

```sql
-- Create stars table
CREATE TABLE stars (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, snippet_id)
);

CREATE INDEX idx_stars_snippet_id ON stars(snippet_id);
CREATE INDEX idx_stars_user_id ON stars(user_id);

-- Add forked_from_id to snippets
ALTER TABLE snippets
ADD COLUMN forked_from_id TEXT REFERENCES snippets(id) ON DELETE SET NULL;

CREATE INDEX idx_snippets_forked_from ON snippets(forked_from_id);
```

### React Query Keys

```typescript
export const queryKeys = {
  explore: {
    all: ['explore'] as const,
    list: (filters: ExploreFilters) => ['explore', 'list', filters] as const,
    trending: ['explore', 'trending'] as const,
  },
  stars: {
    all: ['stars'] as const,
    list: ['stars', 'list'] as const,
    snippet: (id: string) => ['stars', 'snippet', id] as const,
  },
};
```
