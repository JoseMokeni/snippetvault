import { createMiddleware } from 'hono/factory'
import { auth } from '../lib/auth'

type AuthVariables = {
  userId: string
  sessionId: string
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('userId', session.user.id)
  c.set('sessionId', session.session.id)

  await next()
})
