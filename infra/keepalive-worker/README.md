# Inospo Supabase Keep-Alive Worker

Cloudflare Worker that pings the Supabase REST API once a day so the free-tier
WC26 project never sits idle long enough to auto-pause (7-day window).

## What it does

- Fires on a daily cron (`0 6 * * *`, 06:00 UTC).
- Calls `GET /rest/v1/teams?select=id&limit=1` against the Supabase project,
  using the public anon key. That one request resets the pause timer.
- Logs the HTTP status and elapsed time. Visible via `npm run tail`.
- Also exposes a manual `fetch` endpoint — visiting the deployed URL runs the
  same ping on demand and returns JSON. Useful for sanity-checking after deploy.

## One-time setup

```bash
cd infra/keepalive-worker
npm install                    # installs wrangler locally

npx wrangler login             # opens browser, authenticate to your CF account

# Add the two secrets the Worker needs (paste each value when prompted).
# These come from the project's .env at the repo root.
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY

npx wrangler deploy            # ships the Worker + cron trigger
```

After deploy, hit the Worker URL it prints once to verify — you should see
`{"ok":true,"status":200,"elapsed_ms":...}`.

## Tailing logs

```bash
npm run tail
```

Streams scheduled-run output. Each daily fire produces one `keepalive 200 in Xms` line.

## Updating the Worker

Edit `src/index.js`, then:

```bash
npm run deploy
```

Cron schedule lives in `wrangler.toml`.
