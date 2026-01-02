import { hc } from 'hono/client'
import type { AppType } from '../../../../api/src/routes'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = hc<AppType>(`${baseUrl}/api`, {
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: 'include', // Include cookies for auth
    }),
})
