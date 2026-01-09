import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@snippetvault/db/schema'
import { eq } from 'drizzle-orm'

// Re-export schema for convenience
export { schema }

type TestDb = PostgresJsDatabase<typeof schema>

/**
 * Test user data
 */
export interface TestUser {
  id: string
  name: string
  email: string
  username: string
  sessionToken: string
  sessionId: string
}

/**
 * Create a test user with a session.
 * Returns user data and session token for authenticated requests.
 */
export async function createTestUser(
  db: TestDb,
  overrides: Partial<{ name: string; email: string; username: string }> = {}
): Promise<TestUser> {
  const userId = nanoid()
  const sessionId = nanoid()
  const sessionToken = `test-token-${nanoid()}`
  // Generate username-safe ID: remove dashes (nanoid can include - which is invalid for usernames)
  const username = overrides.username ?? `testuser_${nanoid().slice(0, 8).toLowerCase().replace(/-/g, '')}`

  const userData = {
    id: userId,
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `test-${nanoid()}@example.com`,
    username,
    emailVerified: false,
  }

  // Create user
  await db.insert(schema.users).values(userData)

  // Create session (expires in 7 days)
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    token: sessionToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return {
    id: userId,
    name: userData.name,
    email: userData.email,
    username: userData.username,
    sessionToken,
    sessionId,
  }
}

/**
 * Create a test tag for a user.
 */
export async function createTestTag(
  db: TestDb,
  userId: string,
  overrides: Partial<{ name: string; color: string }> = {}
): Promise<typeof schema.tags.$inferSelect> {
  const tagId = nanoid()

  const [tag] = await db
    .insert(schema.tags)
    .values({
      id: tagId,
      userId,
      name: overrides.name ?? `tag-${nanoid().slice(0, 6)}`,
      color: overrides.color ?? '#3b82f6',
    })
    .returning()

  return tag
}

/**
 * Create a test snippet with optional files and variables.
 */
export async function createTestSnippet(
  db: TestDb,
  userId: string,
  overrides: Partial<{
    title: string
    description: string
    language: string
    isFavorite: boolean
    isPublic: boolean
    files: Array<{ filename: string; content: string; language: string }>
    variables: Array<{ name: string; defaultValue: string; description?: string }>
    tagIds: string[]
  }> = {}
): Promise<typeof schema.snippets.$inferSelect> {
  const snippetId = nanoid()

  const [snippet] = await db
    .insert(schema.snippets)
    .values({
      id: snippetId,
      userId,
      title: overrides.title ?? `Test Snippet ${nanoid().slice(0, 6)}`,
      description: overrides.description ?? 'A test snippet',
      language: overrides.language ?? 'typescript',
      isFavorite: overrides.isFavorite ?? false,
      isPublic: overrides.isPublic ?? false,
    })
    .returning()

  // Create files if provided
  if (overrides.files && overrides.files.length > 0) {
    await db.insert(schema.files).values(
      overrides.files.map((file, index) => ({
        id: nanoid(),
        snippetId,
        filename: file.filename,
        content: file.content,
        language: file.language,
        order: index,
      }))
    )
  }

  // Create variables if provided
  if (overrides.variables && overrides.variables.length > 0) {
    await db.insert(schema.variables).values(
      overrides.variables.map((variable, index) => ({
        id: nanoid(),
        snippetId,
        name: variable.name,
        defaultValue: variable.defaultValue,
        description: variable.description,
        order: index,
      }))
    )
  }

  // Associate tags if provided
  if (overrides.tagIds && overrides.tagIds.length > 0) {
    await db.insert(schema.snippetsTags).values(
      overrides.tagIds.map(tagId => ({
        snippetId,
        tagId,
      }))
    )
  }

  return snippet
}

/**
 * Create a mock auth middleware that uses the test session token.
 */
export function createMockAuthMiddleware(db: TestDb) {
  return async (c: { req: { raw: { headers: Headers } }; set: (key: string, value: string) => void; json: (data: unknown, status?: number) => Response }, next: () => Promise<void>) => {
    // Get token from Authorization header or cookie
    const authHeader = c.req.raw.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Look up session
    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.token, token),
      with: {
        user: true,
      },
    })

    if (!session || session.expiresAt < new Date()) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('userId', session.userId)
    c.set('sessionId', session.id)

    await next()
  }
}

/**
 * Make an authenticated request to the test app.
 */
export function makeAuthRequest(
  app: Hono,
  method: string,
  path: string,
  sessionToken: string,
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${sessionToken}`,
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  return app.request(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Helper to parse JSON response
 */
export async function parseResponse<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>
}
