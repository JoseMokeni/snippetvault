# SnippetVault - Snippet Manager

## Vue d'ensemble

SnippetVault est un outil pour sauvegarder, organiser et retrouver des **packs de code** réutilisables. Contrairement aux snippet managers classiques (1 snippet = 1 fichier), SnippetVault permet de regrouper plusieurs fichiers liés avec un système de variables pour la personnalisation.

**Exemples d'usage :**
- Setup Docker complet (Dockerfile + docker-compose + .dockerignore)
- Hook React avec son contexte et types
- Config ESLint + Prettier + EditorConfig
- Boilerplate API (routes + middleware + types)

---

## Stack technique

| Layer | Technologie |
|-------|-------------|
| Runtime | Bun |
| Backend | Hono + Hono RPC |
| Frontend | React + Vite + TanStack (Router, Query, Form) |
| UI | shadcn/ui + Tailwind CSS |
| Auth | Better Auth |
| ORM | Drizzle |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Validation | Zod |
| Code Editor | Monaco Editor ou CodeMirror |
| File Tree | shadcn-tree-view (MrLightful) |
| Export | JSZip (génération zip côté client) |

---

## Fonctionnalités MVP

### Authentification
- Inscription / connexion (email + password)
- Session persistante
- Logout

### Gestion des snippets (packs)
- Créer un snippet avec plusieurs fichiers
- Éditer un snippet
- Supprimer un snippet
- Marquer comme favori
- Dupliquer un snippet

### Fichiers
- Ajouter / supprimer des fichiers dans un snippet
- Nom de fichier avec chemin (ex: `src/hooks/useAuth.ts`)
- Langage par fichier (auto-détecté ou manuel)
- Réordonner les fichiers

### Variables (templating)
- Définir des variables par snippet (`{{PROJECT_NAME}}`, `{{PORT}}`)
- Valeurs par défaut
- Preview avec substitution en temps réel
- Formulaire de personnalisation à l'export

### Organisation
- Tags (créer, assigner, supprimer)
- Filtrer par langage principal
- Filtrer par tag
- Favoris

### Recherche
- Recherche par titre
- Recherche dans le contenu des fichiers
- Recherche par tags

### Export
- Copier un fichier individuel
- Copier tous les fichiers (avec séparateurs)
- Télécharger en `.zip`
- Preview avec variables substituées

### Affichage
- Syntax highlighting par langage
- Vue liste des snippets (cards)
- Vue détail avec onglets par fichier
- Arborescence des fichiers

---

## Architecture du projet

```
snippetvault/
│
├── apps/
│   ├── api/                    # Backend Hono
│   │   ├── src/
│   │   │   ├── index.ts        # Entry + static serving (prod)
│   │   │   ├── routes/
│   │   │   │   ├── index.ts    # Aggregator + export AppType
│   │   │   │   ├── auth.ts     # Better Auth handler
│   │   │   │   ├── snippets.ts
│   │   │   │   ├── files.ts
│   │   │   │   ├── variables.ts
│   │   │   │   └── tags.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts     # Auth guard middleware
│   │   │   └── lib/
│   │   │       ├── db.ts       # Drizzle client
│   │   │       ├── auth.ts     # Better Auth config
│   │   │       └── env.ts      # Env validation (Zod)
│   │   ├── public/             # React build (prod, généré)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Frontend React
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app.tsx
│       │   ├── routes/
│       │   │   ├── __root.tsx
│       │   │   ├── index.tsx
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   └── dashboard/
│       │   │       ├── route.tsx
│       │   │       ├── index.tsx
│       │   │       ├── new.tsx
│       │   │       ├── $snippetId/
│       │   │       │   ├── index.tsx     # Vue snippet
│       │   │       │   └── edit.tsx      # Édition
│       │   │       └── favorites.tsx
│       │   ├── components/
│       │   │   ├── ui/                   # shadcn/ui
│       │   │   ├── layout/
│       │   │   │   ├── header.tsx
│       │   │   │   ├── sidebar.tsx
│       │   │   │   └── auth-guard.tsx
│       │   │   ├── snippets/
│       │   │   │   ├── snippet-card.tsx
│       │   │   │   ├── snippet-list.tsx
│       │   │   │   ├── snippet-form.tsx
│       │   │   │   └── snippet-viewer.tsx
│       │   │   ├── files/
│       │   │   │   ├── file-tabs.tsx
│       │   │   │   ├── file-tree.tsx
│       │   │   │   ├── file-editor.tsx
│       │   │   │   ├── file-form.tsx
│       │   │   │   └── code-preview.tsx
│       │   │   ├── variables/
│       │   │   │   ├── variable-form.tsx
│       │   │   │   ├── variable-list.tsx
│       │   │   │   └── variable-preview.tsx
│       │   │   ├── export/
│       │   │   │   ├── export-modal.tsx
│       │   │   │   ├── export-config.tsx
│       │   │   │   └── copy-button.tsx
│       │   │   ├── tags/
│       │   │   │   ├── tag-badge.tsx
│       │   │   │   ├── tag-select.tsx
│       │   │   │   └── tag-filter.tsx
│       │   │   └── search/
│       │   │       └── search-bar.tsx
│       │   ├── lib/
│       │   │   ├── api.ts          # Hono RPC client (import type AppType)
│       │   │   ├── auth-client.ts  # Better Auth React client
│       │   │   ├── query.ts        # TanStack Query config
│       │   │   ├── template.ts     # Substitution variables
│       │   │   └── export.ts       # Génération zip (JSZip)
│       │   └── hooks/
│       │       ├── use-snippets.ts
│       │       ├── use-files.ts
│       │       └── use-tags.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── components.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── db/                     # Database package
│       ├── src/
│       │   ├── index.ts        # Export schema + client
│       │   ├── client.ts       # Drizzle instance
│       │   ├── schema/
│       │   │   ├── index.ts
│       │   │   ├── users.ts
│       │   │   ├── sessions.ts # Better Auth sessions
│       │   │   ├── snippets.ts
│       │   │   ├── files.ts
│       │   │   ├── variables.ts
│       │   │   └── tags.ts
│       │   └── seed.ts
│       ├── drizzle/
│       │   └── migrations/
│       ├── drizzle.config.ts
│       └── package.json
│
├── docker-compose.yml          # PostgreSQL local (dev)
├── docker-compose.prod.yml     # Production (référence)
├── Dockerfile                  # Production build
├── package.json                # Workspace root
├── bunfig.toml
├── AGENTS.md                   # AI assistant directives
├── CLAUDE.md                   # Claude Code config (references AGENTS.md)
└── .env
```

> **Note sur les types**: Les types API sont partagés via Hono RPC (`export type AppType = typeof app`).
> Pas besoin de package `shared` pour les types - le frontend importe directement `AppType` depuis l'API.
>
> **Déploiement**: VPS avec Docker Swarm via Dokploy. Voir `DEPLOYMENT.md` pour les détails.

---

## Database schema

### users
| Colonne | Type | Description |
|---------|------|-------------|
| id | text (PK) | UUID |
| email | text | Email unique |
| name | text | Nom affiché |
| created_at | timestamp | Date création |

### sessions
Gérée par Better Auth.

### snippets
| Colonne | Type | Description |
|---------|------|-------------|
| id | text (PK) | UUID |
| user_id | text (FK) | Propriétaire |
| title | text | Titre du snippet |
| description | text | Description (nullable) |
| instructions | text | Instructions markdown (nullable) |
| language | text | Langage principal |
| is_favorite | boolean | Marqué favori |
| is_public | boolean | Public (post-MVP, default false) |
| slug | text | URL slug (post-MVP, nullable) |
| created_at | timestamp | Date création |
| updated_at | timestamp | Date mise à jour |

### files
| Colonne | Type | Description |
|---------|------|-------------|
| id | text (PK) | UUID |
| snippet_id | text (FK) | Snippet parent |
| filename | text | Nom avec chemin (ex: src/index.ts) |
| content | text | Contenu du fichier |
| language | text | Langage du fichier |
| order | integer | Ordre d'affichage |
| created_at | timestamp | Date création |
| updated_at | timestamp | Date mise à jour |

### variables
| Colonne | Type | Description |
|---------|------|-------------|
| id | text (PK) | UUID |
| snippet_id | text (FK) | Snippet parent |
| name | text | Nom (ex: PROJECT_NAME) |
| default_value | text | Valeur par défaut |
| description | text | Description (nullable) |
| order | integer | Ordre d'affichage |

### tags
| Colonne | Type | Description |
|---------|------|-------------|
| id | text (PK) | UUID |
| user_id | text (FK) | Propriétaire |
| name | text | Nom du tag |
| color | text | Couleur hex (nullable) |
| created_at | timestamp | Date création |

### snippets_tags (jointure)
| Colonne | Type | Description |
|---------|------|-------------|
| snippet_id | text (FK) | Snippet |
| tag_id | text (FK) | Tag |

### Indices (PostgreSQL)

```sql
-- Performance indices
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_is_favorite ON snippets(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);
CREATE INDEX idx_snippets_updated_at ON snippets(updated_at DESC);

CREATE INDEX idx_files_snippet_id ON files(snippet_id);
CREATE INDEX idx_files_order ON files(snippet_id, "order");

CREATE INDEX idx_variables_snippet_id ON variables(snippet_id);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

CREATE INDEX idx_snippets_tags_snippet ON snippets_tags(snippet_id);
CREATE INDEX idx_snippets_tags_tag ON snippets_tags(tag_id);

-- Full-text search (PostgreSQL avec pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_snippets_title_trgm ON snippets USING gin(title gin_trgm_ops);
CREATE INDEX idx_snippets_description_trgm ON snippets USING gin(description gin_trgm_ops);
CREATE INDEX idx_files_content_trgm ON files USING gin(content gin_trgm_ops);
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
```

### Snippets
```
GET    /api/snippets                    # Liste (avec filtres)
GET    /api/snippets/:id                # Détail (avec fichiers + variables)
POST   /api/snippets                    # Créer
PUT    /api/snippets/:id                # Modifier
DELETE /api/snippets/:id                # Supprimer
PATCH  /api/snippets/:id/favorite       # Toggle favori
POST   /api/snippets/:id/duplicate      # Dupliquer
```

### Files
```
POST   /api/snippets/:id/files          # Créer fichier (nested car besoin du parent)
GET    /api/files/:id                   # Détail fichier
PUT    /api/files/:id                   # Modifier fichier
DELETE /api/files/:id                   # Supprimer fichier
PATCH  /api/snippets/:id/files/reorder  # Réordonner fichiers
```

### Variables
```
POST   /api/snippets/:id/variables      # Créer variable (nested car besoin du parent)
GET    /api/variables/:id               # Détail variable
PUT    /api/variables/:id               # Modifier variable
DELETE /api/variables/:id               # Supprimer variable
```

### Tags
```
GET    /api/tags
POST   /api/tags
PUT    /api/tags/:id
DELETE /api/tags/:id
```

### Query params pour GET /api/snippets
```
?search=keyword
?language=javascript
?tag=docker
?favorite=true
?sort=updated_at
?order=desc
```

---

## Système de variables

### Définition
```typescript
interface Variable {
  name: string        // PROJECT_NAME
  defaultValue: string  // my-app
  description?: string  // Nom du projet
}
```

### Syntaxe dans les fichiers
```dockerfile
# Dockerfile
FROM node:{{NODE_VERSION}}-alpine
WORKDIR /app/{{PROJECT_NAME}}
EXPOSE {{PORT}}
CMD ["node", "dist/index.js"]
```

### Substitution (lib/template.ts)
```typescript
export function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(
    /\{\{(\w+)\}\}/g,
    (_, name) => variables[name] ?? `{{${name}}}`
  )
}
```

### UI d'export
1. Modal s'ouvre avec formulaire des variables
2. Valeurs pré-remplies avec defaults
3. Preview en temps réel
4. Boutons : Copier | Télécharger .zip

---

## Export ZIP (lib/export.ts)

```typescript
import JSZip from 'jszip'

export async function exportAsZip(
  snippetTitle: string,
  files: Array<{ filename: string; content: string }>,
  variables: Record<string, string>
): Promise<Blob> {
  const zip = new JSZip()
  
  for (const file of files) {
    const content = substituteVariables(file.content, variables)
    zip.file(file.filename, content)
  }
  
  return zip.generateAsync({ type: 'blob' })
}
```

---

## Langages supportés

```typescript
export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extensions: ['.js', '.mjs'] },
  { value: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { value: 'python', label: 'Python', extensions: ['.py'] },
  { value: 'rust', label: 'Rust', extensions: ['.rs'] },
  { value: 'go', label: 'Go', extensions: ['.go'] },
  { value: 'java', label: 'Java', extensions: ['.java'] },
  { value: 'csharp', label: 'C#', extensions: ['.cs'] },
  { value: 'php', label: 'PHP', extensions: ['.php'] },
  { value: 'ruby', label: 'Ruby', extensions: ['.rb'] },
  { value: 'sql', label: 'SQL', extensions: ['.sql'] },
  { value: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
  { value: 'css', label: 'CSS', extensions: ['.css'] },
  { value: 'scss', label: 'SCSS', extensions: ['.scss', '.sass'] },
  { value: 'bash', label: 'Bash', extensions: ['.sh', '.bash'] },
  { value: 'json', label: 'JSON', extensions: ['.json'] },
  { value: 'yaml', label: 'YAML', extensions: ['.yml', '.yaml'] },
  { value: 'toml', label: 'TOML', extensions: ['.toml'] },
  { value: 'markdown', label: 'Markdown', extensions: ['.md'] },
  { value: 'dockerfile', label: 'Dockerfile', extensions: ['Dockerfile'] },
  { value: 'graphql', label: 'GraphQL', extensions: ['.graphql', '.gql'] },
  { value: 'nginx', label: 'Nginx', extensions: ['.conf'] },
  { value: 'env', label: 'Environment', extensions: ['.env'] },
  { value: 'other', label: 'Other', extensions: [] },
] as const

export function detectLanguage(filename: string): string {
  const ext = filename.includes('.') 
    ? '.' + filename.split('.').pop() 
    : filename
  
  const match = LANGUAGES.find(lang => 
    lang.extensions.some(e => 
      e === ext || e === filename
    )
  )
  
  return match?.value ?? 'other'
}
```

---

## Étapes d'implémentation

### Phase 1 : Setup monorepo
- [ ] Init Bun workspace
- [ ] Configurer packages (api, web, db, shared)
- [ ] Setup TypeScript configs
- [ ] Setup ESLint + Prettier

### Phase 2 : Database
- [ ] Setup Drizzle avec SQLite
- [ ] Créer schemas (users, snippets, files, variables, tags)
- [ ] Configurer migrations
- [ ] Script seed avec exemples

### Phase 3 : Backend - Auth
- [ ] Setup Hono
- [ ] Configurer Better Auth
- [ ] Routes auth
- [ ] Middleware auth guard

### Phase 4 : Backend - CRUD
- [ ] Routes snippets (CRUD + favorite + duplicate)
- [ ] Routes files (CRUD + reorder)
- [ ] Routes variables (CRUD)
- [ ] Routes tags (CRUD)
- [ ] Filtres et recherche
- [ ] Export types Hono RPC

### Phase 5 : Frontend - Setup
- [ ] Setup Vite + React
- [ ] TanStack Router
- [ ] TanStack Query
- [ ] Hono RPC client
- [ ] shadcn/ui + Tailwind
- [ ] Layout de base

### Phase 6 : Frontend - Auth
- [ ] Page login
- [ ] Page register
- [ ] Auth guard
- [ ] Hook useAuth

### Phase 7 : Frontend - Liste snippets
- [ ] Liste des snippets
- [ ] Snippet card (titre, description, tags, fichiers count)
- [ ] Filtres (langage, tag, favoris)
- [ ] Barre de recherche
- [ ] Page favoris

### Phase 8 : Frontend - Création snippet
- [ ] Formulaire snippet (titre, description, instructions)
- [ ] Gestion multi-fichiers
- [ ] Ajout/suppression fichiers
- [ ] Code editor par fichier
- [ ] Détection auto du langage
- [ ] Tag selector

### Phase 9 : Frontend - Variables
- [ ] Formulaire ajout variable
- [ ] Liste des variables
- [ ] Preview avec substitution
- [ ] Validation (pas de variable orpheline)

### Phase 10 : Frontend - Vue snippet
- [ ] Affichage détail
- [ ] Onglets fichiers ou file tree
- [ ] Syntax highlighting
- [ ] Instructions markdown
- [ ] Bouton copier par fichier
- [ ] Toggle favori

### Phase 11 : Frontend - Export
- [ ] Modal d'export
- [ ] Formulaire variables avec defaults
- [ ] Preview temps réel
- [ ] Copier tout (avec séparateurs)
- [ ] Télécharger .zip
- [ ] Installer JSZip

### Phase 12 : Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Toasts notifications
- [ ] Empty states
- [ ] Responsive design
- [ ] Keyboard shortcuts

### Phase 13 : Déploiement
- [ ] Build production
- [ ] Déploiement API (Fly.io / Railway)
- [ ] Déploiement frontend (Vercel)
- [ ] Variables d'environnement
- [ ] Migration vers PostgreSQL

---

## Commandes

```bash
# Dev
bun run dev
bun run dev:api
bun run dev:web

# Database
bun run db:generate
bun run db:migrate
bun run db:seed

# Build
bun run build
```

---

## Variables d'environnement

```env
# Database
DATABASE_URL=./data/snippetvault.db

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# App
API_PORT=3000
WEB_PORT=5173
PUBLIC_API_URL=http://localhost:3000
```

---

## Composants shadcn

```bash
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add textarea
bunx shadcn@latest add card
bunx shadcn@latest add badge
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add select
bunx shadcn@latest add toast
bunx shadcn@latest add command
bunx shadcn@latest add tabs
bunx shadcn@latest add separator
bunx shadcn@latest add skeleton
bunx shadcn@latest add tooltip
bunx shadcn@latest add collapsible
bunx shadcn@latest add scroll-area

# Tree view (file explorer)
npx shadcn add "https://mrlightful.com/registry/tree-view"
```

---

## Seed data exemple

```typescript
// packages/db/src/seed.ts

const dockerSetup = {
  title: 'Docker Node.js Setup',
  description: 'Configuration Docker complète pour une app Node.js',
  instructions: `
## Installation

1. Copier les fichiers à la racine du projet
2. Remplacer les variables selon vos besoins
3. Lancer \`docker-compose up -d\`
  `,
  language: 'dockerfile',
  files: [
    {
      filename: 'Dockerfile',
      language: 'dockerfile',
      content: `FROM node:{{NODE_VERSION}}-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE {{PORT}}

CMD ["node", "dist/index.js"]`
    },
    {
      filename: 'docker-compose.yml',
      language: 'yaml',
      content: `version: '3.8'

services:
  app:
    build: .
    container_name: {{PROJECT_NAME}}
    ports:
      - "{{PORT}}:{{PORT}}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`
    },
    {
      filename: '.dockerignore',
      language: 'other',
      content: `node_modules
npm-debug.log
Dockerfile
docker-compose.yml
.git
.gitignore
.env`
    }
  ],
  variables: [
    { name: 'PROJECT_NAME', defaultValue: 'my-app', description: 'Nom du container' },
    { name: 'NODE_VERSION', defaultValue: '20', description: 'Version de Node.js' },
    { name: 'PORT', defaultValue: '3000', description: 'Port exposé' }
  ],
  tags: ['docker', 'nodejs', 'devops']
}
```

---

## Fonctionnalités futures (post-MVP)

### Phase 1 : Snippets publics (v1.5)
- **Toggle public/privé** par snippet
- **Slug unique** pour URL publique (`/s/docker-node-setup`)
- **Page publique** de snippet (accessible sans auth)
- **Compteur de vues** par snippet
- **Découverte** : page `/explore` avec snippets publics
- **Tri** par popularité, récents, plus vus
- **Recherche** dans snippets publics uniquement
- **Filtres** par tags dans explore

**Ajouts DB nécessaires :**
```sql
### snippets (déjà prévu dans le schema)
is_public boolean (déjà présent)
slug text UNIQUE (déjà présent)
views_count integer DEFAULT 0
likes_count integer DEFAULT 0
fork_count integer DEFAULT 0
forked_from_id text FK (nullable)

### views
id text PK
snippet_id text FK
visitor_ip text (anonymisé)
viewed_at timestamp

### likes
id text PK
snippet_id text FK
user_id text FK
created_at timestamp
UNIQUE(snippet_id, user_id)
```

**Routes additionnelles :**
```
GET /api/public/snippets          # Liste publics
GET /api/public/snippets/:slug    # Détail public par slug
GET /s/:slug                       # Page publique (frontend)
GET /explore                       # Page découverte
POST /api/snippets/:id/like        # Like/unlike
POST /api/snippets/:id/fork        # Fork vers ses snippets
```

### Phase 2 : Engagement communautaire
- **Fork** d'un snippet public vers ses snippets privés
- **Likes** (coeur) avec compteur
- **Profil utilisateur** public (`/@username`)
- **Badges** : "Most liked", "Trending", "Top contributor"
- **Stats** : vues, téléchargements, forks par snippet

### Phase 3 : Améliorations UX
- Collections / dossiers pour organiser
- Import depuis GitHub Gists
- Import depuis GitHub repo (dossier entier)
- Drag & drop de dossiers locaux
- Versioning des snippets (historique)
- CLI : `snippetvault add` depuis le terminal
- Extension VS Code pour sync

### Phase 4 : Features avancées
- Collaboration (partage privé avec d'autres users)
- Détection automatique des variables dans le code
- Templates prédéfinis officiels (starter kits)
- Commentaires sur snippets publics
- Notifications (nouveau follower, fork, like)
- API publique pour intégrations tierces