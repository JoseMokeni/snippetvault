import { Hono } from 'hono'
import { authRoute } from './auth'

// Chain routes for proper type inference
export const app = new Hono()
  .get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    })
  })
  .route('/auth', authRoute)

// Export type for Hono RPC client
export type AppType = typeof app
