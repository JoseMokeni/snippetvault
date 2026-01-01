# Claude Code Configuration

Read and follow all directives in AGENTS.md.

## Additional Claude-Specific Instructions

- When implementing features, follow the phased approach in `IMPLEMENTATION_PLAN.md`
- Test each endpoint with curl immediately after implementation
- Commit after each working feature with descriptive messages
- Use Context7 MCP to look up Hono, Better Auth, Drizzle, and TanStack documentation when needed

## Skills Usage

Use the following skills when appropriate:

### /frontend-design
Use this skill when:
- Creating new UI components (cards, modals, forms)
- Building pages and layouts
- Implementing responsive designs
- Styling with Tailwind CSS
- Working on any visual/UI task

### /feature-dev
Use this skill when:
- Implementing new features end-to-end
- Building API endpoints with their corresponding frontend
- Complex multi-file changes
- Full-stack feature development

## MCP Tools

- **Context7**: Look up documentation for Hono, Better Auth, Drizzle, TanStack, shadcn/ui
