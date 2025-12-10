import { redirect, type Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth.ts";
import { building } from "$app/environment";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/auth", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

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

  // Redirect unauthenticated users to login page
  const { pathname } = event.url;
  if (!session && !isPublicRoute(pathname)) {
    const redirectTo = encodeURIComponent(pathname + event.url.search);
    throw redirect(302, `/auth?redirectTo=${redirectTo}`);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
