import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { prisma } from "./server/prisma";
import { appName } from "./app-info.ts";
import { getRequestEvent } from "$app/server";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  appName,
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  // basePath defaults to "/api/auth"; uses BETTER_AUTH_URL when set
  plugins: [bearer(), sveltekitCookies(getRequestEvent)],
});
