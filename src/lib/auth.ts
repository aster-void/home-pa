import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { prisma } from "./server/prisma";
import { appName } from "./app-info.ts";

export const auth = betterAuth({
	appName,
	database: prismaAdapter(prisma, {
		provider: "sqlite",
	}),
	plugins: [jwt()],
});
