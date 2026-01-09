# SnippetVault VSCode Extension - Architecture Document

> **Version**: 1.0
> **Status**: Reviewed
> **Author**: José Mokeni
> **Last Updated**: 2026-01-07

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Technical Architecture](#technical-architecture)
5. [Extension Features](#extension-features)
6. [Authentication](#authentication)
7. [UI Components](#ui-components)
8. [API Integration](#api-integration)
9. [Data Management](#data-management)
10. [Implementation Phases](#implementation-phases)
11. [Testing Strategy](#testing-strategy)
12. [Distribution](#distribution)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The SnippetVault VSCode Extension brings code snippet management directly into the developer's IDE. Users can search, insert, create, and manage snippets without leaving their editor, dramatically improving workflow efficiency.

### Why a VSCode Extension?

- **Where developers work**: VSCode is the most popular code editor (73% market share)
- **Context switching**: Avoid browser context switches when coding
- **Native integration**: Insert snippets directly into editor
- **Quick capture**: Save code selections as snippets instantly
- **IDE features**: Leverage VSCode's built-in capabilities (syntax highlighting, file system)

### Market Opportunity

```
VSCode Extension Marketplace Stats:
- 30M+ active VSCode users
- Snippet-related extensions: 10M+ combined installs
- Top snippet managers: 500K-2M installs each
```

---

## Goals & Non-Goals

### Goals

- Quick snippet search and insertion (`Cmd+Shift+S`)
- Save selections as new snippets
- Browse snippets in sidebar panel
- Variable substitution during insertion
- Offline access with local caching
- Sync with web app in real-time
- Support for multi-file snippets
- Workspace-aware snippet suggestions

### Non-Goals

- Full snippet editing (complex edits done in web app)
- Version history viewing (use web app)
- Team/collaboration features (v2+)
- Custom snippet syntax beyond VSCode's native format
- Support for other IDEs in this version (JetBrains, Vim = future)

---

## User Stories

### Core User Stories

```
As a developer, I want to:

1. Search and insert snippets without leaving VSCode
   "I need my Docker Compose template right now"

2. Save selected code as a new snippet
   "This utility function is useful, let me save it"

3. Browse my snippets in the sidebar
   "Show me all my React snippets"

4. Insert snippets with variable replacement
   "Insert my component template with name 'UserProfile'"

5. Access snippets offline
   "I'm on a plane but need my snippets"

6. See snippet suggestions based on file type
   "Show me TypeScript snippets when I'm in a .ts file"
```

### Power User Stories

```
As a power user, I want to:

1. Use keyboard shortcuts for everything
   "Cmd+Shift+S to search, Cmd+Shift+N to create"

2. Insert multi-file snippets as folder structure
   "Create all 5 files from my React component template"

3. Quick-copy snippet to clipboard
   "Copy without inserting into editor"

4. Favorite snippets for quick access
   "Star my most-used snippets"

5. Filter by tags and language
   "Show only 'docker' tagged snippets"
```

---

## Technical Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│              SnippetVault VSCode Extension               │
├─────────────────────────────────────────────────────────┤
│  Platform: VSCode Extension API                          │
│  Language: TypeScript                                    │
│  Build: esbuild (fast bundling)                          │
│  Package Manager: pnpm                                   │
├─────────────────────────────────────────────────────────┤
│  Key Dependencies:                                       │
│  - @vscode/webview-ui-toolkit (UI components)            │
│  - axios (HTTP client)                                   │
│  - keytar (secure credential storage)                    │
│  - fuse.js (fuzzy search)                                │
│  - lru-cache (local caching)                             │
└─────────────────────────────────────────────────────────┘
```

### System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           VSCode                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Extension Host                             │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │   Commands     │  │   Providers    │  │   Webviews     │  │  │
│  │  │   Handler      │  │   (Tree, etc)  │  │   (Panels)     │  │  │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  │  │
│  │          │                   │                   │           │  │
│  │          ▼                   ▼                   ▼           │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │                   Core Services                          │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │  │
│  │  │  │   Auth      │  │   Snippet   │  │   Cache         │  │ │  │
│  │  │  │   Service   │  │   Service   │  │   Manager       │  │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │  │
│  │  └─────────────────────────┬───────────────────────────────┘ │  │
│  │                            │                                  │  │
│  └────────────────────────────┼──────────────────────────────────┘  │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   SnippetVault API    │
                    │ api.snippetvault.app  │
                    └───────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Extension Components                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Command Palette │    │       Sidebar Panel               │   │
│  │  ─────────────── │    │  ┌────────────────────────────┐  │   │
│  │  • Search        │    │  │  🔍 Search                  │  │   │
│  │  • Insert        │    │  ├────────────────────────────┤  │   │
│  │  • Create        │    │  │  ⭐ Favorites              │  │   │
│  │  • Favorite      │    │  │  ├─ Docker Compose         │  │   │
│  │  • Refresh       │    │  │  └─ React Hook             │  │   │
│  └──────────────────┘    │  ├────────────────────────────┤  │   │
│                          │  │  📁 By Language            │  │   │
│  ┌──────────────────┐    │  │  ├─ TypeScript (12)        │  │   │
│  │  Quick Pick      │    │  │  ├─ Python (8)             │  │   │
│  │  ─────────────── │    │  │  └─ Dockerfile (5)         │  │   │
│  │  Fuzzy search    │    │  ├────────────────────────────┤  │   │
│  │  with preview    │    │  │  🏷️ By Tag                 │  │   │
│  │                  │    │  │  ├─ docker (8)             │  │   │
│  └──────────────────┘    │  │  ├─ react (6)              │  │   │
│                          │  │  └─ api (4)                │  │   │
│  ┌──────────────────┐    │  └────────────────────────────┘  │   │
│  │  Status Bar      │    └──────────────────────────────────┘   │
│  │  ─────────────── │                                           │
│  │  SV: 42 snippets │    ┌──────────────────────────────────┐   │
│  │  Click to search │    │       Webview Panel               │   │
│  └──────────────────┘    │  ┌────────────────────────────┐  │   │
│                          │  │  Snippet Detail View       │  │   │
│  ┌──────────────────┐    │  │  • Preview files           │  │   │
│  │  Context Menu    │    │  │  • Edit variables          │  │   │
│  │  ─────────────── │    │  │  • Insert / Copy           │  │   │
│  │  Right-click:    │    │  └────────────────────────────┘  │   │
│  │  "Save as        │    └──────────────────────────────────┘   │
│  │   Snippet"       │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extension Features

### 1. Command Palette Integration

```typescript
// Available commands (Cmd+Shift+P)

snippetvault.search          // Search and insert snippet
snippetvault.create          // Create snippet from selection
snippetvault.browse          // Open sidebar panel
snippetvault.favorites       // Quick access to favorites
snippetvault.refresh         // Refresh snippet cache
snippetvault.login           // Authenticate
snippetvault.logout          // Sign out
snippetvault.openInBrowser   // Open snippet in web app
```

### 2. Keyboard Shortcuts

```json
// Default keybindings (customizable)
{
  "key": "cmd+shift+s",
  "command": "snippetvault.search",
  "when": "editorTextFocus"
},
{
  "key": "cmd+shift+n",
  "command": "snippetvault.create",
  "when": "editorHasSelection"
},
{
  "key": "cmd+shift+b",
  "command": "snippetvault.browse"
}
```

### 3. Quick Pick Search

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search SnippetVault snippets...                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⭐ docker compose stack                                    │
│     Production Docker setup with nginx, postgres            │
│     dockerfile • 4 files • docker, devops                   │
│                                                             │
│  📄 react useAuth hook                                      │
│     Authentication hook with JWT                            │
│     typescript • 2 files • react, hooks                     │
│                                                             │
│  📄 express middleware                                      │
│     Error handling and logging middleware                   │
│     javascript • 3 files • express, api                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ↑↓ Navigate  ⏎ Insert  ⌘⏎ Insert with variables  ⎋ Cancel │
└─────────────────────────────────────────────────────────────┘
```

### 4. Sidebar Tree View

```typescript
// Tree structure

SnippetVault
├── ⭐ Favorites (3)
│   ├── 📄 Docker Compose Stack
│   ├── 📄 React Hook Template
│   └── 📄 Express Middleware
├── 📂 Recent (5)
│   └── ...
├── 🗂️ By Language
│   ├── TypeScript (12)
│   │   ├── 📄 useAuth Hook
│   │   └── 📄 API Client
│   ├── Python (8)
│   ├── Dockerfile (5)
│   └── YAML (4)
├── 🏷️ By Tag
│   ├── docker (8)
│   ├── react (6)
│   └── api (4)
└── ⚙️ Settings
```

### 5. Snippet Preview Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose Stack                              ⭐ ⚙️ 🔗  │
├─────────────────────────────────────────────────────────────┤
│ Production Docker setup with nginx, postgres, redis         │
│                                                             │
│ Tags: docker, devops, production                            │
│ Language: dockerfile                                        │
│ Files: 4                                                    │
├─────────────────────────────────────────────────────────────┤
│ 📁 Files                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ docker-compose.yml  │ Dockerfile │ nginx.conf │ .env    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  1 │ version: '3.8'                                     │ │
│ │  2 │                                                    │ │
│ │  3 │ services:                                          │ │
│ │  4 │   app:                                             │ │
│ │  5 │     build: .                                       │ │
│ │  6 │     ports:                                         │ │
│ │  7 │       - "{{APP_PORT}}:{{APP_PORT}}"                │ │
│ │  8 │     environment:                                   │ │
│ │  9 │       - NODE_ENV={{NODE_ENV}}                      │ │
│ │ 10 │     depends_on:                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📝 Variables                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ APP_PORT      │ [3000          ]  Port for the app      │ │
│ │ NODE_ENV      │ [production    ]  Environment           │ │
│ │ DB_PASSWORD   │ [••••••••      ]  Database password     │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Insert at Cursor]  [Insert as Files]  [Copy to Clipboard] │
└─────────────────────────────────────────────────────────────┘
```

### 6. Create Snippet from Selection

```
User selects code in editor
        │
        ▼
Right-click → "Save as SnippetVault Snippet"
   or Cmd+Shift+N
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Create New Snippet                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Title:       [                                         ]    │
│                                                             │
│ Description: [                                         ]    │
│                                                             │
│ Language:    [TypeScript            ▼] (auto-detected)      │
│                                                             │
│ Tags:        [react] [hooks] [+]                            │
│                                                             │
│ ☐ Make public                                               │
│                                                             │
│ Preview:                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ export function useDebounce<T>(value: T, delay: number) │ │
│ │   const [debouncedValue, setDebouncedValue] = useState  │ │
│ │   ...                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [Cancel]                    [Create Snippet]   │
└─────────────────────────────────────────────────────────────┘
```

### 7. Multi-File Insertion

```
User selects multi-file snippet
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Insert Multi-File Snippet                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ This snippet contains 4 files:                              │
│                                                             │
│ ☑ docker-compose.yml                                        │
│ ☑ Dockerfile                                                │
│ ☑ nginx/default.conf                                        │
│ ☐ .env.example                                              │
│                                                             │
│ Insert location:                                            │
│ ◉ Current folder (/Users/jose/project)                      │
│ ○ Choose folder...                                          │
│ ○ Create subfolder: [docker-setup        ]                  │
│                                                             │
│ ☐ Overwrite existing files                                  │
│                                                             │
│              [Cancel]                    [Insert Files]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### OAuth Flow with VSCode

```typescript
// src/auth/authService.ts

import * as vscode from 'vscode';

export class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(): Promise<boolean> {
    try {
      // Use VSCode's built-in authentication provider
      const session = await vscode.authentication.getSession(
        'snippetvault',
        ['read', 'write'],
        { createIfNone: true }
      );

      if (session) {
        this.session = {
          accessToken: session.accessToken,
          account: session.account,
        };
        await this.storeToken(session.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      vscode.window.showErrorMessage(`Authentication failed: ${error.message}`);
      return false;
    }
  }

  async logout(): Promise<void> {
    this.session = null;
    await this.clearToken();
  }

  async getToken(): Promise<string | null> {
    if (this.session?.accessToken) {
      return this.session.accessToken;
    }

    // Try to restore from secure storage
    const stored = await this.context.secrets.get('snippetvault.token');
    return stored || null;
  }

  private async storeToken(token: string): Promise<void> {
    await this.context.secrets.store('snippetvault.token', token);
  }

  private async clearToken(): Promise<void> {
    await this.context.secrets.delete('snippetvault.token');
  }
}
```

### Custom Authentication Provider

```typescript
// src/auth/authProvider.ts

import * as vscode from 'vscode';

export class SnippetVaultAuthProvider implements vscode.AuthenticationProvider {
  private static readonly AUTH_TYPE = 'snippetvault';
  private static readonly AUTH_NAME = 'SnippetVault';

  private _sessions: vscode.AuthenticationSession[] = [];
  private _onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

  readonly onDidChangeSessions = this._onDidChangeSessions.event;

  async getSessions(): Promise<readonly vscode.AuthenticationSession[]> {
    return this._sessions;
  }

  async createSession(scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
    // Open browser for OAuth
    const callbackUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(`${vscode.env.uriScheme}://snippetvault.snippetvault-vscode/callback`)
    );

    const authUrl = `https://snippetvault.app/api/auth/vscode?` +
      `redirect_uri=${encodeURIComponent(callbackUri.toString())}&` +
      `scopes=${encodeURIComponent(scopes.join(','))}`;

    await vscode.env.openExternal(vscode.Uri.parse(authUrl));

    // Wait for callback
    const token = await this.waitForCallback();

    // Fetch user info
    const userInfo = await this.fetchUserInfo(token);

    const session: vscode.AuthenticationSession = {
      id: userInfo.id,
      accessToken: token,
      account: {
        id: userInfo.id,
        label: userInfo.email,
      },
      scopes,
    };

    this._sessions.push(session);
    this._onDidChangeSessions.fire({
      added: [session],
      removed: [],
      changed: [],
    });

    return session;
  }

  async removeSession(sessionId: string): Promise<void> {
    const idx = this._sessions.findIndex(s => s.id === sessionId);
    if (idx > -1) {
      const session = this._sessions[idx];
      this._sessions.splice(idx, 1);
      this._onDidChangeSessions.fire({
        added: [],
        removed: [session],
        changed: [],
      });
    }
  }

  private async waitForCallback(): Promise<string> {
    return new Promise((resolve, reject) => {
      const disposable = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
          const token = new URLSearchParams(uri.query).get('token');
          if (token) {
            disposable.dispose();
            resolve(token);
          } else {
            reject(new Error('No token received'));
          }
        },
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        disposable.dispose();
        reject(new Error('Authentication timed out'));
      }, 5 * 60 * 1000);
    });
  }

  private async fetchUserInfo(token: string): Promise<{ id: string; email: string }> {
    const response = await fetch('https://api.snippetvault.app/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }
}
```

### Token Storage

```typescript
// Secure storage using VSCode's SecretStorage API

interface TokenStorage {
  // VSCode's SecretStorage (encrypted, OS-level security)
  // macOS: Keychain
  // Windows: Windows Credential Manager
  // Linux: libsecret

  store(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
}

// Usage
const secretStorage = context.secrets;
await secretStorage.store('snippetvault.token', token);
const token = await secretStorage.get('snippetvault.token');
```

---

## UI Components

### Tree View Provider

```typescript
// src/views/snippetTreeProvider.ts

import * as vscode from 'vscode';
import { SnippetService } from '../services/snippetService';

export class SnippetTreeProvider implements vscode.TreeDataProvider<SnippetTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SnippetTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private snippetService: SnippetService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SnippetTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SnippetTreeItem): Promise<SnippetTreeItem[]> {
    if (!element) {
      // Root level: categories
      return [
        new CategoryItem('Favorites', 'favorites', vscode.TreeItemCollapsibleState.Expanded),
        new CategoryItem('Recent', 'recent', vscode.TreeItemCollapsibleState.Collapsed),
        new CategoryItem('By Language', 'languages', vscode.TreeItemCollapsibleState.Collapsed),
        new CategoryItem('By Tag', 'tags', vscode.TreeItemCollapsibleState.Collapsed),
      ];
    }

    if (element instanceof CategoryItem) {
      switch (element.category) {
        case 'favorites':
          const favorites = await this.snippetService.getFavorites();
          return favorites.map(s => new SnippetItem(s));

        case 'recent':
          const recent = await this.snippetService.getRecent(10);
          return recent.map(s => new SnippetItem(s));

        case 'languages':
          const languages = await this.snippetService.getLanguages();
          return languages.map(l =>
            new LanguageItem(l.name, l.count, vscode.TreeItemCollapsibleState.Collapsed)
          );

        case 'tags':
          const tags = await this.snippetService.getTags();
          return tags.map(t =>
            new TagItem(t.name, t.count, t.color, vscode.TreeItemCollapsibleState.Collapsed)
          );
      }
    }

    if (element instanceof LanguageItem) {
      const snippets = await this.snippetService.getByLanguage(element.language);
      return snippets.map(s => new SnippetItem(s));
    }

    if (element instanceof TagItem) {
      const snippets = await this.snippetService.getByTag(element.tagName);
      return snippets.map(s => new SnippetItem(s));
    }

    return [];
  }
}

class SnippetItem extends vscode.TreeItem {
  constructor(public readonly snippet: Snippet) {
    super(snippet.title, vscode.TreeItemCollapsibleState.None);

    this.description = `${snippet.files.length} files`;
    this.tooltip = snippet.description || snippet.title;
    this.iconPath = snippet.isFavorite
      ? new vscode.ThemeIcon('star-full')
      : new vscode.ThemeIcon('file-code');

    this.command = {
      command: 'snippetvault.showSnippet',
      title: 'Show Snippet',
      arguments: [snippet],
    };

    this.contextValue = 'snippet';
  }
}

class CategoryItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly category: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'category';
  }
}
```

### Webview Panel

```typescript
// src/views/snippetPanel.ts

import * as vscode from 'vscode';

export class SnippetPanel {
  public static currentPanel: SnippetPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlContent(panel.webview, extensionUri);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'insert':
            await this.insertSnippet(message.snippet, message.variables);
            break;
          case 'copy':
            await this.copyToClipboard(message.snippet, message.variables);
            break;
          case 'insertFiles':
            await this.insertAsFiles(message.snippet, message.variables, message.options);
            break;
          case 'favorite':
            await this.toggleFavorite(message.snippetId);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static show(extensionUri: vscode.Uri, snippet: Snippet) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SnippetPanel.currentPanel) {
      SnippetPanel.currentPanel._panel.reveal(column);
      SnippetPanel.currentPanel.updateSnippet(snippet);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'snippetPreview',
      `Snippet: ${snippet.title}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    SnippetPanel.currentPanel = new SnippetPanel(panel, extensionUri);
    SnippetPanel.currentPanel.updateSnippet(snippet);
  }

  public updateSnippet(snippet: Snippet) {
    this._panel.webview.postMessage({
      command: 'updateSnippet',
      snippet,
    });
  }

  private async insertSnippet(snippet: Snippet, variables: Record<string, string>) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    // Get first file content (or all files concatenated)
    let content = snippet.files[0].content;

    // Substitute variables
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, content);
    });

    vscode.window.showInformationMessage(`Inserted: ${snippet.title}`);
  }

  private async insertAsFiles(
    snippet: Snippet,
    variables: Record<string, string>,
    options: { folder: string; overwrite: boolean }
  ) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const baseUri = options.folder
      ? vscode.Uri.joinPath(workspaceFolder.uri, options.folder)
      : workspaceFolder.uri;

    for (const file of snippet.files) {
      let content = file.content;
      let filename = file.filename;

      // Substitute variables in content and filename
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        filename = filename.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      const fileUri = vscode.Uri.joinPath(baseUri, filename);

      // Check if file exists
      try {
        await vscode.workspace.fs.stat(fileUri);
        if (!options.overwrite) {
          const choice = await vscode.window.showWarningMessage(
            `File ${filename} already exists. Overwrite?`,
            'Yes',
            'No',
            'Yes to All'
          );
          if (choice === 'No') continue;
          if (choice === 'Yes to All') options.overwrite = true;
        }
      } catch {
        // File doesn't exist, good to create
      }

      // Ensure directory exists
      const dirUri = vscode.Uri.joinPath(fileUri, '..');
      await vscode.workspace.fs.createDirectory(dirUri);

      // Write file
      await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(content, 'utf8')
      );
    }

    vscode.window.showInformationMessage(
      `Created ${snippet.files.length} files from: ${snippet.title}`
    );
  }

  private _getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'snippetPanel.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'snippetPanel.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Snippet Preview</title>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
```

### Quick Pick for Snippet Search

```typescript
// src/commands/searchCommand.ts

import * as vscode from 'vscode';
import Fuse from 'fuse.js';

export async function searchSnippets(snippetService: SnippetService) {
  const snippets = await snippetService.getAllSnippets();

  // Setup fuzzy search
  const fuse = new Fuse(snippets, {
    keys: ['title', 'description', 'tags.name', 'language'],
    threshold: 0.3,
    includeScore: true,
  });

  const quickPick = vscode.window.createQuickPick<SnippetQuickPickItem>();
  quickPick.placeholder = 'Search SnippetVault snippets...';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  // Initial items (recent/favorites)
  const favorites = snippets.filter(s => s.isFavorite);
  quickPick.items = favorites.map(s => new SnippetQuickPickItem(s));

  // Update items on search
  quickPick.onDidChangeValue((value) => {
    if (!value) {
      quickPick.items = favorites.map(s => new SnippetQuickPickItem(s));
      return;
    }

    const results = fuse.search(value);
    quickPick.items = results.slice(0, 20).map(r => new SnippetQuickPickItem(r.item));
  });

  // Handle selection
  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0];
    if (!selected) return;

    quickPick.hide();

    // Check if user wants variable input (Cmd+Enter)
    if (selected.snippet.variables.length > 0) {
      const variables = await promptForVariables(selected.snippet.variables);
      if (variables) {
        await insertSnippet(selected.snippet, variables);
      }
    } else {
      await insertSnippet(selected.snippet, {});
    }
  });

  quickPick.show();
}

class SnippetQuickPickItem implements vscode.QuickPickItem {
  label: string;
  description: string;
  detail: string;

  constructor(public readonly snippet: Snippet) {
    const icon = snippet.isFavorite ? '$(star-full)' : '$(file-code)';
    this.label = `${icon} ${snippet.title}`;
    this.description = `${snippet.language} • ${snippet.files.length} files`;
    this.detail = snippet.description || '';

    if (snippet.tags.length > 0) {
      this.detail += ` • ${snippet.tags.map(t => t.name).join(', ')}`;
    }
  }
}

async function promptForVariables(
  variables: Variable[]
): Promise<Record<string, string> | undefined> {
  const result: Record<string, string> = {};

  for (const variable of variables) {
    const value = await vscode.window.showInputBox({
      prompt: `Enter value for {{${variable.name}}}`,
      placeHolder: variable.defaultValue,
      value: variable.defaultValue,
      title: variable.description || variable.name,
    });

    if (value === undefined) {
      // User cancelled
      return undefined;
    }

    result[variable.name] = value || variable.defaultValue;
  }

  return result;
}
```

---

## API Integration

### Snippet Service

```typescript
// src/services/snippetService.ts

import axios, { AxiosInstance } from 'axios';
import { AuthService } from '../auth/authService';
import { CacheManager } from './cacheManager';

export class SnippetService {
  private client: AxiosInstance;
  private cache: CacheManager;

  constructor(
    private auth: AuthService,
    baseUrl: string = 'https://api.snippetvault.app'
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await this.auth.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.cache = new CacheManager();
  }

  async getAllSnippets(forceRefresh = false): Promise<Snippet[]> {
    const cacheKey = 'all_snippets';

    if (!forceRefresh) {
      const cached = this.cache.get<Snippet[]>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.client.get('/api/snippets', {
      params: { limit: 1000 },
    });

    const snippets = response.data.snippets;
    this.cache.set(cacheKey, snippets, 5 * 60 * 1000); // 5 min TTL
    return snippets;
  }

  async getSnippet(id: string): Promise<Snippet> {
    const cacheKey = `snippet_${id}`;
    const cached = this.cache.get<Snippet>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/api/snippets/${id}`);
    const snippet = response.data.snippet;
    this.cache.set(cacheKey, snippet, 10 * 60 * 1000); // 10 min TTL
    return snippet;
  }

  async getFavorites(): Promise<Snippet[]> {
    const all = await this.getAllSnippets();
    return all.filter(s => s.isFavorite);
  }

  async getRecent(limit: number): Promise<Snippet[]> {
    const all = await this.getAllSnippets();
    return all
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async getByLanguage(language: string): Promise<Snippet[]> {
    const all = await this.getAllSnippets();
    return all.filter(s => s.language === language);
  }

  async getByTag(tagName: string): Promise<Snippet[]> {
    const all = await this.getAllSnippets();
    return all.filter(s => s.tags.some(t => t.name === tagName));
  }

  async getLanguages(): Promise<{ name: string; count: number }[]> {
    const all = await this.getAllSnippets();
    const langMap = new Map<string, number>();

    for (const snippet of all) {
      const count = langMap.get(snippet.language) || 0;
      langMap.set(snippet.language, count + 1);
    }

    return Array.from(langMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTags(): Promise<{ name: string; count: number; color: string }[]> {
    const response = await this.client.get('/api/tags');
    return response.data.tags;
  }

  async createSnippet(data: CreateSnippetInput): Promise<Snippet> {
    const response = await this.client.post('/api/snippets', data);
    this.cache.invalidate('all_snippets');
    return response.data.snippet;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const response = await this.client.patch(`/api/snippets/${id}/favorite`);
    this.cache.invalidate('all_snippets');
    this.cache.invalidate(`snippet_${id}`);
    return response.data.isFavorite;
  }

  async search(query: string): Promise<Snippet[]> {
    const all = await this.getAllSnippets();

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(all, {
      keys: ['title', 'description', 'tags.name'],
      threshold: 0.3,
    });

    return fuse.search(query).map(r => r.item);
  }
}
```

### Cache Manager

```typescript
// src/services/cacheManager.ts

import * as vscode from 'vscode';
import { LRUCache } from 'lru-cache';

export class CacheManager {
  private memoryCache: LRUCache<string, any>;
  private storage: vscode.Memento;

  constructor(storage?: vscode.Memento) {
    this.memoryCache = new LRUCache({
      max: 100,
      ttl: 5 * 60 * 1000, // 5 minutes default
    });

    if (storage) {
      this.storage = storage;
    }
  }

  get<T>(key: string): T | undefined {
    // Check memory cache first
    const cached = this.memoryCache.get(key);
    if (cached) return cached as T;

    // Check persistent storage
    if (this.storage) {
      const stored = this.storage.get<{ value: T; expiry: number }>(key);
      if (stored && stored.expiry > Date.now()) {
        // Restore to memory cache
        this.memoryCache.set(key, stored.value);
        return stored.value;
      }
    }

    return undefined;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.memoryCache.set(key, value, { ttl });

    // Also persist to storage
    if (this.storage && ttl) {
      this.storage.update(key, {
        value,
        expiry: Date.now() + ttl,
      });
    }
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    if (this.storage) {
      this.storage.update(key, undefined);
    }
  }

  invalidateAll(): void {
    this.memoryCache.clear();
  }
}
```

### Offline Support

```typescript
// src/services/offlineManager.ts

import * as vscode from 'vscode';

export class OfflineManager {
  private isOnline: boolean = true;
  private pendingOperations: PendingOperation[] = [];

  constructor(private context: vscode.ExtensionContext) {
    // Check connectivity periodically
    setInterval(() => this.checkConnectivity(), 30000);
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://api.snippetvault.app/health', {
        method: 'HEAD',
        timeout: 5000,
      });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }

    // Process pending operations if back online
    if (this.isOnline && this.pendingOperations.length > 0) {
      await this.processPendingOperations();
    }

    return this.isOnline;
  }

  get online(): boolean {
    return this.isOnline;
  }

  queueOperation(operation: PendingOperation): void {
    this.pendingOperations.push(operation);
    this.persistPendingOperations();
  }

  private async processPendingOperations(): Promise<void> {
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const op of operations) {
      try {
        await this.executeOperation(op);
      } catch (error) {
        // Re-queue failed operations
        this.pendingOperations.push(op);
      }
    }

    this.persistPendingOperations();
  }

  private async executeOperation(op: PendingOperation): Promise<void> {
    switch (op.type) {
      case 'create':
        await snippetService.createSnippet(op.data);
        break;
      case 'favorite':
        await snippetService.toggleFavorite(op.snippetId);
        break;
    }
  }

  private persistPendingOperations(): void {
    this.context.globalState.update(
      'pendingOperations',
      this.pendingOperations
    );
  }
}

interface PendingOperation {
  type: 'create' | 'favorite' | 'update';
  data?: any;
  snippetId?: string;
  timestamp: number;
}
```

---

## Data Management

### Extension Settings

```json
// package.json contribution points

{
  "contributes": {
    "configuration": {
      "title": "SnippetVault",
      "properties": {
        "snippetvault.apiUrl": {
          "type": "string",
          "default": "https://api.snippetvault.app",
          "description": "SnippetVault API URL"
        },
        "snippetvault.cacheEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable local caching for offline access"
        },
        "snippetvault.cacheTTL": {
          "type": "number",
          "default": 300,
          "description": "Cache time-to-live in seconds"
        },
        "snippetvault.showStatusBar": {
          "type": "boolean",
          "default": true,
          "description": "Show snippet count in status bar"
        },
        "snippetvault.insertMode": {
          "type": "string",
          "enum": ["cursor", "replace", "newFile"],
          "default": "cursor",
          "description": "Default snippet insertion mode"
        },
        "snippetvault.autoDetectLanguage": {
          "type": "boolean",
          "default": true,
          "description": "Auto-detect language when creating snippets"
        },
        "snippetvault.filterByCurrentLanguage": {
          "type": "boolean",
          "default": false,
          "description": "Filter snippets by current file language"
        }
      }
    }
  }
}
```

### Telemetry (Optional)

```typescript
// src/telemetry.ts

import * as vscode from 'vscode';

export class Telemetry {
  private enabled: boolean;

  constructor() {
    // Respect VSCode telemetry settings
    this.enabled = vscode.env.isTelemetryEnabled;
  }

  trackEvent(name: string, properties?: Record<string, string>): void {
    if (!this.enabled) return;

    // Send to analytics (privacy-respecting, no PII)
    // Only track: command usage, feature usage, errors
  }

  trackError(error: Error, context?: string): void {
    if (!this.enabled) return;

    // Track error for debugging (no stack traces with PII)
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic extension with authentication and read operations

- [ ] Extension scaffolding with TypeScript + esbuild
- [ ] Authentication provider implementation
- [ ] OAuth flow with callback handling
- [ ] API client setup
- [ ] Basic snippet fetching
- [ ] Settings contribution

**Deliverable**: Extension that authenticates and fetches snippets

### Phase 2: Core Features (Week 3-4)

**Goal**: Search, browse, and insert snippets

- [ ] Quick Pick search implementation
- [ ] Fuzzy search with Fuse.js
- [ ] Sidebar tree view
- [ ] Snippet preview panel (webview)
- [ ] Insert at cursor
- [ ] Variable substitution

**Deliverable**: Fully functional read-only extension

### Phase 3: Creation & Caching (Week 5-6)

**Goal**: Create snippets and offline support

- [ ] "Save as Snippet" from selection
- [ ] Create snippet webview form
- [ ] Local caching with LRU
- [ ] Offline mode with queue
- [ ] Multi-file snippet insertion

**Deliverable**: Full CRUD operations with offline support

### Phase 4: Polish & Distribution (Week 7-8)

**Goal**: Production-ready extension

- [ ] Status bar integration
- [ ] Context menu items
- [ ] Keyboard shortcuts
- [ ] Settings UI
- [ ] Error handling & recovery
- [ ] Documentation
- [ ] Marketplace publishing

**Deliverable**: Published extension on VS Code Marketplace

---

## Testing Strategy

### Unit Tests

```typescript
// src/test/suite/snippetService.test.ts

import * as assert from 'assert';
import { SnippetService } from '../../services/snippetService';

suite('SnippetService Test Suite', () => {
  let service: SnippetService;

  setup(() => {
    service = new SnippetService(mockAuth, 'http://localhost:3000');
  });

  test('should fetch all snippets', async () => {
    const snippets = await service.getAllSnippets();
    assert.ok(Array.isArray(snippets));
  });

  test('should filter by language', async () => {
    const snippets = await service.getByLanguage('typescript');
    assert.ok(snippets.every(s => s.language === 'typescript'));
  });

  test('should cache snippets', async () => {
    const first = await service.getAllSnippets();
    const second = await service.getAllSnippets();
    // Should return same reference (cached)
    assert.strictEqual(first, second);
  });
});
```

### Integration Tests

```typescript
// src/test/suite/extension.test.ts

import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('snippetvault.snippetvault-vscode'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('snippetvault.snippetvault-vscode');
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('snippetvault.search'));
    assert.ok(commands.includes('snippetvault.create'));
    assert.ok(commands.includes('snippetvault.browse'));
  });
});
```

### E2E Tests

```typescript
// src/test/e2e/workflow.test.ts

import { VSBrowser, WebDriver } from 'vscode-extension-tester';

describe('SnippetVault E2E Tests', () => {
  let browser: VSBrowser;
  let driver: WebDriver;

  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;
  });

  it('should open command palette and search', async () => {
    // Open command palette
    await driver.actions().keyDown('cmd').sendKeys('shift', 'p').perform();

    // Type command
    await driver.findElement({ css: 'input' }).sendKeys('SnippetVault: Search');

    // Execute command
    // ... verify Quick Pick opens
  });

  it('should insert snippet at cursor', async () => {
    // Create test file
    // Open snippet search
    // Select snippet
    // Verify content inserted
  });
});
```

---

## Distribution

### Marketplace Listing

```json
// package.json

{
  "name": "snippetvault-vscode",
  "displayName": "SnippetVault",
  "description": "Access your code snippets directly in VSCode. Search, insert, and create snippets without leaving your editor.",
  "version": "1.0.0",
  "publisher": "snippetvault",
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#1a1a1a",
    "theme": "dark"
  },
  "categories": [
    "Snippets",
    "Other"
  ],
  "keywords": [
    "snippets",
    "code snippets",
    "snippet manager",
    "code templates",
    "boilerplate"
  ],
  "engines": {
    "vscode": "^1.80.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/snippetvault/vscode-extension"
  },
  "bugs": {
    "url": "https://github.com/snippetvault/vscode-extension/issues"
  },
  "homepage": "https://snippetvault.app"
}
```

### README for Marketplace

```markdown
# SnippetVault for VSCode

Access your code snippets directly in VSCode. Search, insert, and create snippets without leaving your editor.

## Features

- **Quick Search** (`Cmd+Shift+S`): Fuzzy search across all your snippets
- **Sidebar Panel**: Browse snippets by language, tag, or favorites
- **Variable Substitution**: Fill in template variables during insertion
- **Multi-File Snippets**: Insert entire project scaffolds at once
- **Save from Selection**: Turn any code selection into a reusable snippet
- **Offline Support**: Access cached snippets without internet

## Installation

1. Install from VS Code Marketplace
2. Click the SnippetVault icon in the sidebar
3. Sign in with your SnippetVault account
4. Start coding!

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Search Snippets | `Cmd+Shift+S` | Quick search and insert |
| Create Snippet | `Cmd+Shift+N` | Save selection as snippet |
| Browse Snippets | `Cmd+Shift+B` | Open sidebar panel |

## Screenshots

![Search](images/search.png)
![Sidebar](images/sidebar.png)
![Insert](images/insert.png)

## Requirements

- VSCode 1.80.0 or higher
- SnippetVault account (free at snippetvault.app)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `snippetvault.cacheEnabled` | `true` | Enable offline caching |
| `snippetvault.showStatusBar` | `true` | Show snippet count |
| `snippetvault.filterByCurrentLanguage` | `false` | Filter by file type |

## Privacy

This extension only communicates with the SnippetVault API. Your code snippets are stored securely in your account. We do not collect telemetry data without your consent.

## Support

- [Documentation](https://docs.snippetvault.app/vscode)
- [Issues](https://github.com/snippetvault/vscode-extension/issues)
- [Discord](https://discord.gg/snippetvault)

## License

MIT
```

### CI/CD Pipeline

```yaml
# .github/workflows/release.yml

name: Release Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build extension
        run: pnpm run package

      - name: Publish to Marketplace
        run: pnpm vsce publish -p ${{ secrets.VSCE_PAT }}
```

---

## Project Structure

```
packages/vscode-extension/
├── .vscode/
│   ├── launch.json              # Debug configurations
│   └── tasks.json               # Build tasks
├── src/
│   ├── extension.ts             # Extension entry point
│   ├── commands/
│   │   ├── index.ts             # Command registration
│   │   ├── search.ts            # Search command
│   │   ├── create.ts            # Create snippet command
│   │   ├── insert.ts            # Insert command
│   │   └── favorite.ts          # Toggle favorite
│   ├── views/
│   │   ├── snippetTreeProvider.ts
│   │   ├── snippetPanel.ts      # Webview panel
│   │   └── statusBar.ts         # Status bar item
│   ├── services/
│   │   ├── snippetService.ts    # API integration
│   │   ├── cacheManager.ts      # Local caching
│   │   └── offlineManager.ts    # Offline queue
│   ├── auth/
│   │   ├── authService.ts       # Authentication logic
│   │   └── authProvider.ts      # VSCode auth provider
│   ├── utils/
│   │   ├── variables.ts         # Variable substitution
│   │   ├── language.ts          # Language detection
│   │   └── clipboard.ts         # Clipboard operations
│   └── types/
│       └── index.ts             # TypeScript types
├── media/
│   ├── snippetPanel.js          # Webview script
│   ├── snippetPanel.css         # Webview styles
│   └── icons/                   # Extension icons
├── test/
│   ├── suite/
│   │   ├── extension.test.ts
│   │   └── snippetService.test.ts
│   └── e2e/
│       └── workflow.test.ts
├── images/
│   ├── icon.png                 # Extension icon
│   └── screenshots/             # Marketplace screenshots
├── package.json
├── tsconfig.json
├── esbuild.config.js
├── .vscodeignore
├── CHANGELOG.md
└── README.md
```

---

## Future Enhancements

### Version 1.1

- [ ] Snippet preview on hover in Quick Pick
- [ ] IntelliSense integration (suggest snippets while typing)
- [ ] Snippet diff view (compare with local file)
- [ ] Bulk import from local files

### Version 1.2

- [ ] Workspace-specific snippet collections
- [ ] Team snippets (shared libraries)
- [ ] Snippet usage analytics
- [ ] Code actions (suggest snippets for errors)

### Version 2.0

- [ ] AI-powered snippet suggestions
- [ ] Natural language snippet search
- [ ] Automatic variable detection
- [ ] Snippet generation from comments

### Other IDE Extensions

- [ ] JetBrains IDE plugin (IntelliJ, WebStorm, PyCharm)
- [ ] Neovim/Vim plugin
- [ ] Sublime Text package
- [ ] Zed extension

---

## Appendix

### A. API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/snippets` | GET | List all user snippets |
| `/api/snippets/:id` | GET | Get snippet details |
| `/api/snippets` | POST | Create new snippet |
| `/api/snippets/:id/favorite` | PATCH | Toggle favorite |
| `/api/tags` | GET | List all tags |
| `/api/auth/vscode` | GET | VSCode OAuth |
| `/api/auth/me` | GET | Current user info |

### B. Keyboard Shortcuts Summary

| Shortcut | Command | Context |
|----------|---------|---------|
| `Cmd+Shift+S` | Search snippets | Global |
| `Cmd+Shift+N` | Create snippet | When text selected |
| `Cmd+Shift+B` | Open sidebar | Global |
| `Cmd+Enter` | Insert with variables | In Quick Pick |
| `Escape` | Close panel | In any panel |

### C. Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Extension activation | < 100ms | Lazy loading |
| Quick Pick open | < 200ms | Cached data |
| Snippet search | < 50ms | Client-side Fuse.js |
| Insert snippet | < 100ms | Direct editor API |
| Full refresh | < 2s | Background API call |

### D. Accessibility

- All commands accessible via keyboard
- Screen reader support for tree view
- High contrast theme compatibility
- Configurable keybindings

---

## References

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Authentication API](https://code.visualstudio.com/api/references/vscode-api#authentication)
- [VSCode Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Fuse.js Documentation](https://fusejs.io/)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
