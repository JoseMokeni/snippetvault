import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { app as apiRoutes } from './routes'

const app = new Hono()

// Logging
app.use('*', logger())

// CORS for development (Vite runs on different port)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/*', cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
}

// API routes
app.route('/api', apiRoutes)

// Serve static files (React build) in production
if (process.env.NODE_ENV === 'production') {
  // Serve static assets
  app.use('/*', serveStatic({ root: './public' }))

  // SPA fallback - serve index.html for client-side routing
  app.get('*', serveStatic({ path: './public/index.html' }))
}

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
