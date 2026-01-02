import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { clearTestData, getTestDb } from '../setup'
import { createTestApp } from '../app-factory'
import { createTestUser, createTestTag, createTestSnippet } from '../helpers'
import type { Hono } from 'hono'

describe('Tags API', () => {
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

  describe('GET /tags', () => {
    test('should return empty list when user has no tags', async () => {
      const res = await app.request('/tags', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tags).toEqual([])
    })

    test('should return user tags with snippet count', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'react' })
      await createTestSnippet(db, testUser.id, { tagIds: [tag.id] })
      await createTestSnippet(db, testUser.id, { tagIds: [tag.id] })

      const res = await app.request('/tags', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tags).toHaveLength(1)
      expect(data.tags[0].name).toBe('react')
      expect(data.tags[0].snippetCount).toBe(2)
    })

    test('should return tags sorted by name', async () => {
      const db = getTestDb()
      await createTestTag(db, testUser.id, { name: 'zsh' })
      await createTestTag(db, testUser.id, { name: 'bash' })
      await createTestTag(db, testUser.id, { name: 'python' })

      const res = await app.request('/tags', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tags).toHaveLength(3)
      expect(data.tags[0].name).toBe('bash')
      expect(data.tags[1].name).toBe('python')
      expect(data.tags[2].name).toBe('zsh')
    })

    test('should return 401 without auth', async () => {
      const res = await app.request('/tags')
      expect(res.status).toBe(401)
    })

    test('should not return other users tags', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'other@example.com' })
      await createTestTag(db, otherUser.id, { name: 'other-user-tag' })
      await createTestTag(db, testUser.id, { name: 'my-tag' })

      const res = await app.request('/tags', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tags).toHaveLength(1)
      expect(data.tags[0].name).toBe('my-tag')
    })
  })

  describe('POST /tags', () => {
    test('should create a tag', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'new-tag',
          color: '#ff5733',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.tag.name).toBe('new-tag')
      expect(data.tag.color).toBe('#ff5733')
      expect(data.tag.snippetCount).toBe(0)
    })

    test('should create tag without color', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'no-color-tag',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.tag.name).toBe('no-color-tag')
      expect(data.tag.color).toBeNull()
    })

    test('should fail with duplicate tag name', async () => {
      const db = getTestDb()
      await createTestTag(db, testUser.id, { name: 'existing-tag' })

      const res = await app.request('/tags', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'existing-tag',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Tag with this name already exists')
    })

    test('should fail with missing name', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: '#ff5733',
        }),
      })

      expect(res.status).toBe(400)
    })

    test('should fail with invalid color format', async () => {
      const res = await app.request('/tags', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'tag-with-bad-color',
          color: 'red', // Should be hex format
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /tags/:id', () => {
    test('should update tag name', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'old-name' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'new-name',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tag.name).toBe('new-name')
    })

    test('should update tag color', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { color: '#ff0000' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: '#00ff00',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tag.color).toBe('#00ff00')
    })

    test('should fail when renaming to existing tag name', async () => {
      const db = getTestDb()
      await createTestTag(db, testUser.id, { name: 'existing' })
      const tag = await createTestTag(db, testUser.id, { name: 'to-rename' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'existing',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Tag with this name already exists')
    })

    test('should return 404 for non-existent tag', async () => {
      const res = await app.request('/tags/non-existent', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'new-name' }),
      })

      expect(res.status).toBe(404)
    })

    test('should not update other users tags', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'other@example.com' })
      const tag = await createTestTag(db, otherUser.id, { name: 'other-tag' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'hijacked' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /tags/:id', () => {
    test('should delete tag', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'to-delete' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toBe('Tag deleted successfully')

      // Verify it's gone
      const listRes = await app.request('/tags', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })
      const listData = await listRes.json()
      expect(listData.tags).toHaveLength(0)
    })

    test('should remove tag associations when deleted', async () => {
      const db = getTestDb()
      const tag = await createTestTag(db, testUser.id, { name: 'to-delete' })
      const snippet = await createTestSnippet(db, testUser.id, { tagIds: [tag.id] })

      // Delete the tag
      await app.request(`/tags/${tag.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      // Snippet should still exist but without the tag
      const snippetRes = await app.request(`/snippets/${snippet.id}`, {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })
      expect(snippetRes.status).toBe(200)
      const snippetData = await snippetRes.json()
      expect(snippetData.snippet.tags).toHaveLength(0)
    })

    test('should return 404 for non-existent tag', async () => {
      const res = await app.request('/tags/non-existent', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })

    test('should not delete other users tags', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, { email: 'other@example.com' })
      const tag = await createTestTag(db, otherUser.id, { name: 'other-tag' })

      const res = await app.request(`/tags/${tag.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(404)
    })
  })
})
