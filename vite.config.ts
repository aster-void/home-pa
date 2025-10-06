import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

import { env } from "./src/lib/server/env.ts";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: Number(env.PORT),
  },
});
