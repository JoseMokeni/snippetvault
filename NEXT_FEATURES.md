# SnippetVault - Next Features Implementation Plan

> **Status**: Ready for implementation
> **Created**: 2026-01-03
> **All features are MAKABLE** - This document provides a structured roadmap

## Overview

This document outlines the implementation plan for the next phase of SnippetVault features, organized by priority and complexity. Each feature includes technical details, implementation steps, and dependencies.

---

## Table of Contents

1. [Quick Wins (Start Here)](#quick-wins)
2. [Public Sharing & Discovery](#public-sharing--discovery)
3. [User Experience Enhancements](#user-experience-enhancements)
4. [Advanced Features](#advanced-features)
5. [Import/Export System](#importexport-system)
6. [Implementation Order](#recommended-implementation-order)

---

## Quick Wins

### 1.1 Sort Options UI Dropdown
**Complexity**: Easy | **Time**: 1-2 hours | **Priority**: High

**Current State**:
- ✅ Backend sorting implemented (`sortBy`, `sortOrder` in API)
- ❌ No UI controls - users can't change sort order

**Implementation**:

**Step 1**: Create SortDropdown component
```tsx
// apps/web/src/components/sort-dropdown.tsx
- Dropdown with options: "Recently Updated", "Recently Created", "Title (A-Z)", "Title (Z-A)"
- Use shadcn/ui DropdownMenu component
- Icons from lucide-react: ArrowUpDown, Calendar, AlphabeticalVariant
```

**Step 2**: Integrate in dashboard
```tsx
// apps/web/src/routes/_authenticated/dashboard/index.tsx
- Add sort state to URL search params (e.g., ?sort=updatedAt-desc)
- Pass to API query
- Position next to search bar
```

**Files to modify**:
- `apps/web/src/components/sort-dropdown.tsx` (new)
- `apps/web/src/routes/_authenticated/dashboard/index.tsx`

---

### 1.2 Language Filter UI Dropdown
**Complexity**: Easy | **Time**: 1-2 hours | **Priority**: High

**Current State**:
- ✅ Backend language filtering implemented
- ✅ Language field indexed in DB
- ❌ No UI dropdown

**Implementation**:

**Step 1**: Create LanguageFilter component
```tsx
// apps/web/src/components/language-filter.tsx
- Dropdown/combobox with common languages
- Show count of snippets per language
- "All Languages" option to clear filter
```

**Step 2**: Fetch available languages
```typescript
// Option A: Add new endpoint
GET /api/snippets/languages
// Returns list of languages with counts

// Option B: Compute from snippets data (simpler, start here)
- Extract unique languages from fetched snippets
- Show in dropdown
```

**Step 3**: Integrate in dashboard
- Add to filter row alongside tags
- Update URL search params (?language=javascript)

**Files to modify**:
- `apps/web/src/components/language-filter.tsx` (new)
- `apps/web/src/routes/_authenticated/dashboard/index.tsx`
- Optionally: `apps/api/src/routes/snippets.ts` (for languages endpoint)

---

### 1.3 Basic Keyboard Shortcuts
**Complexity**: Easy | **Time**: 2-3 hours | **Priority**: High

**Shortcuts to implement**:
- `/` - Focus search input
- `Esc` - Close modals/dialogs, unfocus search
- `n` - Navigate to new snippet page

**Implementation**:

**Step 1**: Create useKeyboardShortcuts hook
```tsx
// apps/web/src/hooks/use-keyboard-shortcuts.ts
import { useEffect } from 'react'

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      switch (e.key) {
        case '/':
          e.preventDefault()
          document.querySelector('input[type="text"]')?.focus()
          break
        case 'n':
          // Navigate to /dashboard/new
          break
        case 'Escape':
          // Close modals, blur active element
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
```

**Step 2**: Add to dashboard layout
```tsx
// apps/web/src/routes/_authenticated/dashboard/index.tsx
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function DashboardPage() {
  useKeyboardShortcuts()
  // ... rest of component
}
```

**Step 3**: Add visual hints
- Small badge on search input: "Press / to search"
- Show keyboard shortcuts in help modal/tooltip

**Files to modify**:
- `apps/web/src/hooks/use-keyboard-shortcuts.ts` (new)
- `apps/web/src/routes/_authenticated/dashboard/index.tsx`

---

## Public Sharing & Discovery

### 2.1 Public Snippet Toggle
**Complexity**: Easy | **Time**: 1 hour | **Priority**: High

**Current State**:
- ✅ `isPublic` field in schema
- ✅ Backend accepts `isPublic` in create/update
- ❌ No UI toggle

**Implementation**:

**Step 1**: Add toggle to snippet edit form
```tsx
// apps/web/src/routes/_authenticated/dashboard/new.tsx
// apps/web/src/routes/_authenticated/dashboard/$id/edit.tsx

<div className="flex items-center gap-2">
  <Switch
    checked={isPublic}
    onCheckedChange={setIsPublic}
  />
  <label>Make this snippet public</label>
  <Info size={16} title="Public snippets can be viewed by anyone with the link" />
</div>
```

**Step 2**: Show public indicator on snippet cards
```tsx
// apps/web/src/components/snippet-card.tsx
{snippet.isPublic && (
  <Badge variant="outline" className="flex items-center gap-1">
    <Globe size={12} />
    Public
  </Badge>
)}
```

**Files to modify**:
- `apps/web/src/routes/_authenticated/dashboard/new.tsx`
- `apps/web/src/routes/_authenticated/dashboard/$id/edit.tsx`
- `apps/web/src/components/snippet-card.tsx`

---

### 2.2 Slug Generation & Shareable Links
**Complexity**: Medium | **Time**: 3-4 hours | **Priority**: High

**Current State**:
- ✅ `slug` field exists in schema
- ❌ Not populated automatically
- ❌ No shareable link UI

**Implementation**:

**Step 1**: Add slug generation utility
```typescript
// apps/api/src/lib/slug.ts
import { nanoid } from 'nanoid'

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens
    .slice(0, 50) // Max 50 chars

  const suffix = nanoid(8) // Short unique ID
  return `${base}-${suffix}`
}

export async function ensureUniqueSlug(
  db: Database,
  slug: string
): Promise<string> {
  const existing = await db.query.snippets.findFirst({
    where: eq(snippets.slug, slug)
  })

  if (!existing) return slug

  // If collision, regenerate
  return slug + '-' + nanoid(4)
}
```

**Step 2**: Generate slug on snippet creation
```typescript
// apps/api/src/routes/snippets.ts
// In POST /api/snippets

const slug = await ensureUniqueSlug(
  db,
  generateSlug(data.title)
)

await db.insert(snippets).values({
  // ... other fields
  slug,
})
```

**Step 3**: Add "Share" button to snippet view
```tsx
// apps/web/src/routes/_authenticated/dashboard/$id/index.tsx

{snippet.isPublic && snippet.slug && (
  <button onClick={() => {
    const url = `${window.location.origin}/s/${snippet.slug}`
    navigator.clipboard.writeText(url)
    showSuccess('Link copied to clipboard!')
  }}>
    <Share size={16} />
    Share
  </button>
)}
```

**Step 4**: Regenerate slugs for existing public snippets
```typescript
// Migration or one-time script
// apps/api/scripts/generate-slugs.ts
```

**Files to modify**:
- `apps/api/src/lib/slug.ts` (new)
- `apps/api/src/routes/snippets.ts`
- `apps/web/src/routes/_authenticated/dashboard/$id/index.tsx`
- `packages/db/src/schema/snippets.ts` (add index on slug)

**Database Migration**:
```sql
-- Add unique index on slug
CREATE UNIQUE INDEX idx_snippets_slug ON snippets(slug) WHERE slug IS NOT NULL;
```

---

### 2.3 Public Snippet Viewing (No Auth Required)
**Complexity**: Medium | **Time**: 3-4 hours | **Priority**: High

**Implementation**:

**Step 1**: Create public snippet endpoint
```typescript
// apps/api/src/routes/public.ts (new file)
import { Hono } from 'hono'

export function createPublicRoute(db: Database) {
  return new Hono()
    .get('/s/:slug', async (c) => {
      const slug = c.req.param('slug')

      const snippet = await db.query.snippets.findFirst({
        where: and(
          eq(snippets.slug, slug),
          eq(snippets.isPublic, true)
        ),
        with: {
          files: { orderBy: (files, { asc }) => [asc(files.order)] },
          variables: { orderBy: (variables, { asc }) => [asc(variables.order)] },
          snippetsTags: { with: { tag: true } },
        }
      })

      if (!snippet) {
        return c.json({ error: 'Snippet not found' }, 404)
      }

      return c.json({ snippet })
    })
}
```

**Step 2**: Register public routes (no auth middleware)
```typescript
// apps/api/src/routes/index.ts
import { createPublicRoute } from './public'

export const app = new Hono()
  .route('/public', createPublicRoute(db)) // No auth
  .route('/snippets', snippetsRoute) // Has auth
  // ... other routes
```

**Step 3**: Create public viewing page
```tsx
// apps/web/src/routes/s/$slug.tsx (new)
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/s/$slug')({
  loader: async ({ params }) => {
    const res = await fetch(`/api/public/s/${params.slug}`)
    if (!res.ok) throw new Error('Snippet not found')
    return res.json()
  },
  component: PublicSnippetPage,
})

function PublicSnippetPage() {
  const { snippet } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header with SnippetVault branding */}
      <header className="border-b border-border p-4">
        <h1>SnippetVault</h1>
      </header>

      {/* Snippet content (read-only view) */}
      <main className="container mx-auto p-8">
        <h1>{snippet.title}</h1>
        <p>{snippet.description}</p>

        {/* File viewer */}
        {snippet.files.map(file => (
          <CodeViewer key={file.id} file={file} />
        ))}

        {/* Variables display */}
        {/* Instructions */}

        {/* CTA to sign up */}
        <div className="mt-8 text-center">
          <p>Want to create your own snippets?</p>
          <Link to="/signup">Sign up for free</Link>
        </div>
      </main>
    </div>
  )
}
```

**Files to modify**:
- `apps/api/src/routes/public.ts` (new)
- `apps/api/src/routes/index.ts`
- `apps/web/src/routes/s/$slug.tsx` (new)

---

## User Experience Enhancements

### 3.1 Improved Empty States & Onboarding
**Complexity**: Medium | **Time**: 3-4 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Detect first-time users
```typescript
// Check if user has 0 snippets
const isFirstTime = snippets.length === 0 && !localStorage.getItem('onboarding_completed')
```

**Step 2**: Create interactive onboarding
```tsx
// apps/web/src/components/onboarding-guide.tsx
export function OnboardingGuide() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <h2 className="text-2xl font-bold mb-4">
        Welcome to SnippetVault! 👋
      </h2>

      <p className="mb-8">
        Let's create your first snippet. Here are some popular templates to get started:
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <TemplateCard
          title="React Component"
          description="Functional component with TypeScript"
          icon={<Code />}
          onClick={() => createFromTemplate('react-component')}
        />
        <TemplateCard
          title="Express API Route"
          description="RESTful endpoint with validation"
          icon={<Server />}
        />
        <TemplateCard
          title="Docker Compose"
          description="Multi-container setup"
          icon={<Container />}
        />
        <TemplateCard
          title="GitHub Workflow"
          description="CI/CD pipeline"
          icon={<Workflow />}
        />
      </div>

      <button onClick={() => /* start from scratch */}>
        Or start from scratch
      </button>
    </div>
  )
}
```

**Step 3**: Add tips & shortcuts overlay
```tsx
// Show dismissible tips for new users
- "Press / to search"
- "Click ⭐ to favorite a snippet"
- "Use tags to organize your snippets"
```

**Files to modify**:
- `apps/web/src/components/onboarding-guide.tsx` (new)
- `apps/web/src/routes/_authenticated/dashboard/index.tsx`

---

### 3.2 Command Palette (Cmd/Ctrl+K)
**Complexity**: Medium | **Time**: 4-5 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Install cmdk library
```bash
bun add cmdk
```

**Step 2**: Create CommandPalette component
```tsx
// apps/web/src/components/command-palette.tsx
import { Command } from 'cmdk'
import { useNavigate } from '@tanstack/react-router'

export function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate()

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />

      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Actions">
          <Command.Item onSelect={() => navigate('/dashboard/new')}>
            <Plus /> Create Snippet
          </Command.Item>
          <Command.Item onSelect={() => navigate('/dashboard?filter=favorites')}>
            <Star /> View Favorites
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Recent Snippets">
          {snippets.map(snippet => (
            <Command.Item
              key={snippet.id}
              onSelect={() => navigate(`/dashboard/${snippet.id}`)}
            >
              {snippet.title}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => navigate('/settings')}>
            Settings
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
```

**Step 3**: Add keyboard shortcut
```tsx
// In useKeyboardShortcuts hook
if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
  e.preventDefault()
  setCommandPaletteOpen(true)
}
```

**Files to modify**:
- `apps/web/src/components/command-palette.tsx` (new)
- `apps/web/src/hooks/use-keyboard-shortcuts.ts`
- `apps/web/src/routes/_authenticated.tsx` (add global state)

---

### 3.3 Snippet Templates
**Complexity**: Medium | **Time**: 4-6 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Define template structure
```typescript
// apps/web/src/lib/templates.ts
export interface SnippetTemplate {
  id: string
  name: string
  description: string
  language: string
  icon: React.ComponentType
  files: Array<{
    filename: string
    content: string
    language: string
  }>
  variables: Array<{
    name: string
    defaultValue: string
    description: string
  }>
  instructions: string
}

export const templates: SnippetTemplate[] = [
  {
    id: 'react-component',
    name: 'React Component',
    description: 'Functional component with TypeScript and props',
    language: 'typescript',
    icon: Code,
    files: [
      {
        filename: '{{componentName}}.tsx',
        language: 'typescript',
        content: `import React from 'react'

interface {{componentName}}Props {
  // Add your props here
}

export function {{componentName}}({ }: {{componentName}}Props) {
  return (
    <div>
      {/* Your component code */}
    </div>
  )
}`,
      },
      {
        filename: '{{componentName}}.test.tsx',
        language: 'typescript',
        content: `import { render, screen } from '@testing-library/react'
import { {{componentName}} } from './{{componentName}}'

describe('{{componentName}}', () => {
  it('renders correctly', () => {
    render(<{{componentName}} />)
    // Add your tests
  })
})`,
      }
    ],
    variables: [
      {
        name: 'componentName',
        defaultValue: 'MyComponent',
        description: 'Name of the component'
      }
    ],
    instructions: 'Replace componentName with your component name. Add props as needed.'
  },

  {
    id: 'express-route',
    name: 'Express API Route',
    description: 'RESTful endpoint with validation',
    language: 'javascript',
    icon: Server,
    files: [
      {
        filename: '{{routeName}}.route.js',
        language: 'javascript',
        content: `const express = require('express')
const router = express.Router()

// GET /api/{{routeName}}
router.get('/', async (req, res) => {
  try {
    // Your logic here
    res.json({ data: [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/{{routeName}}
router.post('/', async (req, res) => {
  try {
    const data = req.body
    // Your logic here
    res.status(201).json({ data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router`,
      }
    ],
    variables: [
      {
        name: 'routeName',
        defaultValue: 'users',
        description: 'Route name (plural)'
      }
    ],
    instructions: 'Update routeName and add your business logic.'
  },

  {
    id: 'docker-compose',
    name: 'Docker Compose',
    description: 'Multi-container application setup',
    language: 'yaml',
    icon: Container,
    files: [
      {
        filename: 'docker-compose.yml',
        language: 'yaml',
        content: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "{{appPort}}:{{appPort}}"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://{{dbUser}}:{{dbPassword}}@db:5432/{{dbName}}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: {{dbUser}}
      POSTGRES_PASSWORD: {{dbPassword}}
      POSTGRES_DB: {{dbName}}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
      },
      {
        filename: 'Dockerfile',
        language: 'dockerfile',
        content: `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE {{appPort}}

CMD ["npm", "start"]`,
      }
    ],
    variables: [
      { name: 'appPort', defaultValue: '3000', description: 'Application port' },
      { name: 'dbUser', defaultValue: 'postgres', description: 'Database user' },
      { name: 'dbPassword', defaultValue: 'password', description: 'Database password' },
      { name: 'dbName', defaultValue: 'myapp', description: 'Database name' },
    ],
    instructions: 'Update variables and add additional services as needed.'
  },

  {
    id: 'github-workflow',
    name: 'GitHub Actions Workflow',
    description: 'CI/CD pipeline for Node.js',
    language: 'yaml',
    icon: Workflow,
    files: [
      {
        filename: '.github/workflows/ci.yml',
        language: 'yaml',
        content: `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{nodeVersion}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build`,
      }
    ],
    variables: [
      { name: 'nodeVersion', defaultValue: '20', description: 'Node.js version' },
    ],
    instructions: 'Customize workflow steps based on your project needs.'
  }
]
```

**Step 2**: Create template browser
```tsx
// apps/web/src/routes/_authenticated/dashboard/templates.tsx
export const Route = createFileRoute('/_authenticated/dashboard/templates')({
  component: TemplatesPage,
})

function TemplatesPage() {
  const navigate = useNavigate()

  const handleUseTemplate = (templateId: string) => {
    navigate('/dashboard/new', {
      state: { templateId }
    })
  }

  return (
    <div className="p-8">
      <h1>Snippet Templates</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() => handleUseTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 3**: Pre-fill new snippet form from template
```tsx
// apps/web/src/routes/_authenticated/dashboard/new.tsx
export const Route = createFileRoute('/_authenticated/dashboard/new')({
  component: NewSnippetPage,
})

function NewSnippetPage() {
  const location = useLocation()
  const templateId = location.state?.templateId

  // Load template if provided
  const template = templates.find(t => t.id === templateId)

  // Pre-fill form with template data
  const [formData, setFormData] = useState({
    title: template?.name || '',
    language: template?.language || 'javascript',
    files: template?.files || [],
    variables: template?.variables || [],
    instructions: template?.instructions || '',
  })

  // ... rest of form
}
```

**Files to modify**:
- `apps/web/src/lib/templates.ts` (new)
- `apps/web/src/routes/_authenticated/dashboard/templates.tsx` (new)
- `apps/web/src/routes/_authenticated/dashboard/new.tsx`
- `apps/web/src/components/template-card.tsx` (new)

---

## Advanced Features

### 4.1 Advanced Filtering - Multiple Tags (AND/OR)
**Complexity**: Medium | **Time**: 4-5 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Update API to accept multiple tags
```typescript
// apps/api/src/lib/validators.ts
export const snippetQuerySchema = z.object({
  // ... existing fields
  tags: z.array(z.string()).optional(), // New: multiple tags
  tagMode: z.enum(['AND', 'OR']).optional().default('OR'), // Match all or any
})
```

**Step 2**: Implement backend logic
```typescript
// apps/api/src/routes/snippets.ts

if (query.tags && query.tags.length > 0) {
  // Fetch tag IDs
  const tagRecords = await db
    .select()
    .from(tags)
    .where(
      and(
        inArray(tags.name, query.tags),
        eq(tags.userId, userId)
      )
    )

  const tagIds = tagRecords.map(t => t.id)

  if (query.tagMode === 'AND') {
    // Snippets must have ALL tags
    const snippetsWithAllTags = await db
      .select({ snippetId: snippetsTags.snippetId })
      .from(snippetsTags)
      .where(inArray(snippetsTags.tagId, tagIds))
      .groupBy(snippetsTags.snippetId)
      .having(sql`COUNT(DISTINCT ${snippetsTags.tagId}) = ${tagIds.length}`)

    const matchingIds = snippetsWithAllTags.map(s => s.snippetId)
    // Filter userSnippets by matchingIds
  } else {
    // Snippets can have ANY tag (existing logic)
    // ...
  }
}
```

**Step 3**: Update UI for multi-select
```tsx
// apps/web/src/components/tag-filter.tsx
export function TagFilter() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [matchMode, setMatchMode] = useState<'AND' | 'OR'>('OR')

  return (
    <div>
      {/* Multi-select dropdown */}
      <MultiSelect
        options={tags}
        value={selectedTags}
        onChange={setSelectedTags}
      />

      {/* AND/OR toggle (show only if multiple tags selected) */}
      {selectedTags.length > 1 && (
        <SegmentedControl
          options={[
            { label: 'Match Any', value: 'OR' },
            { label: 'Match All', value: 'AND' }
          ]}
          value={matchMode}
          onChange={setMatchMode}
        />
      )}
    </div>
  )
}
```

**Files to modify**:
- `apps/api/src/lib/validators.ts`
- `apps/api/src/routes/snippets.ts`
- `apps/web/src/components/tag-filter.tsx` (new)

---

### 4.2 Date Range Filtering
**Complexity**: Medium | **Time**: 3-4 hours | **Priority**: Low

**Implementation**:

**Step 1**: Update API schema
```typescript
export const snippetQuerySchema = z.object({
  // ... existing
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
})
```

**Step 2**: Add filtering logic
```typescript
// apps/api/src/routes/snippets.ts

if (query.createdAfter) {
  conditions.push(gte(snippets.createdAt, new Date(query.createdAfter)))
}
if (query.createdBefore) {
  conditions.push(lte(snippets.createdAt, new Date(query.createdBefore)))
}
// Same for updatedAfter/updatedBefore
```

**Step 3**: Add date picker UI
```bash
bun add react-day-picker date-fns
```

```tsx
// apps/web/src/components/date-range-filter.tsx
import { DateRange, DayPicker } from 'react-day-picker'

export function DateRangeFilter() {
  const [range, setRange] = useState<DateRange>()

  return (
    <Popover>
      <PopoverTrigger>
        <Calendar /> Filter by date
      </PopoverTrigger>
      <PopoverContent>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
        />
      </PopoverContent>
    </Popover>
  )
}
```

**Files to modify**:
- `apps/api/src/lib/validators.ts`
- `apps/api/src/routes/snippets.ts`
- `apps/web/src/components/date-range-filter.tsx` (new)

---

## Import/Export System

### 5.1 Export Multiple Snippets as ZIP
**Complexity**: Medium-High | **Time**: 5-6 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Install ZIP library
```bash
bun add jszip
bun add --dev @types/jszip
```

**Step 2**: Create export utility
```typescript
// apps/web/src/lib/export.ts
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function exportSnippetsAsZip(snippets: Snippet[]) {
  const zip = new JSZip()

  for (const snippet of snippets) {
    const folder = zip.folder(sanitizeFilename(snippet.title))

    // Add README with snippet metadata
    folder?.file('README.md', `# ${snippet.title}

${snippet.description || ''}

## Instructions
${snippet.instructions || 'No instructions provided'}

## Variables
${snippet.variables?.map(v => `- ${v.name}: ${v.description || v.defaultValue}`).join('\n')}

## Tags
${snippet.tags?.map(t => t.name).join(', ')}
`)

    // Add each file
    for (const file of snippet.files) {
      folder?.file(file.filename, file.content)
    }

    // Add variables.json
    if (snippet.variables.length > 0) {
      folder?.file('variables.json', JSON.stringify(snippet.variables, null, 2))
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `snippetvault-export-${Date.now()}.zip`)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}
```

**Step 3**: Add bulk selection UI
```tsx
// apps/web/src/routes/_authenticated/dashboard/index.tsx

const [selectedSnippets, setSelectedSnippets] = useState<string[]>([])
const [selectionMode, setSelectionMode] = useState(false)

// Add checkbox to each snippet card
// Add "Export Selected" button in header

const handleExportSelected = () => {
  const snippetsToExport = snippets.filter(s =>
    selectedSnippets.includes(s.id)
  )
  exportSnippetsAsZip(snippetsToExport)
}
```

**Files to modify**:
- `apps/web/src/lib/export.ts` (new)
- `apps/web/src/routes/_authenticated/dashboard/index.tsx`
- `apps/web/src/components/snippet-card.tsx`

---

### 5.2 Import from File/URL
**Complexity**: Medium-High | **Time**: 5-7 hours | **Priority**: Medium

**Implementation**:

**Step 1**: Create import parser
```typescript
// apps/web/src/lib/import.ts

export interface ImportSource {
  type: 'file' | 'url' | 'gist'
  data: File | string
}

export async function parseImportSource(source: ImportSource): Promise<SnippetImport> {
  if (source.type === 'file') {
    // Parse ZIP file
    if (source.data.name.endsWith('.zip')) {
      return parseZipFile(source.data as File)
    }

    // Parse single file
    return parseSingleFile(source.data as File)
  }

  if (source.type === 'url') {
    // Fetch and parse URL content
    const response = await fetch(source.data as string)
    const content = await response.text()
    return parseUrlContent(content, source.data as string)
  }

  // ... GitHub Gist import
}

async function parseZipFile(file: File): Promise<SnippetImport> {
  const zip = await JSZip.loadAsync(file)
  const snippets: SnippetImport[] = []

  // Iterate through folders (each folder = one snippet)
  const folders = Object.keys(zip.files)
    .filter(path => zip.files[path].dir)

  for (const folder of folders) {
    const files = Object.keys(zip.files)
      .filter(path => path.startsWith(folder) && !zip.files[path].dir)

    const snippetFiles = []
    let readme = ''
    let variables = []

    for (const filePath of files) {
      const content = await zip.files[filePath].async('string')
      const filename = filePath.replace(folder, '')

      if (filename === 'README.md') {
        readme = content
        // Parse metadata from README
      } else if (filename === 'variables.json') {
        variables = JSON.parse(content)
      } else {
        snippetFiles.push({
          filename,
          content,
          language: detectLanguage(filename)
        })
      }
    }

    snippets.push({
      title: folder,
      files: snippetFiles,
      variables,
      // ... parse from README
    })
  }

  return snippets
}
```

**Step 2**: Create import UI
```tsx
// apps/web/src/routes/_authenticated/dashboard/import.tsx

export const Route = createFileRoute('/_authenticated/dashboard/import')({
  component: ImportPage,
})

function ImportPage() {
  const [importType, setImportType] = useState<'file' | 'url' | 'gist'>('file')
  const [preview, setPreview] = useState<SnippetImport[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const parsed = await parseImportSource({ type: 'file', data: file })
    setPreview(parsed)
  }

  return (
    <div className="p-8">
      <h1>Import Snippets</h1>

      <Tabs value={importType} onValueChange={setImportType}>
        <TabsList>
          <TabsTrigger value="file">From File</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
          <TabsTrigger value="gist">From GitHub Gist</TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <input
            type="file"
            accept=".zip,.json,.js,.ts,.py"
            onChange={handleFileUpload}
          />
        </TabsContent>

        <TabsContent value="url">
          <input
            type="url"
            placeholder="https://example.com/snippet.js"
            onChange={handleUrlInput}
          />
        </TabsContent>

        <TabsContent value="gist">
          <input
            type="text"
            placeholder="Gist ID or URL"
            onChange={handleGistInput}
          />
        </TabsContent>
      </Tabs>

      {/* Preview imported snippets */}
      {preview.length > 0 && (
        <div className="mt-8">
          <h2>Preview ({preview.length} snippets)</h2>

          {preview.map((snippet, idx) => (
            <ImportPreviewCard key={idx} snippet={snippet} />
          ))}

          <button onClick={handleConfirmImport}>
            Import {preview.length} snippets
          </button>
        </div>
      )}
    </div>
  )
}
```

**Files to modify**:
- `apps/web/src/lib/import.ts` (new)
- `apps/web/src/routes/_authenticated/dashboard/import.tsx` (new)

---

### 5.3 GitHub Gist Integration
**Complexity**: High | **Time**: 8-10 hours | **Priority**: Low

**Implementation**:

**Step 1**: Set up GitHub OAuth (optional, for private gists)
```typescript
// For public gists, no auth needed
// For private gists, need GitHub OAuth

// apps/api/src/lib/github.ts
export async function fetchGist(gistId: string, token?: string) {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  }

  if (token) {
    headers['Authorization'] = `token ${token}`
  }

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers
  })

  if (!response.ok) {
    throw new Error('Failed to fetch gist')
  }

  return response.json()
}
```

**Step 2**: Create export to Gist endpoint
```typescript
// apps/api/src/routes/snippets.ts

.post('/:id/export/gist', async (c) => {
  const userId = c.get('userId')
  const snippetId = c.req.param('id')

  // Fetch user's GitHub token from settings
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user?.githubToken) {
    return c.json({ error: 'GitHub integration not set up' }, 400)
  }

  // Fetch snippet
  const snippet = await db.query.snippets.findFirst({
    where: and(eq(snippets.id, snippetId), eq(snippets.userId, userId)),
    with: { files: true, variables: true }
  })

  if (!snippet) {
    return c.json({ error: 'Snippet not found' }, 404)
  }

  // Create Gist
  const gistFiles: Record<string, { content: string }> = {}

  for (const file of snippet.files) {
    gistFiles[file.filename] = { content: file.content }
  }

  // Add README
  gistFiles['README.md'] = {
    content: `# ${snippet.title}\n\n${snippet.description || ''}`
  }

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${user.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      description: snippet.title,
      public: snippet.isPublic,
      files: gistFiles
    })
  })

  const gist = await response.json()

  return c.json({
    gistUrl: gist.html_url,
    gistId: gist.id
  })
})
```

**Step 3**: Add GitHub token to user settings
```tsx
// apps/web/src/routes/_authenticated/settings/index.tsx

<div>
  <h3>GitHub Integration</h3>
  <p>Connect your GitHub account to export snippets as Gists</p>

  <button onClick={connectGitHub}>
    Connect GitHub
  </button>

  {/* Or manual token entry */}
  <input
    type="password"
    placeholder="GitHub Personal Access Token"
    value={githubToken}
    onChange={e => setGithubToken(e.target.value)}
  />
</div>
```

**Files to modify**:
- `apps/api/src/lib/github.ts` (new)
- `apps/api/src/routes/snippets.ts`
- `apps/web/src/routes/_authenticated/settings/index.tsx`
- `packages/db/src/schema/users.ts` (add githubToken field)

**Database Migration**:
```sql
ALTER TABLE users ADD COLUMN github_token TEXT;
```

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Week 1)
**Priority**: Start here for immediate impact

1. ✅ Sort options UI dropdown (1-2 hours)
2. ✅ Language filter UI dropdown (1-2 hours)
3. ✅ Public snippet toggle (1 hour)
4. ✅ Basic keyboard shortcuts (/, Esc, N) (2-3 hours)

**Total**: ~6-8 hours
**Impact**: High - improves UX with minimal effort

---

### Phase 2: Public Sharing (Week 2)
**Priority**: Core feature

5. ✅ Slug generation & shareable links (3-4 hours)
6. ✅ Public snippet viewing page (3-4 hours)

**Total**: ~6-8 hours
**Impact**: High - enables sharing, key differentiator

---

### Phase 3: UX Enhancements (Week 3)
**Priority**: User engagement

7. ✅ Improved empty states & onboarding (3-4 hours)
8. ✅ Snippet templates (4-6 hours)
9. ✅ Command palette (Cmd/Ctrl+K) (4-5 hours)

**Total**: ~11-15 hours
**Impact**: Medium-High - improves onboarding and productivity

---

### Phase 4: Advanced Filtering (Week 4)
**Priority**: Power users

10. ✅ Multiple tag filtering (AND/OR) (4-5 hours)
11. ✅ Date range filtering (3-4 hours)

**Total**: ~7-9 hours
**Impact**: Medium - useful for large collections

---

### Phase 5: Import/Export (Week 5-6)
**Priority**: Data portability

12. ✅ Export as ZIP (5-6 hours)
13. ✅ Import from file/URL (5-7 hours)
14. ✅ GitHub Gist integration (8-10 hours)

**Total**: ~18-23 hours
**Impact**: Medium - important for migration, backup

---

## Technical Considerations

### Performance
- Add database indices for new query patterns:
  - `idx_snippets_slug` (unique)
  - `idx_snippets_is_public` (for public viewing)
- Consider pagination for export (large snippet counts)

### Security
- Public snippets: Ensure userId is hidden in public API
- GitHub tokens: Store encrypted in database
- Input validation: Sanitize imported content
- Rate limiting on public routes

### Testing
Each feature should include:
- Unit tests for utilities (slug generation, import parsing)
- API endpoint tests (public routes, filtering)
- E2E tests for critical flows (import, export, sharing)

### Accessibility
- Keyboard shortcuts: Don't conflict with browser/screen reader shortcuts
- Command palette: Keyboard navigable
- Announcements for dynamic actions (export complete, etc.)

---

## Success Metrics

Track these to measure feature impact:

1. **Public Sharing**
   - % of snippets made public
   - Number of public views
   - Share link clicks

2. **Templates**
   - Template usage rate (vs. blank snippets)
   - Most popular templates

3. **Keyboard Shortcuts**
   - Usage frequency
   - Most-used shortcuts

4. **Import/Export**
   - Number of exports
   - Average snippets per export
   - Import success rate

5. **Filtering**
   - Filter usage patterns
   - Multi-tag vs. single tag usage

---

## Future Considerations

After completing these features, consider:

1. **Collaboration**
   - Share snippets with specific users
   - Team workspaces
   - Comments on snippets

2. **Versioning**
   - Track snippet history
   - Restore previous versions
   - Diff view

3. **AI Features**
   - Auto-tagging
   - Language detection
   - Variable extraction
   - Template suggestions

4. **Mobile App**
   - React Native app
   - Quick snippet capture
   - Offline access

5. **Browser Extension**
   - Save code from any page
   - Quick search
   - Copy with variable replacement

---

## Questions & Decisions

Before starting implementation, decide:

1. **Public Snippets**
   - SEO optimization? (meta tags, sitemap)
   - Social sharing cards (Open Graph)?
   - Rate limiting strategy?

2. **Templates**
   - Allow user-created templates?
   - Template marketplace?
   - Template versioning?

3. **GitHub Integration**
   - OAuth or PAT?
   - Sync both ways (import from Gist)?
   - Auto-update Gist on snippet change?

4. **Export**
   - Support other formats (JSON, markdown)?
   - Scheduled exports / backups?
   - Cloud storage integration (Drive, Dropbox)?

---

## Summary

**All 10 feature groups are makable** with varying complexity:

✅ **Easy**: Sort UI, Language filter, Public toggle, Basic shortcuts
✅ **Medium**: Sharing, Onboarding, Templates, Multi-tag filter, Date filter, ZIP export
✅ **Complex**: Command palette, Import system, Gist integration

**Recommended approach**: Start with Phase 1 (Quick Wins) to build momentum, then tackle public sharing (Phase 2) as it's a key differentiator. UX enhancements and advanced features can follow based on user feedback.

**Estimated total**: 48-63 hours across all features
**Timeline**: 5-6 weeks for complete implementation

Let's build this! 🚀
