# SnippetVault - UI Design Specification

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System & Typography](#color-system--typography)
3. [Main Views](#main-views)
4. [Component Library](#component-library)
5. [User Flows](#user-flows)
6. [Responsive Behavior](#responsive-behavior)
7. [API Endpoints to UI Mapping](#api-endpoints-to-ui-mapping)

---

## Design Principles

### Core Philosophy
- **Simplicity First**: Clean, uncluttered interface focused on code snippets
- **Developer-Centric**: Dark theme, syntax highlighting, keyboard shortcuts
- **Fast Access**: Quick search, filters, and copy actions
- **Visual Hierarchy**: Clear distinction between snippet metadata and code content

### UX Goals
- **Zero to First Snippet**: < 2 minutes from signup to first saved snippet
- **Find and Export**: < 30 seconds to find and copy a snippet
- **Multi-File Support**: Clear visual representation of file structure
- **Variable Templating**: Intuitive variable substitution workflow

---

## Color System & Typography

### Primary Colors
```
Background:    #0a0a0a (dark mode primary)
Surface:       #151515 (cards, panels)
Border:        #2a2a2a (subtle dividers)
Primary:       #3b82f6 (blue - actions, links)
Success:       #10b981 (green - confirmations)
Warning:       #f59e0b (amber - alerts)
Danger:        #ef4444 (red - deletions)
```

### Typography
```
Headings:   Inter (sans-serif)
Body:       Inter (sans-serif)
Code:       Fira Code / JetBrains Mono (monospace)
```

### Spacing Scale
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

---

## Main Views

### 1. Authentication Pages

#### Login Page
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [SnippetVault Logo]                │
│                                                 │
│         ╔═══════════════════════════╗           │
│         ║   Sign In to SnippetVault ║           │
│         ╚═══════════════════════════╝           │
│                                                 │
│         Email                                   │
│         ┌─────────────────────────┐             │
│         │ you@example.com         │             │
│         └─────────────────────────┘             │
│                                                 │
│         Password                                │
│         ┌─────────────────────────┐             │
│         │ ••••••••••••           │             │
│         └─────────────────────────┘             │
│                                                 │
│         ┌─────────────────────────┐             │
│         │      Sign In            │             │
│         └─────────────────────────┘             │
│                                                 │
│         Don't have an account?                  │
│         [Create one] →                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- Centered card layout
- Email + Password fields
- Primary CTA button
- Link to register page
- No distractions - focus on login

---

### 2. Dashboard - Snippets List

```
┌──────────────────────────────────────────────────────────────────┐
│  SnippetVault                                   [User Menu ▾]    │
├────────────┬─────────────────────────────────────────────────────┤
│            │  ┌──────────────────────────────────────────┐       │
│ All        │  │ 🔍 Search snippets...                  │       │
│ Favorites  │  └──────────────────────────────────────────┘       │
│            │                                                     │
│ TAGS       │  [All] [JavaScript] [Docker] [React] [★ Favorites] │
│ • Docker   │                                                     │
│ • React    │  ┌────────────────┐  ┌────────────────┐            │
│ • Node.js  │  │ Docker Setup   │  │ React Hook     │            │
│ • API      │  │ ★              │  │                │            │
│            │  │ Complete...    │  │ Custom auth... │            │
│ + New Tag  │  │                │  │                │            │
│            │  │ 3 files        │  │ 2 files        │            │
│            │  │ [Docker] [Dev] │  │ [React] [TS]   │            │
│            │  └────────────────┘  └────────────────┘            │
│            │                                                     │
│ [+ New     │  ┌────────────────┐  ┌────────────────┐            │
│  Snippet]  │  │ Express API    │  │ Tailwind...    │            │
│            │  │                │  │ ★              │            │
└────────────┴─────────────────────────────────────────────────────┘
```

**Layout Sections:**

1. **Header (Top Bar)**
   - Logo/App name (left)
   - User menu (right): Name, Settings, Logout

2. **Sidebar (Left - 240px)**
   - Navigation links:
     - All Snippets
     - Favorites (with count badge)
   - Tags section:
     - List of user tags (colored dots)
     - Click to filter
     - "Add Tag" button
   - "New Snippet" primary button (bottom)

3. **Main Content (Center)**
   - Search bar (full width, sticky)
   - Filter chips (language, tags, favorites)
   - Snippet cards grid (2-3 columns, responsive)

---

### 3. Snippet Card Component

```
┌────────────────────────────────────────┐
│ Docker Node.js Setup              [★]  │
│                                        │
│ Complete Docker configuration for      │
│ Node.js applications with compose...   │
│                                        │
│ 📁 3 files                             │
│ 🔤 Dockerfile · 2 variables            │
│                                        │
│ [Docker] [DevOps] [Node.js]            │
│                                        │
│ Updated 2 days ago                     │
└────────────────────────────────────────┘
```

**Card Elements:**
- Title (clickable, navigates to detail)
- Favorite star (top right, toggle)
- Description (truncated to 2 lines)
- Metadata row:
  - File count icon
  - Main language badge
  - Variables count (if any)
- Tags (colored badges)
- Timestamp (last updated)

**States:**
- Hover: Subtle lift shadow, cursor pointer
- Favorite: Filled star (gold)
- Selected: Blue border (if implementing multi-select later)

---

### 4. Snippet Detail View

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Snippets                          [Edit] [Export] [⋮] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Docker Node.js Setup                                       [★]  │
│  Complete Docker configuration for Node.js applications          │
│                                                                  │
│  [Docker] [DevOps] [Node.js]                                    │
│                                                                  │
│  ┌─ Instructions ──────────────────────────────────────────────┐ │
│  │ ## How to use                                              │ │
│  │ 1. Copy files to your project root                        │ │
│  │ 2. Customize variables (PROJECT_NAME, PORT, etc.)         │ │
│  │ 3. Run `docker-compose up -d`                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Files ──────────────────────────────────────────────────────│
│  │ 📁 Project Files                                            │
│  │   ├─ 📄 Dockerfile                                [Copy]    │
│  │   ├─ 📄 docker-compose.yml                        [Copy]    │
│  │   └─ 📄 .dockerignore                             [Copy]    │
│  │                                                              │
│  │ ┌─ Dockerfile ──────────────────────────────────────────┐   │
│  │ │  1  FROM node:{{NODE_VERSION}}-alpine              │   │
│  │ │  2                                                   │   │
│  │ │  3  WORKDIR /app                                    │   │
│  │ │  4                                                   │   │
│  │ │  5  COPY package*.json ./                           │   │
│  │ │  6  RUN npm ci --only=production                    │   │
│  │ │  7                                                   │   │
│  │ │  8  COPY . .                                        │   │
│  │ │  9                                                   │   │
│  │ │ 10  EXPOSE {{PORT}}                                 │   │
│  │ │ 11                                                   │   │
│  │ │ 12  CMD ["node", "dist/index.js"]                   │   │
│  │ └──────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌─ Variables ──────────────────────────────────────────────────│
│  │ PROJECT_NAME  →  my-app          (Container name)           │
│  │ NODE_VERSION  →  20              (Node.js version)          │
│  │ PORT          →  3000            (Exposed port)             │
│  └──────────────────────────────────────────────────────────────│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**View Sections:**

1. **Header**
   - Back button
   - Actions: Edit, Export, More menu (Duplicate, Delete)
   - Title + favorite star
   - Description
   - Tags

2. **Instructions Panel** (Collapsible)
   - Markdown rendering
   - Usage instructions
   - Can be edited in edit mode

3. **Files Panel**
   - File tree (left sidebar within panel)
   - Code viewer (right, takes most space)
   - Syntax highlighting based on file language
   - Line numbers
   - Copy button per file
   - Tab navigation alternative (for < 5 files)

4. **Variables Panel** (Bottom)
   - List of defined variables
   - Name → Default Value (Description)
   - Shows template placeholders used

---

### 5. Snippet Edit/Create View (with Folder Structure)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Cancel                                                  [Save]     │
├──────────────────────────────────────────────────────────────────────┤
│  New Snippet                                                         │
│                                                                      │
│  Title *                                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ React Component Library                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Description                                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Reusable React components with TypeScript and tests            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Language      Tags                                                 │
│  [TypeScript▾] [React] [Components] [+ Add tag]                     │
│                                                                      │
│  ┌─ File Structure ────────────────────────────────────────────────┐│
│  │ ┌─ Tree View ──────┐ ┌─ Editor ─────────────────────────────┐  ││
│  │ │ 📁 Project        │ │ Filename: src/components/Button.tsx  │  ││
│  │ │   ├─ 📁 src       │ │ Language: [Auto-detect ▾]            │  ││
│  │ │   │  ├─ 📁 comp...│ │                                       │  ││
│  │ │   │  │  ├─ 📄 Bu │ │ ┌───────────────────────────────────┐ │  ││
│  │ │   │  │  └─ 📄 In │ │ │ import React from 'react'         │ │  ││
│  │ │   │  ├─ 📄 index │ │ │                                   │ │  ││
│  │ │   │  └─ 📄 types │ │ │ interface ButtonProps {           │ │  ││
│  │ │   ├─ 📁 tests     │ │ │   variant?: 'primary' | ...       │ │  ││
│  │ │   │  └─ 📄 Butto │ │ │   children: React.ReactNode       │ │  ││
│  │ │   ├─ 📄 package  │ │ │ }                                 │ │  ││
│  │ │   └─ 📄 README   │ │ │                                   │ │  ││
│  │ │                  │ │ │ export const Button = ({...}) =>  │ │  ││
│  │ │ [+ File]         │ │ │   <button className={...}>        │ │  ││
│  │ │ [+ Folder]       │ │ │     {children}                    │ │  ││
│  │ │                  │ │ │   </button>                       │ │  ││
│  │ └──────────────────┘ │ └───────────────────────────────────┘ │  ││
│  │                      │                                       │  ││
│  │                      │ [📋 Copy] [Delete File]               │  ││
│  └──────────────────────┴───────────────────────────────────────┘  ││
│                                                                      │
│  ┌─ Variables ──────────────────────────────────────────────────┐   │
│  │ Detected: {{COMPONENT_NAME}}, {{PROJECT_NAME}}               │   │
│  │                                                               │   │
│  │ ┌─ COMPONENT_NAME ───────────────────┐ [Edit] [Delete]      │   │
│  │ │ Default: Button                    │                       │   │
│  │ │ Description: Name of the component │                       │   │
│  │ └────────────────────────────────────┘                       │   │
│  │                                                               │   │
│  │ [+ Add Variable]                                              │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ Instructions (Markdown) ──────────────────────────────────────┐ │
│  │ ## Installation                                               │ │
│  │ 1. Copy the `src` folder to your project                      │ │
│  │ 2. Install dependencies: `npm install`                        │ │
│  │ 3. Import: `import { Button } from './components/Button'`     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Form Sections:**

1. **Basic Info**
   - Title (required)
   - Description (optional)
   - Language dropdown (main language)
   - Tags multi-select with inline creation

2. **File Structure Section** (Split View)

   **Left Panel - File Tree:**
   - Interactive tree view with folders and files
   - Click to select/edit file
   - Right-click context menu:
     - Rename file/folder
     - Delete file/folder
     - New file in folder
     - New subfolder
   - Drag & drop to reorganize
   - "Add File" button - prompts for filename (can include path)
   - "Add Folder" button - prompts for folder name

   **Right Panel - File Editor:**
   - Filename input (editable, can include full path like `src/components/Button.tsx`)
   - Language auto-detect dropdown (overrideable)
   - Monaco/CodeMirror editor with syntax highlighting
   - Copy file content button
   - Delete file button

   **File Path Examples:**
   ```
   src/components/Button.tsx        → creates src/components/ folder
   tests/Button.test.tsx            → creates tests/ folder
   package.json                     → root level file
   config/app.config.ts             → creates config/ folder
   ```

3. **Variables Section**
   - Auto-detection of `{{VARIABLE_NAME}}` in all file contents
   - List of variables with:
     - Name (auto-filled from detection)
     - Default value input
     - Description input
   - Add variable manually button
   - Delete variable button
   - Shows which files use each variable

4. **Instructions Section** (Collapsible)
   - Markdown editor
   - Preview toggle
   - Useful for explaining folder structure and setup steps

5. **Actions**
   - Cancel button (top left)
   - Save button (top right, primary)

**Folder Management Features:**

- **Automatic folder creation**: When user types `src/index.ts`, the `src` folder is auto-created
- **Nested folders**: Full support for `src/components/ui/Button.tsx`
- **Folder operations**:
  - Create empty folder (useful for organizing)
  - Rename folder (renames all nested files)
  - Delete folder (deletes all contained files with confirmation)
- **Visual hierarchy**: Tree view clearly shows folder structure with expand/collapse
- **Folder icons**: Different icons for folders (📁) vs files (📄)
- **File type icons**: Different icons based on file extension (.ts, .tsx, .json, etc.)

---

### 6. Export Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Export: Docker Node.js Setup                         [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Configure Variables                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PROJECT_NAME                                        │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ my-awesome-app                              │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │ Container name                                      │   │
│  │                                                     │   │
│  │ NODE_VERSION                                        │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ 20                                          │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │ Node.js version                                     │   │
│  │                                                     │   │
│  │ PORT                                                │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ 3000                                        │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │ Exposed port                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Preview                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Dockerfile] [docker-compose.yml] [.dockerignore]   │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ FROM node:20-alpine                           │   │   │
│  │ │                                               │   │   │
│  │ │ WORKDIR /app                                  │   │   │
│  │ │                                               │   │   │
│  │ │ COPY package*.json ./                         │   │   │
│  │ │ RUN npm ci --only=production                  │   │   │
│  │ │                                               │   │   │
│  │ │ EXPOSE 3000                                   │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Copy Single  │  │ Copy All     │  │ Download ZIP │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Modal Sections:**

1. **Variable Configuration Form**
   - Input for each variable
   - Pre-filled with default values
   - Real-time preview updates

2. **Preview Panel**
   - Tabs for each file
   - Shows substituted content
   - Read-only code viewer with syntax highlighting

3. **Export Actions**
   - Copy Single File: copies currently previewed file
   - Copy All: copies all files with separators (e.g., `// --- filename.ts ---`)
   - Download ZIP: generates and downloads zip with folder structure

**Interaction:**
- Variable changes update preview in real-time
- Copy buttons show success feedback (toast or checkmark)
- Download ZIP triggers browser download

---

## Component Library

### Core Components (shadcn/ui)

#### 1. Button
```tsx
<Button variant="primary">Save Snippet</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Edit</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm" variant="outline">Copy</Button>
```

Variants:
- `primary`: Blue background, white text
- `secondary`: Gray background
- `ghost`: Transparent, hover background
- `outline`: Border only
- `destructive`: Red for delete actions

#### 2. Input & Textarea
```tsx
<Input
  placeholder="Search snippets..."
  leftIcon={<SearchIcon />}
  clearable
/>

<Textarea
  placeholder="Description (optional)"
  rows={3}
/>
```

Features:
- Optional icons (left/right)
- Clearable (X button when has value)
- Error states with red border
- Character count (optional)

#### 3. Select
```tsx
<Select
  placeholder="Select language"
  options={LANGUAGES}
  value={selectedLanguage}
  onChange={setSelectedLanguage}
/>
```

Features:
- Search/filter options
- Multi-select variant
- Custom option rendering (for colored tags)

#### 4. Badge
```tsx
<Badge variant="primary">Docker</Badge>
<Badge variant="success">Saved</Badge>
<Badge color="#3b82f6">Custom Color</Badge>
```

For tags, languages, status indicators

#### 5. Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    ...content...
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### 6. Dialog/Modal
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Export Snippet</DialogTitle>
    </DialogHeader>
    ...content...
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 7. Tabs
```tsx
<Tabs defaultValue="dockerfile">
  <TabsList>
    <TabsTrigger value="dockerfile">Dockerfile</TabsTrigger>
    <TabsTrigger value="compose">docker-compose.yml</TabsTrigger>
  </TabsList>
  <TabsContent value="dockerfile">
    ...content...
  </TabsContent>
</Tabs>
```

#### 8. Toast
```tsx
toast.success("Snippet saved successfully!")
toast.error("Failed to delete snippet")
toast.info("Copied to clipboard")
```

Position: Bottom right
Duration: 3-5 seconds
Closeable: Yes

---

### Custom Components

#### 1. SnippetCard
**File:** `apps/web/src/components/snippets/snippet-card.tsx`

**Props:**
```tsx
interface SnippetCardProps {
  id: string
  title: string
  description?: string
  language: string
  tags: Tag[]
  filesCount: number
  variablesCount: number
  isFavorite: boolean
  updatedAt: Date
  onToggleFavorite: () => void
}
```

**Features:**
- Click anywhere to navigate to detail
- Star button (top right) to toggle favorite
- Hover effects
- Responsive grid layout

#### 2. CodeEditor
**File:** `apps/web/src/components/files/code-editor.tsx`

**Props:**
```tsx
interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  lineNumbers?: boolean
  height?: string
}
```

**Library:** Monaco Editor or CodeMirror
- Syntax highlighting for all supported languages
- Auto-detect language from filename
- Line numbers
- Search & replace
- Keyboard shortcuts

#### 3. FileTree (Interactive)
**File:** `apps/web/src/components/files/file-tree.tsx`

**Props:**
```tsx
interface FileTreeProps {
  files: Array<{ id: string; filename: string; content: string }>
  selectedFileId?: string
  onSelectFile: (id: string) => void
  onRenameFile?: (id: string, newFilename: string) => void
  onDeleteFile?: (id: string) => void
  onCreateFile?: (filename: string) => void
  onCreateFolder?: (folderPath: string) => void
  editable?: boolean
}
```

**Library:** shadcn-tree-view (MrLightful) or react-arborist
- Parses flat file list into nested tree structure
- Folder nodes (virtual, derived from file paths)
- File nodes (actual files)
- Icons per file type (.ts, .tsx, .json, .md, etc.)
- Expand/collapse folders
- Click to select file
- Right-click context menu (if editable):
  - Rename file/folder
  - Delete file/folder
  - New file in this folder
  - New subfolder
- Drag & drop to reorder/reorganize
- Visual indicators for selected file

**Tree Building Logic:**
```tsx
// Pseudo-code for building tree from flat file list
function buildTree(files: File[]) {
  const tree = { name: 'root', children: [] }

  files.forEach(file => {
    const parts = file.filename.split('/')
    let current = tree

    // Navigate/create folder nodes
    for (let i = 0; i < parts.length - 1; i++) {
      let folder = current.children.find(c => c.name === parts[i])
      if (!folder) {
        folder = { name: parts[i], type: 'folder', children: [] }
        current.children.push(folder)
      }
      current = folder
    }

    // Add file node
    current.children.push({
      id: file.id,
      name: parts[parts.length - 1],
      type: 'file',
      language: file.language
    })
  })

  return tree
}
```

#### 4. VariableForm
**File:** `apps/web/src/components/variables/variable-form.tsx`

**Props:**
```tsx
interface VariableFormProps {
  variables: Variable[]
  onChange: (variables: Variable[]) => void
}
```

**Features:**
- Add/edit/delete variables
- Detect variables from file content (regex `{{NAME}}`)
- Default value + description inputs

#### 5. TagSelect
**File:** `apps/web/src/components/tags/tag-select.tsx`

**Props:**
```tsx
interface TagSelectProps {
  value: string[]
  onChange: (tags: string[]) => void
  availableTags: Tag[]
  onCreateTag: (name: string, color?: string) => void
}
```

**Features:**
- Multi-select dropdown
- Create new tag inline
- Color picker for new tags
- Shows colored badges for selected tags

---

## User Flows

### Flow 1: Create New Snippet

```
1. Dashboard → Click "New Snippet" button
   ↓
2. Create Page
   ├─ Enter title: "Docker Setup"
   ├─ Enter description
   ├─ Select language: Dockerfile
   ├─ Select tags: [Docker, DevOps]
   ↓
3. Add Files
   ├─ Click "+ Add File"
   ├─ Enter filename: "Dockerfile"
   ├─ Language auto-detected
   ├─ Write code in editor
   ├─ Use {{VARIABLE}} syntax
   ↓
4. Repeat for more files
   ├─ docker-compose.yml
   ├─ .dockerignore
   ↓
5. Define Variables
   ├─ Auto-detected from code
   ├─ Set default values
   ├─ Add descriptions
   ↓
6. Add Instructions (optional)
   ├─ Write markdown
   ├─ Preview toggle
   ↓
7. Click "Save"
   ↓
8. Success toast
   ↓
9. Redirect to snippet detail page
```

### Flow 2: Export Snippet with Variables

```
1. Snippet Detail Page → Click "Export"
   ↓
2. Export Modal Opens
   ├─ Shows variable form with defaults
   ├─ Shows live preview
   ↓
3. User customizes variables
   ├─ PROJECT_NAME: "my-app" → "awesome-project"
   ├─ PORT: "3000" → "8080"
   ├─ Preview updates in real-time
   ↓
4. Choose export method:
   ├─ A) Copy Single File
   │    ├─ Select file tab
   │    ├─ Click "Copy Single"
   │    ├─ Success toast: "Copied Dockerfile"
   │
   ├─ B) Copy All Files
   │    ├─ Click "Copy All"
   │    ├─ All files copied with separators
   │    ├─ Success toast: "Copied 3 files"
   │
   └─ C) Download ZIP
        ├─ Click "Download ZIP"
        ├─ ZIP generated client-side (JSZip)
        ├─ Browser downloads "docker-setup.zip"
        ├─ Success toast: "Downloaded docker-setup.zip"
```

### Flow 3: Search and Filter

```
1. Dashboard
   ↓
2. User types in search: "docker"
   ├─ Debounced search (300ms)
   ├─ Results update in real-time
   ↓
3. Apply filters
   ├─ Click language chip: "Dockerfile"
   ├─ Click tag: "DevOps"
   ├─ Click "★ Favorites"
   ↓
4. Results filtered
   ├─ Shows matching snippets
   ├─ Shows filter chips above results
   ├─ Clear button to remove filters
```

---

## Responsive Behavior

### Breakpoints
```
mobile:  < 640px
tablet:  640px - 1024px
desktop: > 1024px
```

### Mobile Layout (<640px)

**Dashboard:**
```
┌──────────────────────────┐
│ [≡] SnippetVault  [User] │ ← Header with hamburger
├──────────────────────────┤
│ 🔍 Search...             │
│ [All] [Docker] [React]   │ ← Horizontal scroll filters
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Docker Setup    [★]  │ │ ← Cards stack vertically
│ │ Complete Docker...   │ │
│ │ 3 files • Docker     │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ React Hook           │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

- Sidebar becomes drawer (hamburger menu)
- Single column card layout
- Simplified card content
- Bottom navigation bar (optional)

**Snippet Detail:**
```
┌──────────────────────────┐
│ [←] Docker Setup    [⋮]  │
├──────────────────────────┤
│ Complete Docker config   │
│ [Docker] [DevOps]        │
├──────────────────────────┤
│ [Files ▾]                │ ← Collapsible sections
│   ├ Dockerfile           │
│   ├ docker-compose.yml   │
├──────────────────────────┤
│ [Variables ▾]            │
├──────────────────────────┤
│ [Instructions ▾]         │
└──────────────────────────┘
```

- Collapsible sections
- File selector dropdown instead of tree
- Code viewer full width
- Copy button floating/sticky

### Tablet Layout (640px - 1024px)

- Collapsible sidebar (can toggle)
- 2-column card grid
- Full file tree visible
- Horizontal tabs for files

### Desktop Layout (>1024px)

- Persistent sidebar
- 3-column card grid
- File tree + code viewer side-by-side
- All panels visible simultaneously

---

## API Endpoints to UI Mapping

### Authentication

| UI Action | API Endpoint | Method | Payload |
|-----------|-------------|--------|---------|
| Login | `/api/auth/sign-in/email` | POST | `{ email, password }` |
| Register | `/api/auth/sign-up/email` | POST | `{ name, email, password }` |
| Logout | `/api/auth/sign-out` | POST | - |
| Get session | `/api/auth/session` | GET | - |

### Snippets List Page

| UI Component | API Endpoint | Method | Query Params |
|-------------|-------------|--------|-------------|
| Snippets list | `/api/snippets` | GET | `search, language, tag, favorite, sort, order` |
| Create snippet | `/api/snippets` | POST | Snippet data |
| Toggle favorite | `/api/snippets/:id/favorite` | PATCH | - |
| Duplicate | `/api/snippets/:id/duplicate` | POST | - |
| Delete | `/api/snippets/:id` | DELETE | - |

**Example Query:**
```
GET /api/snippets?search=docker&tag=devops&favorite=true&sort=updated_at&order=desc
```

### Snippet Detail Page

| UI Component | API Endpoint | Method | Notes |
|-------------|-------------|--------|-------|
| Load snippet | `/api/snippets/:id` | GET | Returns snippet with files, variables, tags |
| Update snippet | `/api/snippets/:id` | PUT | Full snippet data |

**Response Example:**
```json
{
  "id": "uuid",
  "title": "Docker Setup",
  "description": "Complete Docker config",
  "language": "dockerfile",
  "isFavorite": true,
  "instructions": "## How to use...",
  "files": [
    {
      "id": "uuid",
      "filename": "Dockerfile",
      "content": "FROM node:{{NODE_VERSION}}...",
      "language": "dockerfile",
      "order": 0
    }
  ],
  "variables": [
    {
      "id": "uuid",
      "name": "NODE_VERSION",
      "defaultValue": "20",
      "description": "Node.js version"
    }
  ],
  "tags": [
    { "id": "uuid", "name": "Docker", "color": "#2496ed" }
  ]
}
```

### File Management

| UI Action | API Endpoint | Method | Payload |
|-----------|-------------|--------|---------|
| Add file | `/api/snippets/:id/files` | POST | `{ filename, content, language, order }` |
| Update file | `/api/files/:id` | PUT | `{ filename?, content?, language? }` |
| Delete file | `/api/files/:id` | DELETE | - |
| Reorder files | `/api/snippets/:id/files/reorder` | PATCH | `{ fileIds: [] }` |

**Note on Folder Structure:**
- The `filename` field stores the full path: `src/components/Button.tsx`
- No separate "folders" table needed - folders are virtual (derived from file paths)
- UI parses the paths to build the tree structure
- When exporting to ZIP, the full path is used to create the actual folder structure
- Backend stores files as a flat list with path information in the filename

**Example File Records:**
```json
[
  { "id": "1", "filename": "src/components/Button.tsx", ... },
  { "id": "2", "filename": "src/components/Input.tsx", ... },
  { "id": "3", "filename": "src/index.ts", ... },
  { "id": "4", "filename": "tests/Button.test.tsx", ... },
  { "id": "5", "filename": "package.json", ... }
]
```

**UI Tree View Renders As:**
```
📁 src
  ├─ 📁 components
  │   ├─ 📄 Button.tsx
  │   └─ 📄 Input.tsx
  └─ 📄 index.ts
📁 tests
  └─ 📄 Button.test.tsx
📄 package.json
```

### Variables

| UI Action | API Endpoint | Method | Payload |
|-----------|-------------|--------|---------|
| Add variable | `/api/snippets/:id/variables` | POST | `{ name, defaultValue, description }` |
| Update variable | `/api/variables/:id` | PUT | `{ name?, defaultValue?, description? }` |
| Delete variable | `/api/variables/:id` | DELETE | - |

### Tags

| UI Component | API Endpoint | Method | Payload |
|-------------|-------------|--------|---------|
| List tags | `/api/tags` | GET | - |
| Create tag | `/api/tags` | POST | `{ name, color? }` |
| Update tag | `/api/tags/:id` | PUT | `{ name?, color? }` |
| Delete tag | `/api/tags/:id` | DELETE | - |

---

## Implementation Priority

### Phase 1: Core Structure (Week 1)
1. Header + Sidebar layout
2. Snippet cards grid
3. Basic navigation

### Phase 2: Snippet CRUD (Week 2)
4. Snippet detail view
5. Create/edit form
6. File management

### Phase 3: Variables & Export (Week 3)
7. Variable management
8. Export modal
9. Template substitution

### Phase 4: Search & Filters (Week 4)
10. Search bar
11. Filter chips
12. Tag management

### Phase 5: Polish (Week 5)
13. Loading states
14. Error handling
15. Responsive design
16. Keyboard shortcuts

---

## Next Steps

1. **Review this design** with the team/stakeholders
2. **Create mockups** in Figma/Sketch (optional but recommended)
3. **Start with Phase 1**: Implement header, sidebar, and basic layout
4. **Build incrementally**: Each component should work before moving to the next
5. **Test continuously**: Verify each feature works on mobile/tablet/desktop

---

## Notes

- All UI states should have proper loading/error/empty states
- Use optimistic updates where appropriate (favorite toggle, etc.)
- Implement keyboard shortcuts for power users
- Consider adding dark/light mode toggle (post-MVP)
- Export feature is client-side (JSZip) - no server processing needed
