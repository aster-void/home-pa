# home-pa

A personal assistant calendar application built with SvelteKit, featuring smart suggestions, recurring events with sliding window management, and efficient memory usage.

## Features

### 📅 Calendar Management
- **Event Creation**: All-day, some-timing, and timed events
- **🆕 Recurring Events**: RRULE support with 7-month sliding window
- **🆕 Forever Events**: Special handling for events with no end date (∞ indicator)
- **Memory Efficient**: Only loads 7 months of data at a time
- **Visual Indicators**: ∞ for forever events, ↻ for duplicates

### 💡 Smart Suggestions
- Gap detection for free time
- Productive activity suggestions
- Reaction tracking and logging

### 📝 Memo Management
- Simple text-based memos
- Full CRUD operations

## Quickstart

### Prerequisites

- Bun

### Env

copy `.env.sample` to `.env`, and fill it.

### Steps

```sh
# 1) Install deps (runs sync/generate)
bun install

# 2) Start dev services (MongoDB)
up.sh

# 3) Ensure SvelteKit + Prisma are synced
bun run sync

# 4) Start dev server
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

## Dev Services

### MongoDB

part of: up.sh

- Start DB: `docker compose -f infra/dev.docker-compose.yml up -d`
- Default URI: `mongodb://root:example@localhost:27017/homepa?authSource=admin`
- Stop DB: `docker compose -f infra/dev.docker-compose.yml down`

## Auth

- Endpoints: `/api/auth/*` via SvelteKit handle hook.
- Base URL: `http://localhost:3000` (ensure `BETTER_AUTH_URL` matches).
- Client: see `src/lib/auth-client.ts`.
- Demo UI: visit `/auth` for sign in/up.


# Development Branch Test
