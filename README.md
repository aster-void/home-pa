# home-pa

## Quickstart

### Pre Requesties

- Bun

### Env

envset:

- DATABASE_URL
- BETTER_AUTH_URL
- BETTER_AUTH_SECRET

### Steps

```sh
# 1. install deps
bun install

# 2. dev server
bun dev
```

## Scripts

### Bun scripts

- `bun dev` – start Vite dev server
- `bun run build` – build for production
- `bun check` – types, lint, format checks
- `bun fix` – format fix

### Bash scripts

if you use direnv, this should be available to PATH.

```sh
up.sh # initialize dev state
down.sh # finalize
```

## MongoDB (Docker)

- Start DB: `docker compose -f infra/docker-compose.yml up -d`
- Default URI: `mongodb://root:example@localhost:27017/homepa?authSource=admin`
- Stop DB: `docker compose -f infra/docker-compose.yml down`

## Notes

- Docs aim to stay minimal and current.
