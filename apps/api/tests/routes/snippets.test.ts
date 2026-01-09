import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { clearTestData, getTestDb } from '../setup'
import { createTestApp } from '../app-factory'
import { createTestUser, createTestSnippet, createTestTag } from '../helpers'
import type { Hono } from 'hono'

describe('Snippets API', () => {
  let app: Hono
  let testUser: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    // Database is already initialized by preload.ts
    const db = getTestDb()
    app = createTestApp(db)
  })

  beforeEach(async () => {
    await clearTestData()
    const db = getTestDb()
    testUser = await createTestUser(db)
  })

  describe('GET /snippets', () => {
    test('should return empty list when user has no snippets', async () => {
      const res = await app.request('/snippets', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toEqual([])
    })

    test('should return user snippets', async () => {
      const db = getTestDb()
      await createTestSnippet(db, testUser.id, { title: 'My Snippet' })

      const res = await app.request('/snippets', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toHaveLength(1)
      expect(data.snippets[0].title).toBe('My Snippet')
    })

    test('should filter by language', async () => {
      const db = getTestDb()
      await createTestSnippet(db, testUser.id, { title: 'TS Snippet', language: 'typescript' })
      await createTestSnippet(db, testUser.id, { title: 'Python Snippet', language: 'python' })

      const res = await app.request('/snippets?language=typescript', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toHaveLength(1)
      expect(data.snippets[0].title).toBe('TS Snippet')
    })

    test('should filter by favorite', async () => {
      const db = getTestDb()
      await createTestSnippet(db, testUser.id, { title: 'Regular', isFavorite: false })
      await createTestSnippet(db, testUser.id, { title: 'Favorite', isFavorite: true })

      const res = await app.request('/snippets?favorite=true', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toHaveLength(1)
      expect(data.snippets[0].title).toBe('Favorite')
    })

    test('should search by title', async () => {
      const db = getTestDb()
      await createTestSnippet(db, testUser.id, { title: 'React Hook Example' })
      await createTestSnippet(db, testUser.id, { title: 'Docker Setup' })

      const res = await app.request('/snippets?search=React', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toHaveLength(1)
      expect(data.snippets[0].title).toBe('React Hook Example')
    })

    test('should return 401 without auth', async () => {
      const res = await app.request('/snippets')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /snippets/:id', () => {
    test('should return snippet with files, variables, and tags', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'react' })
      const snippet = await createTestSnippet(db, testUser.id, {
        title: 'Full Snippet',
        files: [{ filename: 'index.ts', content: 'console.log("hi")', language: 'typescript' }],
        variables: [{ name: 'APP_NAME', defaultValue: 'MyApp' }],
        tagIds: [tag.id],
      })

      const res = await app.request(`/snippets/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippet.title).toBe('Full Snippet')
      expect(data.snippet.files).toHaveLength(1)
      expect(data.snippet.files[0].filename).toBe('index.ts')
      expect(data.snippet.variables).toHaveLength(1)
      expect(data.snippet.variables[0].name).toBe('APP_NAME')
      expect(data.snippet.tags).toHaveLength(1)
      expect(data.snippet.tags[0].name).toBe('react')
    })

    test('should return 404 for non-existent snippet', async () => {
      const res = await app.request('/snippets/non-existent-id', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })

    test('should not return other users snippets', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'other@example.com' })
      const snippet = await createTestSnippet(db, otherUser.id, { title: 'Other User Snippet' })

      const res = await app.request(`/snippets/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /snippets', () => {
    test('should create a snippet', async () => {
      const res = await app.request('/snippets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Snippet',
          description: 'A test snippet',
          language: 'javascript',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.snippet.title).toBe('New Snippet')
      expect(data.snippet.description).toBe('A test snippet')
      expect(data.snippet.language).toBe('javascript')
    })

    test('should create snippet with files and variables', async () => {
      const res = await app.request('/snippets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Complex Snippet',
          language: 'typescript',
          files: [
            { filename: 'main.ts', content: 'const x = 1', language: 'typescript' },
            { filename: 'util.ts', content: 'export const y = 2', language: 'typescript' },
          ],
          variables: [
            { name: 'API_KEY', defaultValue: 'xxx', description: 'The API key' },
          ],
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.snippet.files).toHaveLength(2)
      expect(data.snippet.variables).toHaveLength(1)
    })

    test('should create snippet with tags', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'docker' })

      const res = await app.request('/snippets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Docker Snippet',
          language: 'dockerfile',
          tagIds: [tag.id],
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.snippet.tags).toHaveLength(1)
      expect(data.snippet.tags[0].name).toBe('docker')
    })

    test('should fail with missing required fields', async () => {
      const res = await app.request('/snippets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Missing title and language',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /snippets/:id', () => {
    test('should update snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, { title: 'Original Title' })

      const res = await app.request(`/snippets/${snippet.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippet.title).toBe('Updated Title')
    })

    test('should return 404 for non-existent snippet', async () => {
      const res = await app.request('/snippets/non-existent', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Title' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /snippets/:id', () => {
    test('should delete snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id)

      const res = await app.request(`/snippets/${snippet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)

      // Verify it's gone
      const getRes = await app.request(`/snippets/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })
      expect(getRes.status).toBe(404)
    })

    test('should return 404 for non-existent snippet', async () => {
      const res = await app.request('/snippets/non-existent', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /snippets/:id/favorite', () => {
    test('should toggle favorite to true', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, { isFavorite: false })

      const res = await app.request(`/snippets/${snippet.id}/favorite`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippet.isFavorite).toBe(true)
    })

    test('should toggle favorite to false', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, { isFavorite: true })

      const res = await app.request(`/snippets/${snippet.id}/favorite`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippet.isFavorite).toBe(false)
    })
  })

  describe('POST /snippets/:id/duplicate', () => {
    test('should duplicate snippet with files and variables', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, {
        title: 'Original',
        files: [{ filename: 'index.ts', content: 'code', language: 'typescript' }],
        variables: [{ name: 'VAR', defaultValue: 'value' }],
      })

      const res = await app.request(`/snippets/${snippet.id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.snippet.title).toBe('Original (Copy)')
      expect(data.snippet.id).not.toBe(snippet.id)
      expect(data.snippet.files).toHaveLength(1)
      expect(data.snippet.variables).toHaveLength(1)
      expect(data.snippet.isFavorite).toBe(false)
      expect(data.snippet.isPublic).toBe(false)
    })

    test('should return 404 for non-existent snippet', async () => {
      const res = await app.request('/snippets/non-existent/duplicate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /snippets/:id/fork', () => {
    test('should fork a public snippet from another user', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'other@example.com', username: 'other_user' })
      const snippet = await createTestSnippet(db, otherUser.id, {
        title: 'Original Public',
        isPublic: true,
        files: [{ filename: 'index.ts', content: 'code', language: 'typescript' }],
        variables: [{ name: 'VAR', defaultValue: 'value' }],
      })

      const res = await app.request(`/snippets/${snippet.id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.snippet.title).toBe('Original Public') // Same title if no conflict
      expect(data.snippet.id).not.toBe(snippet.id)
      expect(data.snippet.files).toHaveLength(1)
      expect(data.snippet.variables).toHaveLength(1)
      expect(data.snippet.isPublic).toBe(false) // Forks are private by default
      expect(data.snippet.forkedFromId).toBe(snippet.id)
    })

    test('should increment fork count on original', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'fork_count@example.com', username: 'fork_count_user' })
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      await app.request(`/snippets/${snippet.id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Check fork count via explore
      const exploreRes = await app.request('/public/explore')
      const exploreData = await exploreRes.json()
      const originalSnippet = exploreData.snippets.find((s: { id: string }) => s.id === snippet.id)
      expect(originalSnippet.forkCount).toBe(1)
    })

    test('should not fork private snippet', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'private@example.com', username: 'private_user' })
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: false })

      const res = await app.request(`/snippets/${snippet.id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })

    test('should not fork own snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, { isPublic: true })

      const res = await app.request(`/snippets/${snippet.id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(400)
    })

    test('should return 404 for non-existent snippet', async () => {
      const res = await app.request('/snippets/non-existent/fork', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })
})
