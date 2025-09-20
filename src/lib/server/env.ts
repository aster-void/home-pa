import * as v from "valibot";

const toNumber = () =>
  v.pipe(
    v.string(),
    v.transform((t) => Number(t)),
    v.number(),
  );

const Env = v.object({
  BASE_URL: v.string(),
  PORT: toNumber(),
  DATABASE_URL: v.string(),
  BETTER_AUTH_URL: v.string(),
  BETTER_AUTH_SECRET: v.string(),
});

export const env = v.parse(Env, process.env);
