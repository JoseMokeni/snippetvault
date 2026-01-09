import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { clearTestData, getTestDb } from '../setup'
import { createTestApp } from '../app-factory'
import { createTestUser, createTestSnippet } from '../helpers'
import type { Hono } from 'hono'

describe('Stars API', () => {
  let app: Hono
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let otherUser: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    const db = getTestDb()
    app = createTestApp(db)
  })

  beforeEach(async () => {
    await clearTestData()
    const db = getTestDb()
    testUser = await createTestUser(db)
    otherUser = await createTestUser(db, { email: 'other@example.com', username: 'other_user' })
  })

  describe('GET /stars', () => {
    test('should return empty list when user has no starred snippets', async () => {
      const res = await app.request('/stars', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toEqual([])
    })

    test('should return starred snippets', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { title: 'Other User Snippet', isPublic: true })

      // Star the snippet
      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      const res = await app.request('/stars', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.snippets).toHaveLength(1)
      expect(data.snippets[0].title).toBe('Other User Snippet')
    })

    test('should return 401 without auth', async () => {
      const res = await app.request('/stars')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /stars/check/:snippetId', () => {
    test('should return false when not starred', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      const res = await app.request(`/stars/check/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.starred).toBe(false)
    })

    test('should return true when starred', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      // Star the snippet first
      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      const res = await app.request(`/stars/check/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.starred).toBe(true)
    })
  })

  describe('POST /stars/:snippetId', () => {
    test('should star a public snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.message).toBe('Starred successfully')
    })

    test('should increment star count', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Check the snippet's star count via explore
      const exploreRes = await app.request('/public/explore')
      const exploreData = await exploreRes.json()
      const starredSnippet = exploreData.snippets.find((s: { id: string }) => s.id === snippet.id)
      expect(starredSnippet.starCount).toBe(1)
    })

    test('should not star private snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: false })

      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })

    test('should not star own snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, testUser.id, { isPublic: true })

      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(400)
    })

    test('should not star same snippet twice', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      // Star once
      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Try to star again
      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(409)
    })
  })

  describe('DELETE /stars/:snippetId', () => {
    test('should unstar a snippet', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      // Star first
      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Unstar
      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toBe('Unstarred successfully')
    })

    test('should decrement star count', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      // Star then unstar
      await app.request(`/stars/${snippet.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })
      await app.request(`/stars/${snippet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Check the snippet's star count
      const exploreRes = await app.request('/public/explore')
      const exploreData = await exploreRes.json()
      const unstarredSnippet = exploreData.snippets.find((s: { id: string }) => s.id === snippet.id)
      expect(unstarredSnippet.starCount).toBe(0)
    })

    test('should return 404 when not starred', async () => {
      const db = getTestDb()
      const snippet = await createTestSnippet(db, otherUser.id, { isPublic: true })

      const res = await app.request(`/stars/${snippet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })
})
