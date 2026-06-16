# Civitas SPA client

A modern, friendly single-page frontend for Civitas, built with **React +
TypeScript + Vite + Tailwind**. It talks to the JSON API served by the Express
app under `/api`.

## Develop

The SPA and the API run as two processes in dev. Vite proxies `/api` to the
Express server so the session cookie stays same-origin.

```bash
# terminal 1 — API + classic EJS app (repo root)
npm install
npm start                 # http://localhost:3000

# terminal 2 — SPA dev server (this folder)
cd client
npm install
npm run dev               # http://localhost:5173
```

Open the SPA at **http://localhost:5173**. Demo logins (seeded automatically):
`sarah_chen`, `alex_rivera`, `jordan_park` — password `password123`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest unit/component tests |
| `npm run typecheck` | `tsc --noEmit` |

## What's implemented (first vertical slice)

- Auth: login / register / logout (session-cookie, CSRF-protected mutations)
- Feed + landing
- Communities list + single community (join / leave)
- Post detail: comments, reactions, bookmarks
- Create post with a **live moderation preview** (Civitas's signature feature)

Later passes will add the moderation queue, proposals/governance, appeals,
community health, profiles, settings, and search. Those routes currently render
a graceful "coming soon" placeholder; the classic EJS views remain available in
the meantime.

## Structure

```
src/
├── lib/         api client, query hooks, types, formatting helpers
├── components/  design-system primitives + shared UI (Layout, Toast, …)
├── pages/       route components
└── styles/      design tokens (CSS variables) + Tailwind base
```
