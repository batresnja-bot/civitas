# Civitas SPA Frontend — Design Spec

**Date:** 2026-06-15
**Status:** Approved (user delegated final scope decision)
**Author:** Claude (Civitas frontend rebuild)

## Goal

Build a modern, friendly single-page-app frontend for Civitas (the
constitutional-moderation governance app) using React + TypeScript + Vite +
Tailwind. The existing Express + EJS server stays intact and keeps working; we
add a JSON API alongside it and a new SPA client that consumes that API.

Design guidance comes from the installed `impeccable` and `taste-skill` skills:
a real design-token system, a friendly/approachable social look, and explicit
avoidance of generic "AI default" UI.

## Non-goals (this pass)

- Replacing or deleting the EJS views. They remain as a fallback and are
  untouched.
- Rebuilding every page. First pass is a complete vertical slice (below).
- Changing the database schema or moderation/reputation logic.

## Architecture

```
repo root
├── app.js, db.js, moderation.js, reputation.js, security.js, seed.js  (unchanged behavior)
├── api/                         NEW — JSON API router + helpers
│   └── index.js                 mounted at /api, isolated from EJS middleware
├── views/ public/               existing EJS frontend (kept)
└── client/                      NEW — React + TS + Vite + Tailwind SPA
    ├── index.html
    ├── vite.config.ts           dev proxy /api -> http://localhost:3000
    ├── src/
    │   ├── main.tsx, App.tsx, router
    │   ├── lib/api.ts           typed fetch wrapper (credentials: include, CSRF header)
    │   ├── lib/queries.ts       TanStack Query hooks
    │   ├── components/          design-system primitives + shared UI
    │   ├── styles/tokens.css    design tokens (color, type, space, radius, shadow)
    │   └── pages/               route components
```

### Backend: JSON API

A new Express router mounted at `/api`, **before** the EJS `res.locals`
middleware (which regenerates the CSRF token every request) and **before** the
30-req/min `ipRateLimit` (too low for an SPA). The API gets its own generous
rate limiter that responds with JSON, not rendered HTML.

Auth reuses the existing `express-session` cookie. CSRF reuses
`validateCSRFToken` (accepts the `x-csrf-token` header), but the API issues a
**stable** per-session token (generated once if absent, not regenerated each
request) exposed via `GET /api/auth/me`.

Endpoints for the first slice:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/me` | current user (or null) + csrf token |
| POST | `/api/auth/register` | create account, start session |
| POST | `/api/auth/login` | login |
| POST | `/api/auth/logout` | logout |
| GET | `/api/communities` | list active communities + member counts |
| GET | `/api/communities/:slug` | community + membership + top tags |
| GET | `/api/communities/:slug/posts` | approved posts for a community |
| POST | `/api/communities/:slug/join` | join |
| POST | `/api/communities/:slug/leave` | leave |
| GET | `/api/feed` | recent approved posts across communities |
| GET | `/api/communities/:slug/posts/:id` | post + comments + reactions + tags + bookmark state |
| POST | `/api/communities/:slug/posts/:id/comment` | add comment |
| POST | `/api/communities/:slug/posts/:id/react` | toggle reaction |
| POST | `/api/communities/:slug/posts/:id/bookmark` | toggle bookmark |
| POST | `/api/communities/:slug/posts` | create post (returns moderation result) |
| POST | `/api/moderation/preview` | live moderation preview for draft content |

All handlers reuse the exact queries/logic already in `app.js`, returning JSON
instead of rendering EJS. Validation mirrors the existing rules (username 3–30,
password ≥ 8, email format, etc.).

### Frontend: SPA

- **Routing:** React Router. Routes: `/` (landing/feed), `/login`, `/register`,
  `/c` (communities), `/c/:slug` (community), `/c/:slug/p/:id` (post),
  `/c/:slug/new` (create post). A protected-route wrapper redirects
  unauthenticated users to `/login`.
- **Data:** TanStack Query for fetching/caching/invalidation. Mutations
  (join/leave/comment/react/bookmark/create) invalidate the relevant queries.
- **Auth state:** `useMe()` query backed by `/api/auth/me`; the app shell shows
  the current user, trust level, and unread placeholder.
- **API client:** `api.ts` always sends `credentials: 'include'`, attaches the
  CSRF token header on mutations, and throws typed errors that the UI surfaces
  as toasts / inline messages.

### Design language (impeccable + taste-skill)

- **Tokens** in CSS variables: a warm neutral base, one confident accent
  (friendly, not corporate-blue-default), semantic colors for the three
  moderation states (approved = calm green, borderline = amber, rejected =
  muted red). Type scale with a real display/body pairing; spacing scale;
  radius scale (rounded, friendly); layered soft shadows.
- **Component layer:** `Button`, `Card`, `Avatar`, `Badge`/`TrustBadge`,
  `TagPill`, `Field`/`Textarea`, `Toast`, `EmptyState`, `Spinner`,
  `ModerationResult`. Pages stay thin and compose these.
- **Signature moment:** the create-post screen shows a **live moderation
  result** (calls `/api/moderation/preview` as the user types, debounced)
  surfacing approved / borderline / rejected with the explanation — Civitas's
  defining feature, made tangible in the UI.
- **Polish:** responsive (mobile-first), keyboard-accessible, focus-visible
  states, reduced-motion respected, tasteful transitions on hover/press and
  list entrance.

## Data flow (example: create post)

1. User opens `/c/:slug/new`; SPA loads community + active rules.
2. As they type, debounced `POST /api/moderation/preview` returns
   `{status, explanation, ...}`; the `ModerationResult` component reflects it.
3. On submit, `POST /api/communities/:slug/posts` runs the real `moderate()`,
   persists the post with the resulting status, returns the created post +
   moderation result.
4. SPA invalidates community/feed queries and navigates to the post (or shows a
   "held for review" state if borderline/rejected).

## Error handling

- API returns `{ error: string }` with appropriate status codes (400 validation,
  401 unauth, 404 not found, 429 rate limited).
- `api.ts` throws `ApiError`; queries surface errors inline, mutations via toast.
- Protected routes redirect to `/login` on 401.

## Testing

- **API:** Vitest + supertest against the Express app with a temp SQLite DB —
  auth flow, community list/detail, post create with each moderation outcome,
  reaction/bookmark toggles, CSRF rejection.
- **Frontend:** Vitest + React Testing Library for the API client (CSRF header,
  error mapping) and key components (`ModerationResult` states, `TrustBadge`,
  protected-route redirect). Build must pass `tsc` and `vite build`.

## Build order

1. JSON API router + tests (no UI yet).
2. Vite/React/Tailwind scaffold + design tokens + component primitives.
3. Auth (api client, `useMe`, login/register, protected routes, app shell).
4. Communities list + single community (join/leave).
5. Feed + landing.
6. Post detail (comments, reactions, bookmark).
7. Create post with live moderation preview.
8. Verify (tsc, build, API tests), then hand off a patch.

## Constraints / caveats

- The SPA can't be previewed at the user's `localhost:3000` (runs in this
  container). Verification is via automated tests + `vite build`.
- This session cannot push to GitHub; completed work is delivered as a git
  patch for the user to apply in a write-capable environment.
