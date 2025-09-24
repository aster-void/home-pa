import * as v from "valibot";

const Env = v.object({
  BASE_URL: v.optional(v.string(), "http://localhost:3000"),
  PORT: v.optional(v.string(), "3000"),
});

export const env = v.parse(Env, process.env);
