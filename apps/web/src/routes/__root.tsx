import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
  auth: {
    isAuthenticated: boolean;
    user: { id: string; name: string; email: string } | null;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const isNavigating = router.state.isLoading;

  return (
    <>
      <div
        className={`page-container ${isNavigating ? "page-transitioning" : ""}`}
      >
        <Outlet />
      </div>
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  );
}
