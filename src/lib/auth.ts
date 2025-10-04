import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { prisma } from "./server/prisma";
import { appName } from "./app-info.ts";
import { getRequestEvent } from "$app/server";
import { bearer } from "better-auth/plugins";
import { dev } from "$app/environment";

export const auth = betterAuth({
  appName,
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  // Only use BETTER_AUTH_URL in production
  ...(dev ? {} : { baseURL: process.env.BETTER_AUTH_URL }),
  plugins: [bearer(), sveltekitCookies(getRequestEvent)],
});
