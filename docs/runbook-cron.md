# Cron Runbook

External scheduler: **cron-job.org** (free tier). Vercel Cron is not used.

## Jobs

| Job | Schedule | Method | URL |
| --- | --- | --- | --- |
| Publish course | Once per day | POST | `https://<domain>/api/cron/publish-course` |
| Relay runs | Every few minutes | POST | `https://<domain>/api/cron/relay-runs` |
| Retention | Once per day | POST | `https://<domain>/api/cron/retention` |
| Season rollover | Once per day | POST | `https://<domain>/api/cron/season-rollover` |

All jobs must send the header:

```
Authorization: Bearer <CRON_SECRET>
```

## Setup

1. Log in to cron-job.org using the same email account as the deploy account.
2. Create the jobs above with the `Authorization` header and method `POST`.
3. Publish course: body `{}` (defaults to today) or `{ "date": "YYYY-MM-DD" }`.
4. Relay runs, retention, and season rollover: no body.
5. Season rollover needs at least one season row to exist. Insert the first season manually (`seasons` table: `label`, `start_date`, `end_date`, `pool`) before the cron can derive the next one.

## Season rollover

- Runs once per day. When the active season's `end_date` has passed it inserts the next season (30 days, `pool` starts at `0`), so the public board resets while past seasons stay in the database.
- Idempotent: while a season still covers today it returns `200 { status: "no_change", season_label }`, and safe to run on every tick.
- With no season history at all it returns `200 { status: "no_previous_season" }`; create the first season manually, then the cron continues the series.
- Response when it acts: `200 { status: "created", season_label, start_date, end_date }`.

## Expected responses

- Publish course: `200 { course_date, status: "published" | "already_published", onchain_tx_hash? }`.
- Relay runs: `200 { relayed_count, tx_hash, remaining }`.
- Season rollover: `200 { status: "created" | "no_change" | "no_previous_season", season_label }`.
- Missing or invalid secret: `401 UNAUTHENTICATED`.

## Failure handling

- A failed publish never blocks course reads; `GET /api/course/today` still generates from the date seed.
- A failed relay is safe to retry: already-relayed runs are skipped using `onchain_tx_hash`.
- If the relayer account runs out of testnet gas, relay fails with `503`; fund `RELAYER_PRIVATE_KEY`.
