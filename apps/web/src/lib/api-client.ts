import { hc } from 'hono/client'
import type { AppType } from '@snippetvault/api/src/routes'

export const api = hc<AppType>('/api', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include', // Include cookies for auth
    }),
})
