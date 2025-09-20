import { createAuthClient } from "better-auth/client";
import type { auth } from "./auth.ts";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem("bearer_token") || "",
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
  },
});
