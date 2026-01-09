# SnippetVault CLI Tool - Architecture Document

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
5. [Authentication & Security](#authentication--security)
6. [Command Reference](#command-reference)
7. [Data Models](#data-models)
8. [API Requirements](#api-requirements)
9. [Project Structure](#project-structure)
10. [Implementation Phases](#implementation-phases)
11. [Error Handling](#error-handling)
12. [Testing Strategy](#testing-strategy)
13. [Distribution](#distribution)
14. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The SnippetVault CLI (`sv`) is a command-line interface tool that brings the full power of SnippetVault to the terminal. It enables developers to search, copy, manage, and sync code snippets without leaving their workflow.

### Why a CLI?

- **Terminal-first aesthetic**: Aligns with SnippetVault's brutalist design philosophy
- **Developer workflow**: Most developers live in the terminal
- **Automation**: Enable CI/CD integration and scripting
- **Speed**: Faster than context-switching to a browser
- **Offline capability**: Local caching for frequently used snippets

---

## Goals & Non-Goals

### Goals

- Fast snippet retrieval with variable substitution
- Seamless authentication with the web app
- Offline-first with intelligent caching
- Scriptable for automation and CI/CD
- Cross-platform (macOS, Linux, Windows)
- Minimal dependencies, single binary distribution

### Non-Goals

- Full snippet editing (use web app for complex edits)
- Real-time collaboration features
- GUI elements or TUI (text user interface) - keep it pure CLI
- Replacing the web app entirely

---

## User Stories

### Core User Stories

```
As a developer, I want to:

1. Search my snippets from the terminal
   `sv search "docker nginx" --lang dockerfile`

2. Copy a snippet to clipboard with variables filled in
   `sv copy my-react-hook --var name=useAuth --var returnType=boolean`

3. View a snippet's contents in the terminal
   `sv show docker-compose-stack`

4. List all my snippets with filtering
   `sv list --tag devops --lang yaml --limit 20`

5. Create a new snippet from a local file
   `sv create ./Dockerfile --title "Node.js Production Dockerfile"`

6. Sync local files to/from SnippetVault
   `sv sync ./snippets --direction pull`

7. Export a snippet to local files
   `sv export my-snippet --output ./exported/`

8. Quickly authenticate with my account
   `sv login`
```

### Power User Stories

```
As a power user, I want to:

1. Use snippets in shell pipelines
   `sv show my-script | bash`

2. Create snippets from stdin
   `cat docker-compose.yml | sv create --title "Compose file"`

3. Use environment variables for authentication
   `SV_TOKEN=xxx sv list`

4. Configure default behaviors
   `sv config set default-output clipboard`

5. Use in CI/CD pipelines
   `sv export $SNIPPET_ID --output ./config/`
```

---

## Technical Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    SnippetVault CLI                      │
├─────────────────────────────────────────────────────────┤
│  Language: Rust (for performance + single binary)        │
│  Alternative: Go (simpler, good CLI ecosystem)           │
├─────────────────────────────────────────────────────────┤
│  Key Dependencies:                                       │
│  - clap (argument parsing)                               │
│  - reqwest (HTTP client)                                 │
│  - serde (JSON serialization)                            │
│  - keyring (secure credential storage)                   │
│  - tokio (async runtime)                                 │
│  - colored (terminal colors)                             │
│  - clipboard (system clipboard access)                   │
└─────────────────────────────────────────────────────────┘
```

### System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         User Terminal                           │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      SnippetVault CLI                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Command    │  │    Config    │  │    Cache Manager     │  │
│  │   Parser     │  │   Manager    │  │  (SQLite/JSON)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Core Engine                           │   │
│  │  - Authentication Handler                                │   │
│  │  - API Client (HTTP)                                     │   │
│  │  - Variable Substitution Engine                          │   │
│  │  - Output Formatter                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    SnippetVault API                             │
│                  (api.snippetvault.app)                         │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Command
     │
     ▼
┌─────────────┐     ┌─────────────┐
│   Parse     │────▶│   Validate  │
│   Args      │     │   Input     │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Check Cache   │
                   │ (if enabled)  │
                   └───────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       Cache Hit                  Cache Miss
              │                         │
              │                         ▼
              │                 ┌───────────────┐
              │                 │   API Call    │
              │                 └───────┬───────┘
              │                         │
              │                         ▼
              │                 ┌───────────────┐
              │                 │ Update Cache  │
              │                 └───────┬───────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │   Process     │
                   │   Variables   │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │   Output      │
                   │   (stdout/    │
                   │   clipboard)  │
                   └───────────────┘
```

---

## Authentication & Security

### Authentication Methods

#### 1. Interactive Login (Primary)

```bash
$ sv login

Opening browser for authentication...
Waiting for callback...

✓ Authenticated as jose@example.com
  Token stored securely in system keychain.
```

**Flow**:
1. CLI opens browser to `https://snippetvault.app/cli/auth`
2. User logs in via web (existing auth)
3. Web generates short-lived code
4. User enters code in CLI or callback completes automatically
5. CLI exchanges code for API token
6. Token stored in system keychain

#### 2. API Token (CI/CD & Automation)

```bash
# Generate token in web app Settings > API Tokens
$ sv config set token <your-api-token>

# Or use environment variable
$ export SV_TOKEN=<your-api-token>
$ sv list
```

#### 3. Device Authorization Flow

```bash
$ sv login --device

Visit: https://snippetvault.app/device
Enter code: ABCD-1234

Waiting for authorization...
✓ Authenticated successfully!
```

### Token Storage

```
┌─────────────────────────────────────────────────────────┐
│                   Credential Storage                     │
├─────────────────────────────────────────────────────────┤
│  macOS:   Keychain Access (via Security framework)       │
│  Linux:   Secret Service API (GNOME Keyring, KWallet)    │
│  Windows: Windows Credential Manager                     │
│  Fallback: Encrypted file (~/.config/sv/credentials)     │
└─────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **Token Scope**: API tokens have limited permissions (no password change, no delete account)
2. **Token Expiry**: Tokens expire after 90 days (configurable)
3. **Rate Limiting**: CLI respects API rate limits with exponential backoff
4. **Audit Logging**: All CLI actions logged in user's activity history
5. **Revocation**: Tokens can be revoked from web app immediately

---

## Command Reference

### Global Options

```
sv [OPTIONS] <COMMAND>

OPTIONS:
    -c, --config <PATH>     Config file path [default: ~/.config/sv/config.toml]
    -o, --output <FORMAT>   Output format: text, json, yaml [default: text]
    -q, --quiet             Suppress non-essential output
    -v, --verbose           Increase verbosity (-v, -vv, -vvv)
    --no-color              Disable colored output
    --no-cache              Bypass cache for this request
    -h, --help              Print help
    -V, --version           Print version
```

### Commands

#### `sv login`

```bash
sv login [OPTIONS]

Authenticate with SnippetVault

OPTIONS:
    --device          Use device authorization flow
    --token <TOKEN>   Authenticate with API token directly
    --browser <CMD>   Custom browser command [default: system default]

EXAMPLES:
    sv login                    # Interactive browser login
    sv login --device           # Device code flow (for SSH sessions)
    sv login --token abc123     # Direct token auth
```

#### `sv logout`

```bash
sv logout [OPTIONS]

Remove stored credentials

OPTIONS:
    --all    Remove all stored tokens (including for other accounts)
```

#### `sv list`

```bash
sv list [OPTIONS]

List snippets

OPTIONS:
    -t, --tag <TAG>           Filter by tag (can be repeated)
    -l, --lang <LANGUAGE>     Filter by language
    -f, --favorite            Show only favorites
    -p, --public              Show only public snippets
    -s, --sort <FIELD>        Sort by: created, updated, title [default: updated]
    -d, --desc                Sort descending
    -n, --limit <N>           Limit results [default: 20]
    --offset <N>              Skip first N results

EXAMPLES:
    sv list                           # List recent snippets
    sv list --tag docker --lang yaml  # Filter by tag and language
    sv list --favorite --limit 5      # Top 5 favorites
    sv list -o json | jq '.[]'        # Pipe to jq for processing
```

#### `sv search`

```bash
sv search <QUERY> [OPTIONS]

Search snippets by title, description, or content

ARGS:
    <QUERY>    Search query (supports basic operators)

OPTIONS:
    -t, --tag <TAG>           Filter by tag
    -l, --lang <LANGUAGE>     Filter by language
    -n, --limit <N>           Limit results [default: 10]
    --content                 Search in file contents (slower)

EXAMPLES:
    sv search "docker nginx"              # Search in titles/descriptions
    sv search "useEffect" --content       # Search in code content
    sv search "api" --tag backend --lang typescript
```

#### `sv show`

```bash
sv show <SNIPPET> [OPTIONS]

Display snippet contents

ARGS:
    <SNIPPET>    Snippet ID, slug, or title (fuzzy matched)

OPTIONS:
    -f, --file <NAME>         Show specific file only
    --no-highlight            Disable syntax highlighting
    --line-numbers            Show line numbers
    --var <KEY=VALUE>         Set variable value (can be repeated)

EXAMPLES:
    sv show docker-compose            # Show by slug/title
    sv show abc123                    # Show by ID
    sv show my-hook --var name=Auth   # With variable substitution
    sv show my-snippet -f main.ts     # Show specific file
```

#### `sv copy`

```bash
sv copy <SNIPPET> [OPTIONS]

Copy snippet to clipboard

ARGS:
    <SNIPPET>    Snippet ID, slug, or title

OPTIONS:
    -f, --file <NAME>         Copy specific file only
    --var <KEY=VALUE>         Set variable value (can be repeated)
    --all-files               Concatenate all files
    --separator <SEP>         File separator [default: "\n---\n"]
    --no-substitute           Don't substitute variables

EXAMPLES:
    sv copy my-hook --var name=Auth --var type=boolean
    sv copy docker-stack -f docker-compose.yml
    sv copy react-component --all-files
```

#### `sv export`

```bash
sv export <SNIPPET> [OPTIONS]

Export snippet files to disk

ARGS:
    <SNIPPET>    Snippet ID, slug, or title

OPTIONS:
    -o, --output <DIR>        Output directory [default: ./]
    --var <KEY=VALUE>         Set variable value (can be repeated)
    --flat                    Don't preserve directory structure
    --overwrite               Overwrite existing files

EXAMPLES:
    sv export docker-stack -o ./docker/
    sv export my-project --var name=MyApp -o ./src/
```

#### `sv create`

```bash
sv create [FILES...] [OPTIONS]

Create a new snippet

ARGS:
    [FILES...]    Files to include (globs supported)

OPTIONS:
    -t, --title <TITLE>       Snippet title (required)
    -d, --desc <DESC>         Description
    -l, --lang <LANGUAGE>     Primary language [default: auto-detect]
    --tag <TAG>               Add tag (can be repeated)
    --public                  Make snippet public
    --var <NAME=DEFAULT>      Add variable with default value
    -i, --interactive         Interactive mode for additional options

EXAMPLES:
    sv create ./Dockerfile --title "Node Dockerfile"
    sv create ./src/*.ts --title "TypeScript Utils" --tag typescript
    cat file.js | sv create --title "Quick Snippet" --lang javascript
    sv create -i  # Interactive mode
```

#### `sv edit`

```bash
sv edit <SNIPPET> [OPTIONS]

Edit snippet in default editor

ARGS:
    <SNIPPET>    Snippet ID, slug, or title

OPTIONS:
    --editor <CMD>            Editor command [default: $EDITOR or vim]
    --file <NAME>             Edit specific file only
    --metadata                Edit metadata (title, desc, tags) only

EXAMPLES:
    sv edit my-snippet                    # Open in $EDITOR
    sv edit my-snippet --editor code      # Open in VS Code
    sv edit my-snippet --file index.ts    # Edit specific file
```

#### `sv delete`

```bash
sv delete <SNIPPET> [OPTIONS]

Delete a snippet

ARGS:
    <SNIPPET>    Snippet ID, slug, or title

OPTIONS:
    -f, --force    Skip confirmation prompt

EXAMPLES:
    sv delete old-snippet
    sv delete abc123 --force
```

#### `sv sync`

```bash
sv sync [PATH] [OPTIONS]

Sync snippets with local directory

ARGS:
    [PATH]    Directory to sync [default: ./snippets]

OPTIONS:
    --direction <DIR>     pull, push, or both [default: both]
    --dry-run             Show what would happen without making changes
    --delete              Delete local files not in remote (for pull)
    --ignore <PATTERN>    Ignore pattern (can be repeated)

EXAMPLES:
    sv sync ./snippets --direction pull
    sv sync ./my-snippets --dry-run
    sv sync --direction push ./local-snippets/
```

#### `sv config`

```bash
sv config <SUBCOMMAND>

Manage CLI configuration

SUBCOMMANDS:
    get <KEY>           Get config value
    set <KEY> <VALUE>   Set config value
    list                List all config values
    reset               Reset to defaults
    path                Show config file path

CONFIG KEYS:
    api_url             API base URL
    default_output      Default output format (text/json/yaml)
    cache_ttl           Cache time-to-live in seconds
    color               Enable colors (true/false)
    editor              Default editor command

EXAMPLES:
    sv config set default_output json
    sv config get api_url
    sv config list
```

#### `sv cache`

```bash
sv cache <SUBCOMMAND>

Manage local cache

SUBCOMMANDS:
    clear     Clear all cached data
    stats     Show cache statistics
    path      Show cache directory path

EXAMPLES:
    sv cache clear
    sv cache stats
```

#### `sv whoami`

```bash
sv whoami

Display current user information

OUTPUT:
    Email: jose@example.com
    Name: Jose Mokeni
    Snippets: 42
    Plan: Pro
    Token expires: 2026-04-07
```

---

## Data Models

### Local Configuration

```toml
# ~/.config/sv/config.toml

[auth]
# Token stored in system keychain, not here
api_url = "https://api.snippetvault.app"

[defaults]
output = "text"           # text, json, yaml
color = true
editor = "vim"
pager = "less"

[cache]
enabled = true
ttl = 3600                # 1 hour
max_size = "100MB"

[sync]
default_directory = "~/snippets"
ignore = [".git", "node_modules", ".env"]
```

### Cache Schema (SQLite)

```sql
-- ~/.cache/sv/cache.db

CREATE TABLE snippets (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    data JSON NOT NULL,           -- Full snippet with files, variables, tags
    etag TEXT,                    -- For HTTP caching
    cached_at INTEGER NOT NULL,   -- Unix timestamp
    accessed_at INTEGER NOT NULL  -- For LRU eviction
);

CREATE INDEX idx_snippets_slug ON snippets(slug);
CREATE INDEX idx_snippets_accessed ON snippets(accessed_at);

CREATE TABLE search_cache (
    query_hash TEXT PRIMARY KEY,
    results JSON NOT NULL,
    cached_at INTEGER NOT NULL
);
```

### API Response Types

```typescript
// Types shared between CLI and API

interface Snippet {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  language: string;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  files: File[];
  variables: Variable[];
  tags: Tag[];
}

interface File {
  id: string;
  filename: string;
  content: string;
  language: string;
  order: number;
}

interface Variable {
  id: string;
  name: string;
  defaultValue: string;
  description: string | null;
  order: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ListResponse {
  snippets: Snippet[];
  total: number;
  hasMore: boolean;
}
```

---

## API Requirements

### New Endpoints Required

```typescript
// apps/api/src/routes/cli.ts

// Device authorization flow
POST /api/cli/device/code
  Response: { device_code, user_code, verification_uri, expires_in }

POST /api/cli/device/token
  Body: { device_code }
  Response: { access_token, token_type, expires_in } | { error: "authorization_pending" }

// Token exchange (for browser callback flow)
POST /api/cli/token
  Body: { code, code_verifier }
  Response: { access_token, refresh_token, expires_in }

// Token refresh
POST /api/cli/token/refresh
  Body: { refresh_token }
  Response: { access_token, expires_in }

// Validate token
GET /api/cli/whoami
  Headers: Authorization: Bearer <token>
  Response: { user: { id, email, name }, snippets_count, plan }
```

### API Token Management (Web App)

```typescript
// New table: api_tokens

CREATE TABLE api_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- User-friendly name
    token_hash TEXT NOT NULL,              -- bcrypt hash of token
    last_four TEXT NOT NULL,               -- Last 4 chars for display
    scopes TEXT[] DEFAULT ['read'],        -- read, write, delete
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

// Endpoints for web app
GET    /api/settings/tokens           -- List user's tokens
POST   /api/settings/tokens           -- Create new token
DELETE /api/settings/tokens/:id       -- Revoke token
```

---

## Project Structure

```
packages/cli/
├── Cargo.toml                 # Rust package manifest
├── src/
│   ├── main.rs                # Entry point
│   ├── cli.rs                 # Command definitions (clap)
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── login.rs
│   │   ├── list.rs
│   │   ├── search.rs
│   │   ├── show.rs
│   │   ├── copy.rs
│   │   ├── export.rs
│   │   ├── create.rs
│   │   ├── edit.rs
│   │   ├── delete.rs
│   │   ├── sync.rs
│   │   └── config.rs
│   ├── api/
│   │   ├── mod.rs
│   │   ├── client.rs          # HTTP client wrapper
│   │   ├── auth.rs            # Authentication flows
│   │   └── types.rs           # API response types
│   ├── cache/
│   │   ├── mod.rs
│   │   ├── sqlite.rs          # SQLite cache implementation
│   │   └── manager.rs         # Cache invalidation logic
│   ├── config/
│   │   ├── mod.rs
│   │   └── loader.rs          # Config file parsing
│   ├── output/
│   │   ├── mod.rs
│   │   ├── text.rs            # Human-readable output
│   │   ├── json.rs            # JSON output
│   │   └── highlight.rs       # Syntax highlighting
│   ├── utils/
│   │   ├── mod.rs
│   │   ├── variables.rs       # Variable substitution
│   │   ├── clipboard.rs       # Clipboard operations
│   │   └── fuzzy.rs           # Fuzzy matching for snippet lookup
│   └── error.rs               # Error types
├── tests/
│   ├── integration/
│   └── fixtures/
└── README.md
```

---

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

**Goal**: Basic CLI with authentication and read operations

- [ ] Project setup with Cargo
- [ ] Command-line argument parsing with clap
- [ ] Configuration file management
- [ ] API client with error handling
- [ ] Token-based authentication (`sv login --token`)
- [ ] `sv whoami` command
- [ ] `sv list` command (basic)
- [ ] `sv show` command (basic)
- [ ] Text output formatting

**Deliverable**: CLI that can authenticate and list/show snippets

### Phase 2: Core Features (Week 3-4)

**Goal**: Full read operations with caching

- [ ] `sv search` command
- [ ] `sv copy` command with clipboard integration
- [ ] `sv export` command
- [ ] Variable substitution engine
- [ ] SQLite cache implementation
- [ ] Syntax highlighting for code output
- [ ] JSON/YAML output formats
- [ ] Fuzzy matching for snippet lookup

**Deliverable**: Fully functional read-only CLI

### Phase 3: Write Operations (Week 5-6)

**Goal**: Create and modify snippets

- [ ] `sv create` command (from files)
- [ ] `sv create` from stdin
- [ ] `sv edit` command (open in editor)
- [ ] `sv delete` command
- [ ] Interactive mode for create
- [ ] File glob support

**Deliverable**: Full CRUD operations

### Phase 4: Advanced Features (Week 7-8)

**Goal**: Sync, advanced auth, polish

- [ ] Browser-based login flow
- [ ] Device authorization flow
- [ ] `sv sync` command
- [ ] Cache management commands
- [ ] Offline mode improvements
- [ ] Shell completions (bash, zsh, fish)
- [ ] Man page generation

**Deliverable**: Production-ready CLI

### Phase 5: Distribution (Week 9)

**Goal**: Release and distribution

- [ ] Cross-compilation for all platforms
- [ ] Homebrew formula
- [ ] APT/YUM packages
- [ ] Windows installer (MSI/Chocolatey)
- [ ] GitHub releases with binaries
- [ ] Installation documentation

**Deliverable**: Publicly available CLI

---

## Error Handling

### Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum SvError {
    #[error("Authentication required. Run `sv login` first.")]
    NotAuthenticated,

    #[error("Snippet not found: {0}")]
    SnippetNotFound(String),

    #[error("API error: {status} - {message}")]
    ApiError { status: u16, message: String },

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Invalid input: {0}")]
    ValidationError(String),

    #[error("File system error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Rate limited. Retry after {retry_after} seconds.")]
    RateLimited { retry_after: u64 },
}
```

### Error Output

```bash
# User-friendly errors
$ sv show nonexistent
Error: Snippet not found: nonexistent

Did you mean one of these?
  - my-nonexistent-test
  - nonexistent-backup

Run `sv search nonexistent` to search all snippets.

# Verbose mode for debugging
$ sv show nonexistent -vvv
DEBUG: Loading config from ~/.config/sv/config.toml
DEBUG: Cache lookup for slug: nonexistent
DEBUG: Cache miss, fetching from API
DEBUG: GET https://api.snippetvault.app/api/snippets?slug=nonexistent
DEBUG: Response: 404 Not Found
Error: Snippet not found: nonexistent
```

---

## Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_variable_substitution() {
        let content = "Hello {{name}}, your age is {{age}}";
        let vars = vec![
            ("name", "Jose"),
            ("age", "30"),
        ];
        let result = substitute_variables(content, &vars);
        assert_eq!(result, "Hello Jose, your age is 30");
    }

    #[test]
    fn test_fuzzy_match() {
        let snippets = vec!["docker-compose", "dockerfile", "docker-nginx"];
        let matches = fuzzy_match("docker", &snippets);
        assert_eq!(matches[0], "docker-compose");
    }
}
```

### Integration Tests

```rust
#[tokio::test]
async fn test_list_snippets() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/api/snippets"))
        .respond_with(ResponseTemplate::new(200)
            .set_body_json(json!({
                "snippets": [{"id": "1", "title": "Test"}],
                "total": 1
            })))
        .mount(&mock_server)
        .await;

    let config = Config::with_api_url(mock_server.uri());
    let result = list_snippets(&config, &ListOptions::default()).await;

    assert!(result.is_ok());
    assert_eq!(result.unwrap().snippets.len(), 1);
}
```

### End-to-End Tests

```bash
#!/bin/bash
# tests/e2e/test_basic_flow.sh

set -e

# Setup
export SV_TOKEN="test-token"

# Test list
sv list --limit 1 -o json | jq -e '.snippets | length > 0'

# Test show
sv show $(sv list -o json | jq -r '.snippets[0].slug') | grep -q "."

# Test copy
sv copy $(sv list -o json | jq -r '.snippets[0].slug') --no-substitute
# Verify clipboard has content

echo "All E2E tests passed!"
```

---

## Distribution

### Homebrew (macOS/Linux)

```ruby
# Formula/sv.rb
class Sv < Formula
  desc "CLI for SnippetVault - manage your code snippets"
  homepage "https://snippetvault.app"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/snippetvault/cli/releases/download/v1.0.0/sv-aarch64-apple-darwin.tar.gz"
      sha256 "..."
    else
      url "https://github.com/snippetvault/cli/releases/download/v1.0.0/sv-x86_64-apple-darwin.tar.gz"
      sha256 "..."
    end
  end

  on_linux do
    url "https://github.com/snippetvault/cli/releases/download/v1.0.0/sv-x86_64-unknown-linux-gnu.tar.gz"
    sha256 "..."
  end

  def install
    bin.install "sv"
    # Install shell completions
    bash_completion.install "completions/sv.bash"
    zsh_completion.install "completions/_sv"
    fish_completion.install "completions/sv.fish"
  end

  test do
    assert_match "sv #{version}", shell_output("#{bin}/sv --version")
  end
end
```

### npm/npx Wrapper (Optional)

```bash
# For those who prefer npm
npx @snippetvault/cli list
```

### Direct Download

```bash
# One-liner install
curl -fsSL https://snippetvault.app/install.sh | sh

# Or with specific version
curl -fsSL https://snippetvault.app/install.sh | sh -s -- --version 1.0.0
```

---

## Future Enhancements

### Version 1.1

- [ ] `sv diff <snippet1> <snippet2>` - Compare snippets
- [ ] `sv history <snippet>` - Show edit history (requires versioning feature)
- [ ] `sv fork <public-snippet>` - Fork a public snippet
- [ ] `sv share <snippet>` - Generate share link

### Version 1.2

- [ ] `sv run <snippet>` - Execute code snippets (sandboxed)
- [ ] `sv template` - Manage personal templates
- [ ] `sv alias` - Create command aliases
- [ ] Plugin system for custom commands

### Version 2.0

- [ ] TUI mode (`sv --tui`) - Full terminal UI
- [ ] Real-time sync with filesystem watcher
- [ ] Team/organization support
- [ ] Offline-first with conflict resolution

---

## Metrics & Analytics

### Telemetry (Opt-in)

```toml
# ~/.config/sv/config.toml
[telemetry]
enabled = false  # Opt-in only
```

**Collected (if enabled)**:
- Command usage frequency
- Error rates
- Cache hit ratios
- Response times

**Never collected**:
- Snippet content
- API tokens
- Personal information

---

## Appendix

### A. Competitor Analysis

| Feature | sv (proposed) | gh gist | snippets.io | Gisto |
|---------|---------------|---------|-------------|-------|
| Multi-file | Yes | Yes | No | Yes |
| Variables | Yes | No | No | No |
| Local cache | Yes | No | No | Yes |
| Offline mode | Yes | No | No | Yes |
| Sync | Yes | No | No | Yes |
| Tags | Yes | No | Yes | No |

### B. Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| `sv list` (cached) | < 50ms | SQLite cache |
| `sv list` (uncached) | < 500ms | HTTP/2, compression |
| `sv copy` | < 100ms | Clipboard API |
| `sv search` (local) | < 200ms | SQLite FTS5 |
| Startup time | < 50ms | Static binary |

### C. Accessibility

- All output supports `--no-color` for screen readers
- JSON output for programmatic access
- Verbose error messages with suggestions
- Shell completions for discoverability

---

## References

- [Clap Documentation](https://docs.rs/clap)
- [GitHub CLI (gh) - Reference Implementation](https://github.com/cli/cli)
- [OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
