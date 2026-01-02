import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { authClient } from './lib/auth-client'
import './index.css'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Create router with context
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      isAuthenticated: false,
      user: null,
    },
  },
  defaultPreload: 'intent',
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// App component that provides auth context
function App() {
  const { data: session, isPending } = authClient.useSession()

  // Update router context with auth state
  const auth = {
    isAuthenticated: !!session?.user,
    user: session?.user ?? null,
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="font-display text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <RouterProvider
      router={router}
      context={{ queryClient, auth }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
