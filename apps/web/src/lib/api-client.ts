import { hc } from "hono/client";
import type { AppType } from "@snippetvault/api/src/routes";

export const api = hc<AppType>("/api", {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, {
      ...init,
      credentials: "include", // Include cookies for auth
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      window.location.href = "/login";
    }

    return response;
  },
});
