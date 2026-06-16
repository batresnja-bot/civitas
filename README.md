# Civitas

### Find where your community is losing trust — and fix it before people leave.

Civitas is **the trust diagnostic layer for online communities**. Communities
rarely collapse all at once — they decay quietly: newcomers get ignored, helpers
burn out, rules get vague, and decisions feel arbitrary. Civitas detects those
trust fractures early and turns them into clear repair actions.

> Civitas is a product experiment exploring how online communities can make
> trust visible and decisions understandable. It is honest about its limits: the
> screening is pattern-based, not a large ML model, and the public deployment is
> a demo, not production infrastructure.

**Live demo:** _set your deployed URL here_ · **Case study:** `/case-study` ·
**About the builder:** `/about-builder`

---

## Why this exists

Online communities don't fail only because of toxic content. They fail when
**trust breaks** — rules are unclear, decisions feel arbitrary, moderators burn
out, newcomers get ignored, AI feels like a black box, and there's no way to
appeal. Civitas is a layer that repairs that.

## The five pillars

1. **Trust Radar** — detects where trust is breaking right now (ignored
   newcomers, ageing review queue, rules causing confusion, drifting
   contributors) as clear insight cards with recommended actions.
2. **Post Coach** — community-aware help while writing, so posts get better
   answers instead of being removed. Live status + concrete suggestions.
3. **Newcomer Rescue** — surfaces first-time posters waiting for a reply so a
   helper can welcome them before they give up and leave.
4. **Decision Receipts** — every moderation decision explained: what happened,
   the relevant norm, the reason, who reviewed it, what's next, and how to appeal.
5. **Weekly Trust Report** — a founder report on what improved, what needs
   attention, and the few actions that matter most next week.

Community Charter and Member-powered Review remain as supporting systems.

## Why programming communities first

Programming help communities make trust problems easy to see: vague questions,
mocked beginners, repeated answers, helper burnout, and unclear norms around
criticism. Civitas starts with **Programming Help Hub**, then expands to course,
creator, open-source, indie-maker, professional, and peer-support communities.

## Screenshots

Add images to `docs/screenshots/` and reference them here:

1. `landing.png` — landing page
2. `trust-radar.png` — the Trust Radar command center
3. `post-coach.png` — Post Coach in action
4. `newcomer-rescue.png` — the Newcomer Rescue queue
5. `decision-receipt.png` — a decision receipt
6. `weekly-trust-report.png` — the weekly trust report

## Tech stack

- **Server:** Node.js + Express 5, JSON API under `/api`
- **Client:** React 18 + TypeScript + Vite + Tailwind, TanStack Query, React Router
- **Database:** SQLite locally (better-sqlite3); Postgres targeted for the public demo
- **Auth:** express-session + bcryptjs, CSRF-protected mutations
- **Moderation:** transparent, pattern-based engine (extensible)
- **Tests:** Vitest (+ supertest for the API, Testing Library for the client)

## Architecture

A single Express server serves the JSON API (`/api`), the built React SPA
(`/app`, and `/` redirects there), and the classic EJS routes for legacy
governance flows. The SPA is the default, marketing-first experience.

```
.
├── app.js            # Express: /healthz, /api mount, SPA at /app, classic routes
├── api/              # JSON API + tests
├── db.js             # SQLite schema (CIVITAS_DB_PATH / DATABASE_URL aware)
├── moderation.js     # toxicity + charter evaluation + Post Coach suggestions
├── reputation.js     # multi-dimensional trust levels
├── security.js       # CSRF, rate limiting, headers
├── seed.js           # demo data
├── views/ public/    # classic EJS app + assets
└── client/           # React + Vite + Tailwind SPA (served at /app)
    └── src/{lib,components,pages,styles,config.ts}
```

## Local setup

Node 18+ (Node 22 recommended).

```bash
npm install
npm start            # http://localhost:3000  (SPA at /, API at /api)
```

Develop the SPA with hot reload:

```bash
cd client && npm install && npm run dev   # http://localhost:5173/app/ (proxies /api)
```

Production build (single process serves everything):

```bash
npm run build        # builds the SPA into client/dist
npm start            # serves it at http://localhost:3000
```

### Windows / PowerShell

If scripts are blocked, use `npm.cmd install` / `npm.cmd start`, or run
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. If port 3000 is busy:
`netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`.

## Demo accounts

Password `password123`: `sarah_chen` (founder/owner), `jordan_park` (member),
`alex_rivera` (reviewer). With `CIVITAS_DEMO_MODE=true`, no credentials are
needed — the landing and login pages show **View as Founder / Member / Reviewer**
buttons.

## Free deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for a zero-cost public demo on Koyeb +
Supabase, including environment variables, build/start commands, the `/healthz`
check, and honest free-tier limitations.

## Roadmap

- Deeper Decision Receipts + appeals in the SPA
- Trust Dashboard v1 with health labels (Strong / Stable / Needs attention / At risk)
- Postgres adapter for production; SQLite stays for local dev
- Review Center for member-powered review
- Real AI-provider integration behind the Post Coach interface
- Privacy-friendly analytics adapter (Plausible/Umami)

## Product philosophy

Help before punishment. Explain before enforcing. Make trust visible. Keep
governance lightweight. Protect members and reviewers. Be honest about AI.

## Security & privacy notes

Session-cookie auth, CSRF-protected mutations, security headers, and basic rate
limiting. The demo is not intended for sensitive data. The moderation engine is
pattern-based and will make mistakes — that's exactly why Decision Receipts and
appeals exist.

## License

ISC
