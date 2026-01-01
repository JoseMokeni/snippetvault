# SnippetVault - Landing Page Design

## Overview

A distinctive, developer-focused landing page that immediately demonstrates SnippetVault's value: managing multi-file code snippets with variable templating. The design prioritizes showing the product over describing it.

---

## Aesthetic Direction: Terminal Brutalism

**Core Concept:** Raw, honest, code-first. The interface feels like an extension of the developer's terminal—no fluff, pure functionality with unexpected visual moments.

**Key Characteristics:**
- Monospace typography dominance
- High contrast with selective color accents
- ASCII-inspired decorative elements
- Code blocks as primary visual elements
- Brutalist grid with intentional breaks

---

## Typography

### Font Stack

```css
--font-display: 'Berkeley Mono', 'JetBrains Mono', monospace;
--font-body: 'IBM Plex Mono', 'Fira Code', monospace;
--font-accent: 'Space Mono', monospace;
```

**Fallback (Google Fonts):**
- Display: `JetBrains Mono` (700)
- Body: `IBM Plex Mono` (400, 500)
- Code: `Fira Code` (400)

### Type Scale

```css
--text-xs: 0.75rem;    /* 12px - labels */
--text-sm: 0.875rem;   /* 14px - body small */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.25rem;    /* 20px - lead */
--text-xl: 1.5rem;     /* 24px - h4 */
--text-2xl: 2rem;      /* 32px - h3 */
--text-3xl: 2.5rem;    /* 40px - h2 */
--text-4xl: 3.5rem;    /* 56px - h1 */
--text-5xl: 4.5rem;    /* 72px - hero */
```

---

## Color Palette

### Primary (Monochrome + Electric Accent)

```css
/* Backgrounds */
--bg-primary: #0a0a0a;      /* Near black */
--bg-secondary: #111111;    /* Slightly lighter */
--bg-elevated: #1a1a1a;     /* Cards, modals */
--bg-code: #0d1117;         /* Code blocks (GitHub dark) */

/* Text */
--text-primary: #e6edf3;    /* High contrast white */
--text-secondary: #7d8590;  /* Muted gray */
--text-tertiary: #484f58;   /* Very muted */

/* Accent - Electric Green (Terminal vibe) */
--accent-primary: #00ff9f;  /* Main accent */
--accent-hover: #00cc7f;    /* Hover state */
--accent-muted: #00ff9f1a;  /* 10% opacity backgrounds */

/* Secondary Accent - Warm Orange (for warnings, highlights) */
--accent-secondary: #ff6b35;
--accent-secondary-muted: #ff6b351a;

/* Syntax Highlighting Colors */
--syntax-keyword: #ff7b72;
--syntax-string: #a5d6ff;
--syntax-function: #d2a8ff;
--syntax-variable: #ffa657;
--syntax-comment: #8b949e;

/* Borders */
--border-primary: #30363d;
--border-muted: #21262d;

/* States */
--success: #00ff9f;
--error: #f85149;
--warning: #d29922;
```

---

## Page Structure (Streamlined)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Navigation (Sticky, Minimal)                             │
├─────────────────────────────────────────────────────────────┤
│ 2. Hero (Product Demo + Value Prop)                         │
├─────────────────────────────────────────────────────────────┤
│ 3. Before/After Comparison                                  │
├─────────────────────────────────────────────────────────────┤
│ 4. Core Features (3 Max, Visual)                            │
├─────────────────────────────────────────────────────────────┤
│ 5. Use Cases (Horizontal Scroll)                            │
├─────────────────────────────────────────────────────────────┤
│ 6. Final CTA                                                │
├─────────────────────────────────────────────────────────────┤
│ 7. Footer (Minimal)                                         │
└─────────────────────────────────────────────────────────────┘
```

**7 sections total** (reduced from 11)

---

## Detailed Sections

### 1. Navigation Bar

```
┌──────────────────────────────────────────────────────────────┐
│  > SnippetVault_              Features   Docs    [Get Started]│
└──────────────────────────────────────────────────────────────┘
```

**Design:**
- Terminal-style logo with underscore cursor
- Minimal links (Features, Docs only)
- Single CTA button (accent color)
- Sticky on scroll with subtle backdrop blur
- Border-bottom on scroll

**Code:**
```tsx
<nav className="fixed top-0 w-full z-50 border-b border-transparent
                data-[scrolled=true]:border-border-primary
                data-[scrolled=true]:bg-bg-primary/80
                data-[scrolled=true]:backdrop-blur-md">
  <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <span className="font-display text-lg">
      <span className="text-accent-primary">{">"}</span> SnippetVault
      <span className="animate-blink">_</span>
    </span>

    <div className="flex items-center gap-8">
      <a href="#features" className="text-text-secondary hover:text-text-primary">Features</a>
      <a href="/docs" className="text-text-secondary hover:text-text-primary">Docs</a>
      <a href="/signup" className="bg-accent-primary text-bg-primary px-4 py-2 font-medium
                                   hover:bg-accent-hover transition-colors">
        Get Started
      </a>
    </div>
  </div>
</nav>
```

---

### 2. Hero Section

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ ASCII Art Logo ─────────────────────────────────────────────┐   │
│  │   ___       _                 _ _   __                  _ _   │   │
│  │  / __|_ _ (_)_ __ _ __  ___| |_\ \/ /__ _ _  _| | |_   │   │
│  │  \__ \ ' \| | '_ \ '_ \/ -_)  _|>  </ _` | || | |  _|  │   │
│  │  |___/_||_|_| .__/ .__/\___|\__/_/\_\__,_|\_,_|_|\__|  │   │
│  │             |_|  |_|                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│           Your code deserves a second life.                          │
│                                                                      │
│     Multi-file snippets. Variable templating. One-click export.      │
│                                                                      │
│              [Get Started Free]    [View on GitHub]                  │
│                                                                      │
│  ┌─ demo.tsx ─────────────────────────────────────────────────────┐ │
│  │  1 │ // Your snippet with variables                            │ │
│  │  2 │ FROM node:{{NODE_VERSION}}-alpine                         │ │
│  │  3 │ WORKDIR /app/{{PROJECT_NAME}}                             │ │
│  │  4 │ EXPOSE {{PORT}}                                           │ │
│  │────┼───────────────────────────────────────────────────────────│ │
│  │  Variables:                                                     │ │
│  │  NODE_VERSION = [20        ]                                   │ │
│  │  PROJECT_NAME = [my-app    ]                                   │ │
│  │  PORT         = [3000      ]                                   │ │
│  │                                                                 │ │
│  │  [Copy Result]  [Download ZIP]                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Copy:**
- Tagline: "Your code deserves a second life."
- Subline: "Multi-file snippets. Variable templating. One-click export."

**Design Elements:**
- ASCII art logo (optional, impactful)
- Static code demo showing variables in action
- Real syntax highlighting
- Variable inputs that show the concept (static for MVP)
- Terminal-style code block with line numbers

**Background:**
- Subtle dot grid pattern
- No gradients
- Optional: faint green glow behind code block

---

### 3. Before/After Comparison

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    The old way vs. the SnippetVault way              │
│                                                                      │
│  ┌─ Before ─────────────────────┐  ┌─ After ──────────────────────┐ │
│  │                              │  │                               │ │
│  │  ❌ Scattered gists          │  │  ✓ One organized library     │ │
│  │  ❌ Single file only         │  │  ✓ Full folder structures    │ │
│  │  ❌ Manual find & replace    │  │  ✓ {{VARIABLE}} templating   │ │
│  │  ❌ Copy file by file        │  │  ✓ Export as ZIP instantly   │ │
│  │                              │  │                               │ │
│  │  # Every. Single. Time.      │  │  # Once. Forever.            │ │
│  │  sed 's/old-name/new/g'      │  │  [Download ZIP]              │ │
│  │  mv file1.js newproject/     │  │                               │ │
│  │  mv file2.js newproject/     │  │                               │ │
│  │  mv file3.js newproject/     │  │                               │ │
│  │  ...                         │  │                               │ │
│  │                              │  │                               │ │
│  └──────────────────────────────┘  └───────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Design:**
- Two-column layout
- Left side: dimmed, showing frustration
- Right side: accent border, showing solution
- Terminal-style commands on left
- Clean result on right
- Strong visual contrast

---

### 4. Core Features (3 Only)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ 01 ──────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  MULTI-FILE SNIPPETS                                          │  │
│  │                                                                │  │
│  │  Not just code. Entire project structures.                    │  │
│  │                                                                │  │
│  │  📁 docker-setup/                                              │  │
│  │    ├── 📄 Dockerfile                                          │  │
│  │    ├── 📄 docker-compose.yml                                  │  │
│  │    ├── 📄 .dockerignore                                       │  │
│  │    └── 📁 nginx/                                               │  │
│  │        └── 📄 nginx.conf                                      │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ 02 ──────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  VARIABLE TEMPLATING                                          │  │
│  │                                                                │  │
│  │  Write once. Customize infinitely.                            │  │
│  │                                                                │  │
│  │  FROM node:{{NODE_VERSION}}-alpine     →    FROM node:20-alpine│  │
│  │  WORKDIR /{{PROJECT_NAME}}             →    WORKDIR /my-api   │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ 03 ──────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ONE-CLICK EXPORT                                             │  │
│  │                                                                │  │
│  │  Copy all. Download ZIP. Full folder structure preserved.     │  │
│  │                                                                │  │
│  │  [📋 Copy All]    [📦 Download .zip]    [📄 Copy Single]      │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Design:**
- Vertical stack, not grid
- Large feature numbers (01, 02, 03)
- Each feature has a visual demonstration
- Monospace headings, sentence-case descriptions
- Accent color on feature numbers

---

### 5. Use Cases (Horizontal Scroll on Mobile)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Perfect for...                                                      │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ 🐳         │ │ ⚛️         │ │ 🔧         │ │ 🚀         │       │
│  │ Docker     │ │ React      │ │ Configs    │ │ API        │       │
│  │ Setups     │ │ Components │ │            │ │ Boilerplates│       │
│  │            │ │            │ │ ESLint     │ │            │       │
│  │ Dockerfile │ │ Component  │ │ Prettier   │ │ Routes     │       │
│  │ Compose    │ │ Tests      │ │ TypeScript │ │ Middleware │       │
│  │ Nginx      │ │ Stories    │ │ Tailwind   │ │ Types      │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                      │
│  ◄─────────────────── scroll ───────────────────►                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Design:**
- Horizontal scroll on mobile (snap points)
- 4 cards visible on desktop
- Each card shows:
  - Icon
  - Category name
  - 3-4 example files
- Hover: subtle lift + border glow

---

### 6. Final CTA

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │  $ npx create-snippet                                           ││
│  │                                                                 ││
│  │  Stop drowning in gists.                                        ││
│  │  Start building your snippet library.                           ││
│  │                                                                 ││
│  │                  [Get Started — It's Free]                      ││
│  │                                                                 ││
│  │  Free forever. No credit card. No catch.                        ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Design:**
- Terminal-style container
- Fake command prompt for fun
- Large, centered CTA button
- Reassurance text below
- Subtle border with accent glow

---

### 7. Footer

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  > SnippetVault_                                                     │
│                                                                      │
│  Built for developers who hate repeating themselves.                 │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  Product          Resources         Connect                          │
│  Features         Docs              GitHub                           │
│  Changelog        API               Twitter                          │
│                   Examples          Discord                          │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  © 2026 SnippetVault. MIT Licensed.                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Design:**
- Minimal, three-column links
- Terminal-style logo
- Tagline reinforces value
- MIT Licensed (if applicable)

---

## Animations & Interactions

### 1. Page Load
- Staggered fade-in for hero elements (150ms delays)
- Code block types in letter-by-letter (optional, can be static)
- ASCII logo draws line by line (optional enhancement)

### 2. Scroll Animations
- Sections fade up as they enter viewport (IntersectionObserver)
- Feature cards slide in from alternating sides
- Use cases cards stagger in

### 3. Micro-interactions
- Buttons: scale(1.02) + shadow on hover
- Code blocks: subtle glow on hover
- Links: underline slides in from left
- Copy button: checkmark animation on success

### 4. Cursor Effects (Optional)
- Custom cursor that changes over interactive elements
- Terminal-style block cursor on code areas

**Implementation:**
```tsx
// Use CSS for simple animations, Framer Motion for complex ones
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}
```

---

## Mobile Design (Mobile-First)

### Breakpoints
```css
--mobile: 0px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### Mobile (<768px)
- Single column everything
- Hamburger menu with slide-out panel
- Hero: stacked, code demo below tagline
- Features: vertical cards
- Use cases: horizontal scroll with snap
- Touch targets: minimum 44px
- Simplified animations (reduce motion preference respected)

### Tablet (768px - 1024px)
- Two-column for before/after
- Features remain vertical
- Navigation visible

### Desktop (>1024px)
- Full layout
- All animations enabled
- Max content width: 1200px

---

## Background & Texture

### Dot Grid Pattern
```css
.dot-grid {
  background-image: radial-gradient(circle, var(--border-muted) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Noise Overlay (Optional)
```css
.noise {
  background-image: url('/noise.png');
  opacity: 0.03;
  pointer-events: none;
}
```

### Glow Effects
```css
.glow-green {
  box-shadow: 0 0 60px var(--accent-muted);
}
```

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3s

**Optimizations:**
- Inline critical CSS
- Lazy load below-fold sections
- Preload fonts (JetBrains Mono, IBM Plex Mono)
- Use `font-display: swap`
- Optimize images (WebP, proper sizing)
- Code-split routes

---

## SEO

```html
<title>SnippetVault - Multi-File Code Snippets with Variable Templating</title>
<meta name="description" content="Save, organize, and reuse multi-file code snippets with intelligent variable templating. Export entire project structures in one click.">

<!-- Open Graph -->
<meta property="og:title" content="SnippetVault">
<meta property="og:description" content="Your code deserves a second life.">
<meta property="og:image" content="/og-image.png">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
```

---

## Conversion Strategy

### CTA Placements (3 only)
1. Navigation bar (persistent)
2. Hero section (primary)
3. Final CTA section

### Button Copy Variations (A/B Test)
- "Get Started" vs "Start Building"
- "Get Started Free" vs "Create Your Library"

### Analytics Events
```typescript
// Track these events
'cta_click' // which CTA, position
'demo_interaction' // future: when demo is interactive
'scroll_depth' // 25%, 50%, 75%, 100%
'time_on_page' // 30s, 60s, 120s
```

---

## Future Enhancements

### Phase 1: Interactive Demo (Post-MVP)
Once the app is built, embed a live read-only demo:
- Pre-populated with example snippets
- Users can click through files
- Change variable values
- Copy/download demo data
- "Create your own" CTA

**Implementation:**
```tsx
// Embed actual app components in read-only mode
<SnippetViewer
  snippet={demoSnippet}
  readOnly={true}
  onExport={() => trackEvent('demo_export')}
/>
```

### Phase 2: Animated Code Demo
- Code types itself with realistic timing
- Variables highlight and transform
- Export animation shows ZIP being created

### Phase 3: Personalization
- Detect visitor's tech stack from referrer/UTM
- Show relevant use case first (Docker for DevOps, React for frontend devs)

---

## Component Checklist

- [ ] Navigation with scroll detection
- [ ] Hero with static code demo
- [ ] Before/After comparison cards
- [ ] Feature cards (3)
- [ ] Use case cards with horizontal scroll
- [ ] Final CTA section
- [ ] Footer
- [ ] Mobile hamburger menu
- [ ] Blinking cursor animation
- [ ] Fade-up scroll animations
- [ ] Copy button with success state
- [ ] Dot grid background

---

## Assets Needed

1. **Fonts**: JetBrains Mono, IBM Plex Mono (Google Fonts)
2. **Icons**: Lucide React (folder, file, copy, download, check)
3. **OG Image**: 1200x630 with code snippet preview
4. **Favicon**: Terminal-style ">" icon
5. **Noise texture**: 200x200 PNG, very subtle grain

---

## Tech Stack

- **Framework**: React + Vite (or Next.js for SSR)
- **Styling**: Tailwind CSS with custom config
- **Animations**: CSS + Framer Motion for complex ones
- **Icons**: Lucide React
- **Fonts**: Google Fonts API
- **Analytics**: Plausible or PostHog

---

## Summary

This design prioritizes:
1. **Distinctiveness** over convention
2. **Showing** over telling
3. **Code-first** aesthetics
4. **Mobile-first** development
5. **Performance** from the start

The terminal brutalist aesthetic sets SnippetVault apart from generic SaaS landing pages while resonating with the developer audience.
