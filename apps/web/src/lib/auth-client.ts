import { createAuthClient } from 'better-auth/react'

// Use window.location.origin to work with both:
// - Development: Vite proxy forwards /api to the backend
// - Production: Frontend and API served from same origin
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})

export const { useSession, signIn, signUp, signOut } = authClient
