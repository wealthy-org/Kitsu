# Cron Runbook

External scheduler: **cron-job.org** (free tier). Vercel Cron is not used.

## Jobs

| Job | Schedule | Method | URL |
| --- | --- | --- | --- |
| Publish course | Once per day | POST | `https://<domain>/api/cron/publish-course` |
| Relay runs | Every few minutes | POST | `https://<domain>/api/cron/relay-runs` |

Both jobs must send the header:

```
Authorization: Bearer <CRON_SECRET>
```

## Setup

1. Log in to cron-job.org using the same email account as the deploy account.
2. Create the two jobs above with the `Authorization` header and method `POST`.
3. Publish course: body `{}` (defaults to today) or `{ "date": "YYYY-MM-DD" }`.
4. Relay runs: no body.

## Expected responses

- Publish course: `200 { course_date, status: "published" | "already_published", onchain_tx_hash? }`.
- Relay runs: `200 { relayed_count, tx_hash, remaining }`.
- Missing or invalid secret: `401 UNAUTHENTICATED`.

## Failure handling

- A failed publish never blocks course reads; `GET /api/course/today` still generates from the date seed.
- A failed relay is safe to retry: already-relayed runs are skipped using `onchain_tx_hash`.
- If the relayer account runs out of testnet gas, relay fails with `503`; fund `RELAYER_PRIVATE_KEY`.
