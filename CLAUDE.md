# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@.claude/rules/general.md
@.claude/conventions/typescript.md
@.claude/conventions/backend.md
@.claude/conventions/frontend.md

## Commands

This is a pnpm monorepo managed by Turborepo. All commands run from the repo root.

```bash
pnpm install           # install all workspace dependencies
pnpm dev               # run api + web concurrently
pnpm dev:api           # run API only (ts-node-dev, port 4000)
pnpm dev:web           # run web only (Vite, port 3000)
pnpm build             # build all packages in dependency order
pnpm typecheck         # tsc --noEmit across all packages
pnpm lint              # eslint across all packages
```

Start infrastructure (PostgreSQL + Redis) before running the API:
```bash
docker compose up -d
```

## Architecture

### Workspace layout

```
packages/types    — shared TypeScript types (GameState, GameMove, User, Socket events)
packages/utils    — shared utilities (JWT helpers, error classes, logger)
src/api           — Express + Socket.IO backend
src/web           — React 19 + Vite frontend
```

`@boardgame/types` is the contract between all packages. Both the API and web import from it. Build order is `types → utils → api/web`.

### API (`src/api`)

- **Entry**: `src/index.ts` — sets up Express, mounts routes, calls `createSocketServer`, starts the matchmaking worker.
- **Routes → Services**: thin Express routers in `routes/` delegate to `services/` (auth, game, matchmaking, user).
- **Database**: PostgreSQL via `pg` (`src/db.ts`), Redis via `redis` (`src/redis.ts`).
- **Real-time**: Socket.IO server in `socket/`. Sockets authenticate via JWT in `handshake.auth.token`. Handlers are registered per-connection: `game.handler.ts` and `chat.handler.ts`.
- **Matchmaking**: Redis sorted sets keyed `queue:<gameType>` store players by rating. `matchmaking.worker.ts` polls periodically and emits `matchmaking:matched` when two players pair.
- **Game engines**: pluggable via `EngineRegistry` (`engines/registry.ts`). Each engine implements `GameEngine` (getInitialState, validateAndApply, checkResult). Register by importing the engine file (e.g. `import './engines/gomoku'`).

### Web (`src/web`)

- **Routing**: React Router v7, pages in `pages/`.
- **State**: Zustand stores in `store/` — `auth.ts` (JWT tokens), `game.ts` (live game state), `socket.ts` (Socket.IO connection lifecycle).
- **API calls**: axios instance in `lib/api.ts` with a request interceptor that attaches the Bearer token from `useAuthStore`.
- **Socket connection**: `useSocketStore.connect(token)` creates a typed `Socket<ServerToClientEvents, ClientToServerEvents>` and wires server events directly into `useGameStore`.
- **Path alias**: `@/` maps to `src/web/src/` (configured in `tsconfig.json` + Vite).

### TypeScript config

- Root `tsconfig.base.json` sets `module: Node16` / `moduleResolution: Node16` with `ignoreDeprecations: "6.0"` (needed for `baseUrl` + `paths`).
- `src/web/tsconfig.json` overrides to `module: ESNext` / `moduleResolution: bundler` for Vite compatibility.

### Environment variables

| Variable | Used by | Default |
|---|---|---|
| `PORT` | API | `4000` |
| `CLIENT_ORIGIN` | API CORS + Socket.IO CORS | `http://localhost:3000` |
| `JWT_SECRET` | API | `change-me-in-production` |
| `DATABASE_URL` | API (`db.ts`) | — |
| `REDIS_URL` | API (`redis.ts`) | — |
| `VITE_REALTIME_URL` | Web socket store | `http://localhost:4000` |
