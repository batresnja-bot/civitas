# Civitas — Governance Operating System

## Goal
Build "Civitas" — a governance operating system for online communities with transparent rules, AI-assisted moderation, community review, appeals, trust systems, and constitutional governance

## Constraints & Preferences
- User is non-technical ("I usually just say continue")
- Must be usable by non-tech people
- No paid admin needed — self-governing community model
- Honest AI labeling (pattern-based engine, not "AI")
- Email verification required for registration
- Must work on mobile browsers
- Spec demands: calm trustworthy design, accessibility (WCAG 2.2 AA), privacy-by-design, server-enforced auth
- Do not claim "zero admin cost" or call rules-based engine "AI" without qualification
- Working product over incomplete large features
- Keep app runnable after each stage

## Progress

### Stage 1 — Landing Page & Brand Identity (DONE)
- Civic Knot SVG logo (interlocking arcs + dialogue bubble + central trust dot)
- Comprehensive design token CSS system (warm ivory / civic blue / trust teal / deliberation amber palette)
- Landing page with hero copy, problem cards, metrics, how-it-works, features, transparency, comparison, and CTA sections
- Responsive design with mobile breakpoints
- Footer with discover/create/login links

### Stage 2 — Core Community Features (DONE)
- User registration with email verification
- Login/logout with session management
- Community discovery page with member counts
- Community detail page with post feed
- Post creation with pre-publish assistant
- Search across approved posts
- User profiles and settings pages
- Bookmark and reaction systems

### Stage 3 — Community Creation & Templates (DONE)
- Multi-step community creation wizard with progress indicator
- 6 template options: Custom, Creator Circle, Course Cohort, Open Source, Professional Guild, Civic Group
- Template-based default rules (3 rules each template)
- Name, description, purpose, template selection fields
- Auto-generated slugs with uniqueness validation
- Automatic admin assignment to creator

### Stage 4 — Constitution Builder & Quality Analysis (DONE)
- Constitution editing page with markdown-style rule entry
- Quality analysis endpoint (POST /api/constitution-analyze)
- Analysis dimensions: Clarity, Fairness, Enforceability
- Warnings for vague language, missing purposes, missing examples
- Rules counter and overall quality score
- Writing guide sidebar with best practices
- Rule versioning (new version on each edit)
- Audit trail of constitution changes

### Stage 5 — Moderation & Review System (DONE)
- Review Center with pending posts queue
- Conflict-of-interest warning banner
- Hidden reviewer identities (reviewer # IDs)
- Decision approval/rejection with required rationale
- Rule citation in rejection rationale
- Recent decisions history
- Notifications for post status changes
- Pre-publish assistant with suggestions API
- Rewrite suggestions for problematic content
- Rule conflict warnings on post creation

### Stage 6 — Appeals & Governance (DONE)
- Appeals page with new appeal form + existing appeals list
- 8 grounds for appeal: Rule misapplied, Missing context, Satire/parody, Disproportional, Procedural error, New evidence, Bias/conflict, Other
- Appeal status tracking (pending/resolved/rejected)
- Decision rationale visible on appeal
- Proposal system with voting
- Community health dashboard

### Stage 7 — Seed Data Expansion (DONE)
- 30 users with diverse bios and roles
- 3 communities with full membership
- 50+ posts across multiple topics
- 100 comments with realistic dialogue
- 12 moderation cases (8 decided, 4 open)
- 4 appeals (2 resolved, 1 rejected, 1 pending)
- 5 governance proposals (3 open, 2 passed)
- 15 notifications
- 4 feature flags enabled

## Key Architecture Decisions
- Logo: Civic Knot SVG — circular interlocking paths (conversation, protection, shared trust)
- Brand: Civitas Navy #0F172A, Civic Blue #2563EB, Trust Teal #0F766E, Warm Ivory #FFF8ED, Deliberation Amber #F59E0B
- Voice: "Calm authority with human warmth" — no police/courtroom/gavel imagery
- Engine: Pattern-based (not AI) — transparent about what matches which rule
- Database: SQLite with WAL mode, 21 tables
- Server: Express with EJS templates

## Server Restart Procedure
```powershell
taskkill /F /IM node.exe
Remove-Item data.db, data.db-wal, data.db-shm -Force
node seed.js
node app.js
```

## Test Commands
```
node app.js                          # Start server (port 3000)
node seed.js                         # Reset and populate database
Get-Process -Name node               # Check if running
```

## File Reference
- `app.js` — Server with all routes (461 lines, needs service-layer refactor)
- `db.js` — SQLite schema with 21 tables
- `moderation.js` — Pattern-based toxicity engine + constitution analysis
- `reputation.js` — Multi-dimensional trust system
- `security.js` — CSRF, rate limiting, security headers
- `seed.js` — Demo data seeder (30 users, 50+ posts, 100 comments)
- `views/partials/logo.ejs` — Civic Knot SVG logo partial (reusable, accepts `size` param)
- `views/index.ejs` — Landing page
- `views/auth.ejs` — Login/register page
- `public/style.css` — Complete CSS design system

## Next Steps
- Architecture refactor: separate services from routes in app.js
- Add email verification flow (currently auto-verified in seeds)
- Write unit tests
- Add real-time notifications via WebSockets
- Improve admin dashboard with governance analytics
- Dockerize for easy deployment
- Rewrite README
