import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'

// Mock Better Auth
const mockAuthHandler = mock(async (req: Request) => {
  const url = new URL(req.url)
  const body = await req.json().catch(() => ({}))

  // Mock sign-up endpoint
  if (url.pathname.includes('/sign-up/email') && req.method === 'POST') {
    const { name, email, password } = body

    // Validation
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate duplicate email check
    if (email === 'existing@example.com') {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({
        token: 'mock-session-token-' + Date.now(),
        user: {
          id: 'mock-user-id-' + Date.now(),
          name,
          email,
          emailVerified: false,
          image: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Mock sign-in endpoint
  if (url.pathname.includes('/sign-in/email') && req.method === 'POST') {
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing credentials' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate user not found
    if (email === 'nonexistent@example.com') {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate wrong password
    if (password === 'WrongPassword123!') {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({
        token: 'mock-session-token-' + Date.now(),
        user: {
          id: 'mock-user-id-12345',
          name: 'Test User',
          email,
          emailVerified: false,
          image: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
})

// Create test app with mocked auth
const createTestApp = () => {
  const app = new Hono()
  const authRoute = new Hono().on(['POST', 'GET'], '/*', (c) =>
    mockAuthHandler(c.req.raw)
  )

  return app
    .get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))
    .route('/auth', authRoute)
}

describe('Authentication API', () => {
  let app: Hono

  beforeEach(() => {
    app = createTestApp()
    mockAuthHandler.mockClear()
  })

  describe('POST /auth/sign-up/email', () => {
    test('should register a new user successfully', async () => {
      const req = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.name).toBe('Test User')
      expect(data.user.emailVerified).toBe(false)
      expect(data.user).toHaveProperty('id')
      expect(mockAuthHandler).toHaveBeenCalledTimes(1)
    })

    test('should fail to register with duplicate email', async () => {
      const req = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'SecurePassword123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('User already exists')
    })

    test('should fail to register without required fields', async () => {
      const req = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Missing required fields')
    })

    test('should fail to register with invalid email', async () => {
      const req = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid email format')
    })
  })

  describe('POST /auth/sign-in/email', () => {
    test('should login with correct credentials', async () => {
      const req = new Request('http://localhost:3000/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
      expect(mockAuthHandler).toHaveBeenCalledTimes(1)
    })

    test('should fail to login with incorrect password', async () => {
      const req = new Request('http://localhost:3000/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid credentials')
    })

    test('should fail to login with non-existent email', async () => {
      const req = new Request('http://localhost:3000/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid credentials')
    })

    test('should fail to login without credentials', async () => {
      const req = new Request('http://localhost:3000/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Missing credentials')
    })
  })

  describe('Session Token Generation', () => {
    test('should generate unique tokens for registration', async () => {
      const req1 = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'User 1',
          email: 'user1@example.com',
          password: 'Password123!',
        }),
      })

      const req2 = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'User 2',
          email: 'user2@example.com',
          password: 'Password123!',
        }),
      })

      const res1 = await app.fetch(req1)
      const data1 = await res1.json()

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const res2 = await app.fetch(req2)
      const data2 = await res2.json()

      expect(data1.token).toBeTruthy()
      expect(data2.token).toBeTruthy()
      expect(data1.token).not.toBe(data2.token)
    })

    test('should return token as string with minimum length', async () => {
      const req = new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        }),
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(typeof data.token).toBe('string')
      expect(data.token.length).toBeGreaterThan(10)
    })
  })

  describe('Health Check', () => {
    test('should return health status', async () => {
      const req = new Request('http://localhost:3000/health')
      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.status).toBe('ok')
      expect(data).toHaveProperty('timestamp')
    })
  })
})
