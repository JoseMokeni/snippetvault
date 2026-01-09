import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { clearTestData, getTestDb } from '../setup'
import { createTestApp } from '../app-factory'
import { createTestUser } from '../helpers'
import type { Hono } from 'hono'

describe('Users API', () => {
  let app: Hono
  let testUser: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    const db = getTestDb()
    app = createTestApp(db)
  })

  beforeEach(async () => {
    await clearTestData()
    const db = getTestDb()
    testUser = await createTestUser(db)
  })

  describe('GET /users/me', () => {
    test('should return current user profile', async () => {
      const res = await app.request('/users/me', {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user.id).toBe(testUser.id)
      expect(data.user.name).toBe(testUser.name)
      expect(data.user.email).toBe(testUser.email)
      expect(data.user.username).toBe(testUser.username)
    })

    test('should return 401 without auth', async () => {
      const res = await app.request('/users/me')
      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /users/username', () => {
    test('should update username', async () => {
      const res = await app.request('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'new_username' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user.username).toBe('new_username')
    })

    test('should reject invalid username format', async () => {
      const res = await app.request('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'INVALID-Username!' }),
      })

      expect(res.status).toBe(400)
    })

    test('should reject username too short', async () => {
      const res = await app.request('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'ab' }),
      })

      expect(res.status).toBe(400)
    })

    test('should reject duplicate username', async () => {
      const db = getTestDb()
      const otherUser = await createTestUser(db, {
        email: 'other@example.com',
        username: 'taken_username'
      })

      const res = await app.request('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: otherUser.username }),
      })

      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toBe('Username is already taken')
    })

    test('should allow keeping same username', async () => {
      const res = await app.request('/users/username', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: testUser.username }),
      })

      expect(res.status).toBe(200)
    })
  })
})
