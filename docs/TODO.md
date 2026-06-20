# Civitas — TODO / Roadmap

Status of the build and what's left. Grouped by priority.

## ✅ Done

- **Positioning**: "the trust diagnostic layer for online communities."
- **Brand & UI**: navy/blue/teal palette, Civic Knot logo, favicon, OG card,
  all icons are Lucide SVG (no emoji), two-column product-preview hero.
- **Accessibility**: 0 WCAG 2 A/AA violations (`npm run a11y`), Prettier +
  Tailwind class sorting.
- **Marketing pages**: landing, `/case-study`, `/about-builder`, footer links.
- **Demo mode**: `CIVITAS_DEMO_MODE=true` banner + one-click
  View as Founder / Member / Reviewer (no credentials).
- **The trust-diagnostic loop (computed live from real data)**:
  - Trust Radar (`/radar`) — health label + insight cards + Newcomer Rescue
  - Post Coach — live status + community-aware suggestions on create-post
  - Decision Receipts — shown on any held/rejected post
  - Weekly Trust Report (`/report`)
- **Core app**: feed, communities, community, post (comments/reactions/
  bookmarks), profile, charter, dashboard.
- **Backend**: JSON API under `/api`, session auth + CSRF, `/healthz`,
  production-ready cookies, `npm run build`.
- **Tests**: 27 API (Vitest + supertest), 8 client (Testing Library).
- **Docs**: README, DEPLOYMENT.md, docs/LAUNCH.md.

## 🔜 P0 — next

- [ ] **Persist trust insights / receipts / reports** in real tables
      (`trust_insights`, `decision_receipts`, `weekly_trust_reports`,
      `newcomer_rescue_items`) instead of computing on the fly, so actions
      (resolve / dismiss) and history work.
- [ ] **Review Center** (`/review`) — reviewer workspace: case + charter norm +
      context + options (approve / request edit / remove / escalate / mark rule
      unclear) that generates a Decision Receipt. Reviewer demo path.
- [ ] **Newcomer Rescue actions** — "Welcome & reply" should pre-fill a helper
      reply / ping; mark items resolved.
- [ ] **Postgres adapter** — use `DATABASE_URL` in production, keep SQLite for
      local dev (query abstraction + migrations + prod seed).
- [ ] **Deploy the public demo** — Koyeb + Supabase per DEPLOYMENT.md; set the
      live URL in README + landing.

## 🟡 P1 — soon

- [ ] **Weekly Trust Report export** — copy as markdown / email preview.
- [ ] **Demo reset endpoint** — `POST /api/demo/reset` gated by
      `DEMO_RESET_SECRET` to re-seed the public demo.
- [ ] **Charter editor in the SPA** (owners) — good/not-okay examples per norm.
- [ ] **Proposals / appeals in the SPA** (currently classic EJS only).
- [ ] **jsx-a11y ESLint config** + CI running `format:check`, `a11y`, tests.
- [ ] **Analytics adapter** (no-op by default; Plausible/Umami pluggable):
      landing viewed, demo opened, role selected, GitHub clicked.
- [ ] **Screenshots in README** — drop the real captures into `docs/screenshots/`.

## 🟢 P2 — later

- [ ] **Real AI provider** behind the Post Coach / screening interface
      (keep pattern-based as fallback; stay honest about what's ML).
- [ ] **Layer mode** — connect to Discord / GitHub Discussions / Slack instead
      of hosting the community.
- [ ] **More community templates** beyond Programming Help Hub.
- [ ] **Richer health signals** (response-time trends, sentiment of replies).
- [ ] **Org accounts / billing** — only if there's a reason to.

## Run locally

```bash
npm install
CIVITAS_DEMO_MODE=true npm start    # http://localhost:3000
# Windows PowerShell:  $env:CIVITAS_DEMO_MODE="true"; npm.cmd start
```

Quality gates:
```bash
npm test                 # API tests
cd client && npm test    # client tests
cd client && npm run a11y # accessibility (server must be running)
cd client && npm run format
```
