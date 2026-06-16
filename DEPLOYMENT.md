# Deploying Civitas (free public demo)

This is a **marketing/demo** deployment, not production-grade infrastructure. The
goal is a public URL you can share on LinkedIn, GitHub, Product Hunt, and in
portfolio/recruiter conversations.

Recommended zero-cost stack:

- **Source:** GitHub
- **Backend + SPA:** [Koyeb](https://www.koyeb.com) free web service (one process serves API + built SPA)
- **Database:** [Supabase](https://supabase.com) free Postgres (or run SQLite on the instance for a pure demo)
- **Domain:** free provider subdomain first; custom domain later

> **Status note:** The app runs on SQLite today and is structured so a Postgres
> adapter can be added (`DATABASE_URL` is reserved for this). For the very first
> public demo you can deploy with SQLite on the instance (data resets on
> redeploy/cold storage). Wire Supabase Postgres when the adapter lands — see
> "Postgres" below.

## 1. GitHub

Push the repository to GitHub. Ensure `client/dist` is **not** required in the
repo — the build step generates it.

## 2. Supabase (Postgres)

1. Create a Supabase project.
2. Copy the connection string (Project → Settings → Database → Connection string,
   URI form). It looks like `postgresql://...`.
3. You'll set it as `DATABASE_URL` in Koyeb.

(Until the Postgres adapter ships, you can skip this and run SQLite on the
instance — document the reset behavior to visitors via demo mode.)

## 3. Koyeb

1. Create a new Web Service from your GitHub repo.
2. **Build command:**
   ```
   npm install && cd client && npm install && npm run build && cd ..
   ```
3. **Run command:**
   ```
   npm start
   ```
4. **Port:** `3000`
5. **Health check path:** `/healthz` (returns 200 JSON).

## 4. Environment variables

```
SESSION_SECRET=<strong-random-secret>
NODE_ENV=production
PORT=3000
CIVITAS_DEMO_MODE=true
DEMO_RESET_SECRET=<strong-random-secret>
# When the Postgres adapter is enabled:
DATABASE_URL=<supabase-postgres-uri>
```

- `NODE_ENV=production` enables secure cookies behind the proxy (the app calls
  `trust proxy` and sets `cookie.secure`).
- `CIVITAS_DEMO_MODE=true` shows the demo banner and the one-click
  **View as Founder / Member / Reviewer** buttons.

## 5. Demo seed

The database seeds automatically on first boot when empty (demo users,
communities, posts). No manual seed step is required for the demo.

## 6. What gets served

- `/` → marketing landing (redirects to the built SPA)
- `/app` → React SPA
- `/api` → JSON API
- `/healthz` → health check
- Classic EJS routes remain reachable and are styled.

## 7. Postgres (when you outgrow SQLite)

Planned approach: a small database adapter selected at startup —
`if (process.env.DATABASE_URL) usePostgres() else useSqlite()` — with a shared
query interface and migration + seed scripts. SQLite stays the default for local
dev so `npm start` keeps working with zero config. Until then, the demo runs on
SQLite and this is called out honestly in the UI (demo banner).

## 8. Troubleshooting

- **Cold starts:** free instances sleep; first request after idle is slow.
- **`EADDRINUSE` locally:** an old server holds the port — kill it (`lsof -ti:3000 | xargs kill -9`, or on Windows `taskkill /PID <pid> /F`).
- **Unstyled pages:** ensure the build ran (`client/dist` exists) and you hard-refresh.
- **Login not persisting in prod:** confirm `NODE_ENV=production` and HTTPS (secure cookies require TLS).

## 9. Free-tier limitations (be honest)

- Cold starts may happen on free tiers.
- Free database limits apply.
- Not intended for sensitive or production data.
- Email is not configured.
- File uploads are limited/none.
- No uptime guarantee.

## 10. Upgrading later

Move to a paid instance for no cold starts, add the Postgres adapter + managed
backups, configure a custom domain and email provider, and add a privacy-friendly
analytics provider (Plausible/Umami) via the analytics adapter.
