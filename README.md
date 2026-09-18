# Kitsu

**Same grid. Prove the run.**

Kitsu is a daily skill-challenge 3D endless runner. Every player gets the exact same course for
the day, every run is re-simulated on the server before it counts, and verified results are
anchored on-chain. The game is built around a Shiba Inu mascot and a monochrome perspective-grid
look with amber and teal accents.

## Why it is different

- **One course per day.** The layout is generated from a single day seed, so the leaderboard
  reflects skill, not a lucky roll.
- **No trusted client scores.** The browser only sends a replay of the player's input. The server
  re-runs the same deterministic engine and uses the result it produces.
- **Wallet-bound submissions.** Official runs are tied to a wallet that proved ownership with
  Sign-In With Ethereum (SIWE). Practice stays wallet-free.
- **Provable results.** The daily course seed and verified runs are recorded by on-chain
  registries, and a sponsor-funded vault backs seasonal rewards.

## How it works

```
player input -> deterministic engine (client) -> replay log + result
             -> POST /api/run/verify  (server re-simulation, no trust)
             -> POST /api/run/submit  (session + nonce, best-of-day leaderboard)
             -> relayer writes the verified run on-chain
```

The same engine under `sim/` drives live play and server verification, so a run is only accepted
when both sides agree. Ranking is by finish time (`best_time_ms` ascending); the coin score is a
secondary stat.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS v4 with CSS design tokens |
| 3D | three.js + @react-three/fiber |
| Data | PostgreSQL (Neon serverless) with Drizzle ORM |
| Web3 | viem, wagmi, SIWE on Robinhood Chain |
| Validation | zod |
| Images | @vercel/og (share card) |
| Contracts | Solidity, compiled with solc |

## Project structure

| Path | Contents |
| --- | --- |
| `app/` | Routes and API handlers (pages, `app/api/**`) |
| `components/` | UI: game scene, wallet, profile, landing, share |
| `sim/` | Deterministic game engine shared by client and server |
| `hooks/` | Game loop and client hooks |
| `lib/` | Auth, chain client, repositories, services, jobs, utilities |
| `db/` | Drizzle schema and SQL migrations |
| `contracts/` | Solidity sources and compiled ABI |
| `scripts/` | Contract compile and account helper scripts |
| `tests/` | Vitest unit and integration tests |
| `docs/` | Operational runbooks |
| `project-context/` | Product and engineering specs (kept local, not published) |

## Getting started

Prerequisites: Node.js 20 or newer, npm, and a PostgreSQL database (Neon works well).

```bash
npm install
cp .env.example .env      # then fill in the values
npm run db:migrate        # apply database migrations
npm run contracts:compile # compile Solidity ABI (only needed for chain work)
npm run dev               # start the dev server
```

Open http://localhost:3000. The practice course needs no wallet; submitting an official run
requires a browser wallet that supports EVM.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright tests |
| `npm run format` / `format:check` | Prettier |
| `npm run db:generate` / `db:migrate` | Drizzle migrations |
| `npm run contracts:compile` | Compile contracts with solc |

## Environment variables

Names only; values live in `.env`, which is never committed. See `.env.example`.

- `DATABASE_URL` - PostgreSQL connection string.
- `CRON_SECRET` - bearer secret for the cron endpoints.
- `NEXT_PUBLIC_ROBINHOOD_CHAIN_ID`, `NEXT_PUBLIC_ROBINHOOD_RPC_URL` - target chain (testnet for
  development, mainnet for production).
- `NEXT_PUBLIC_DAILY_COURSE_REGISTRY_ADDRESS`,
  `NEXT_PUBLIC_VERIFIED_RUN_REGISTRY_ADDRESS`,
  `NEXT_PUBLIC_SEASON_PRIZE_VAULT_ADDRESS` - deployed contract addresses.
- `RELAYER_PRIVATE_KEY` - server-only key used by the relayer. Never exposed to the client.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - optional cache.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/course/today` | Today's course (generated from the day seed if missing) |
| POST | `/api/run/verify` | Re-simulate a replay and return the canonical result |
| POST | `/api/run/submit` | Submit an official run (session + nonce) |
| GET | `/api/run/history` | Session-scoped run history |
| GET | `/api/wallet/nonce` | Issue a single-use SIWE nonce |
| POST | `/api/wallet/connect` | Verify SIWE and start a session |
| POST | `/api/wallet/logout` | End the session |
| GET | `/api/leaderboard/daily` | Daily ranking by finish time |
| GET | `/api/leaderboard/season` | Seasonal ranking and reward entitlements |
| GET | `/api/share/[runId]` | Share card image for a run |
| POST | `/api/cron/publish-course` | Publish the day's course and seed it on-chain |
| POST | `/api/cron/relay-runs` | Relay verified runs on-chain |
| POST | `/api/cron/retention` | Prune stale replay data and logs |

## Scheduled jobs

Publishing and relaying run from an external scheduler (cron-job.org); the endpoints are guarded
by `CRON_SECRET`. See `docs/runbook-cron.md`.

## Smart contracts

| Contract | Role |
| --- | --- |
| `DailyCourseRegistry` | Stores each day's seed, immutable once written |
| `VerifiedRunRegistry` | Records server-verified runs, wired to the course registry |
| `SeasonPrizeVault` | Holds sponsor funds and distributes seasonal rewards |

## Security model

- The server never trusts a client score: verified endpoints re-run the replay with `sim/`.
- Wallet identity always comes from a SIWE-backed server session, not from request input.
- Official submissions are single-use (nonce) and rate limited per wallet per day.
- Secrets (database URL, cron secret, relayer key) stay server-side and are excluded from git.

## Status

Core gameplay, verification, wallet sessions, database and leaderboard, contracts, relayer,
status UX, share card, and season rewards are implemented. Mainnet deployment is pending funding
of the production relayer account.

## License

Private and proprietary. All rights reserved.
