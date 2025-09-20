import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth.ts";
import { building } from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }
  return svelteKitHandler({ event, resolve, auth, building });
};
