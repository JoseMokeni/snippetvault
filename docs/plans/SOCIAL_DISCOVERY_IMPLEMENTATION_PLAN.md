# Social Discovery - Implementation Plan

> **Created**: 2026-01-08
> **Status**: In Progress
> **Reference**: [SOCIAL_DISCOVERY.md](../architecture/SOCIAL_DISCOVERY.md)

---

## Decisions Made

| Question                        | Decision                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Starred/Favorites/Public routes | Dedicated routes: `/dashboard/starred`, `/dashboard/favorites`, `/dashboard/public` |
| Explore authentication          | Public route with optional auth (like GitHub)                                       |
| Fork title behavior             | Append "(Fork)" + allow user customization in modal                                 |
| Star/Fork counts                | On-the-fly `COUNT(*)` queries (Option A)                                            |
| Snippet detail URL from explore | Use existing `/s/{slug}` route                                                      |
| Author display                  | New `username` field on users table                                                 |
| Rate limiting                   | Deferred to later iteration                                                         |

---

## Database Changes

### 1. New Table: `stars`

```typescript
// packages/db/src/schema/stars.ts
export const stars = pgTable(
  "stars",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    snippetId: text("snippet_id")
      .notNull()
      .references(() => snippets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.snippetId] }),
    snippetIdx: index("idx_stars_snippet_id").on(table.snippetId),
    userIdx: index("idx_stars_user_id").on(table.userId),
  })
);
```

### 2. Modify `snippets` Table

Add `forkedFromId` column:

```typescript
forkedFromId: text('forked_from_id')
  .references(() => snippets.id, { onDelete: 'set null' }),
```

Add index:

```typescript
forkedFromIdx: index('idx_snippets_forked_from').on(table.forkedFromId),
```

### 3. Modify `users` Table

Add `username` column:

```typescript
username: text('username').unique(),
```

---

## API Routes

### Explore Routes (`/api/explore`)

| Method | Endpoint                 | Auth     | Description                         |
| ------ | ------------------------ | -------- | ----------------------------------- |
| GET    | `/api/explore`           | Optional | List public snippets with filters   |
| GET    | `/api/explore/languages` | None     | Get available languages with counts |

**GET /api/explore Query Params:**

- `q` - Search query (title, description)
- `language` - Filter by language
- `tag` - Filter by tag name
- `sort` - `stars` | `recent` | `forks` (default: `stars`)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)

### Stars Routes (`/api/stars`)

| Method | Endpoint                | Auth     | Description                 |
| ------ | ----------------------- | -------- | --------------------------- |
| GET    | `/api/stars`            | Required | Get user's starred snippets |
| POST   | `/api/stars/:snippetId` | Required | Star a snippet              |
| DELETE | `/api/stars/:snippetId` | Required | Unstar a snippet            |

### Fork Route

| Method | Endpoint                 | Auth     | Description           |
| ------ | ------------------------ | -------- | --------------------- |
| POST   | `/api/snippets/:id/fork` | Required | Fork a public snippet |

**POST /api/snippets/:id/fork Body:**

```typescript
{
  title?: string;      // Custom title (default: "Original Title (Fork)")
  isPublic?: boolean;  // Make fork public (default: false)
}
```

---

## Frontend Routes

### New Routes

| Route                  | Component       | Auth     | Description               |
| ---------------------- | --------------- | -------- | ------------------------- |
| `/explore`             | `explore.tsx`   | Public   | Browse community snippets |
| `/dashboard/starred`   | `starred.tsx`   | Required | User's starred snippets   |
| `/dashboard/favorites` | `favorites.tsx` | Required | User's favorite snippets  |
| `/dashboard/public`    | `public.tsx`    | Required | User's public snippets    |

### Modified Routes

| Route             | Changes                                       |
| ----------------- | --------------------------------------------- |
| `/s/$slug`        | Add star/fork buttons for authenticated users |
| `/_authenticated` | Update sidebar navigation links               |

---

## Components to Create

| Component                  | Location      | Description                    |
| -------------------------- | ------------- | ------------------------------ |
| `star-button.tsx`          | `components/` | Star/unstar toggle button      |
| `fork-button.tsx`          | `components/` | Fork button with modal trigger |
| `fork-modal.tsx`           | `components/` | Fork configuration modal       |
| `explore-snippet-card.tsx` | `components/` | Snippet card for explore page  |
| `explore-filters.tsx`      | `components/` | Filter bar for explore page    |

---

## Implementation Checklist

### Phase 1: Database & Backend Foundation

- [ ] Create `stars` schema file
- [ ] Add `forkedFromId` to snippets schema
- [ ] Add `username` to users schema
- [ ] Export new schema from index
- [ ] Generate migration
- [ ] Run migration
- [ ] Create `stars.ts` route file
- [ ] Create `explore.ts` route file
- [ ] Add fork endpoint to snippets route
- [ ] Register new routes in index
- [ ] Add validators for new endpoints

### Phase 2: Explore Page

- [ ] Create `/explore` route (public)
- [ ] Create `explore-snippet-card.tsx`
- [ ] Create `explore-filters.tsx`
- [ ] Implement search functionality
- [ ] Implement language filter
- [ ] Implement tag filter
- [ ] Implement sort options
- [ ] Implement pagination

### Phase 3: Star System UI

- [ ] Create `star-button.tsx`
- [ ] Add star button to explore cards
- [ ] Add star button to `/s/$slug` page
- [ ] Create `/dashboard/starred` route
- [ ] Update sidebar with Starred link
- [ ] Implement optimistic updates

### Phase 4: Fork System UI

- [ ] Create `fork-button.tsx`
- [ ] Create `fork-modal.tsx`
- [ ] Add fork button to `/s/$slug` page
- [ ] Handle fork flow and redirect
- [ ] Display fork attribution on snippets
- [ ] Handle "already forked" state

### Phase 5: Dashboard Route Refactoring

- [ ] Create `/dashboard/favorites` route
- [ ] Create `/dashboard/public` route
- [ ] Update `/dashboard` index to show all snippets
- [ ] Update sidebar navigation
- [ ] Remove filter query params from old links

### Phase 6: Testing

- [ ] Write tests for stars API
- [ ] Write tests for explore API
- [ ] Write tests for fork endpoint
- [ ] Test edge cases (own snippet, private snippet, etc.)

---

## File Structure (New/Modified)

```
packages/db/src/schema/
├── stars.ts          # NEW
├── snippets.ts       # MODIFIED (add forkedFromId)
├── users.ts          # MODIFIED (add username)
└── index.ts          # MODIFIED (export stars)

apps/api/src/routes/
├── explore.ts        # NEW
├── stars.ts          # NEW
├── snippets.ts       # MODIFIED (add fork endpoint)
└── index.ts          # MODIFIED (register routes)

apps/api/src/lib/
└── validators.ts     # MODIFIED (add new schemas)

apps/web/src/routes/
├── explore.tsx       # NEW
├── _authenticated/
│   └── dashboard/
│       ├── starred.tsx    # NEW
│       ├── favorites.tsx  # NEW
│       └── public.tsx     # NEW
└── s.$slug.tsx       # MODIFIED (add star/fork)

apps/web/src/components/
├── star-button.tsx           # NEW
├── fork-button.tsx           # NEW
├── fork-modal.tsx            # NEW
├── explore-snippet-card.tsx  # NEW
└── explore-filters.tsx       # NEW
```

---

## Notes

- Username generation: When user signs up, auto-generate from name (e.g., "John Doe" → "john-doe") with uniqueness check
- Existing users: Will need to set username on first visit to explore/social features
- Fork count: Calculated as `COUNT(*) FROM snippets WHERE forked_from_id = ?`
- Star count: Calculated as `COUNT(*) FROM stars WHERE snippet_id = ?`
