# Civitas

A governance operating system for online communities. Transparent rules, AI-assisted moderation, community review, and constitutional governance — without a full-time admin.

## What It Is

Civitas gives your community:
- A **constitution** with clear, plain-language rules
- **AI-assisted screening** that checks every post against your rules (pattern-based, not ML)
- **Community review** for borderline cases
- **Transparent appeals** so decisions can be challenged
- **Trust levels** that reward accurate contributors
- **Governance proposals** for evolving your community's rules

## Quick Start

```bash
cd constitutional-moderation
npm install
node app.js
```

Open http://localhost:3000

The database seeds automatically with demo data (8 users, 3 communities, 10 posts).

**Demo accounts** (password: `password123`):
- `sarah_chen` — Community owner
- `alex_rivera` — Regular member
- `jordan_park` — Member

## How It Works

### 1. Write Your Constitution
Each community defines rules with titles, summaries, and purposes. Rules have severity levels (critical/standard/minor).

### 2. AI Screens Every Post
Posts are scored against two dimensions:
- **Toxicity detection** — profanity, threats, insults, hate speech, spam
- **Constitutional evaluation** — checks against your community's rules

Posts land in three buckets:
- **Approved** — goes live immediately
- **Rejected** — blocked, user can appeal
- **Borderline** — sent to community review

### 3. Community Reviews Borderline Cases
Trusted members review edge cases with full context. Decisions include rationale.

### 4. Appeals & Precedents
Rejected posts can be appealed. Decisions build precedent over time.

### 5. Trust Earns Influence
Multi-dimensional reputation system:

| Level | Title | Points | Permissions |
|-------|-------|--------|-------------|
| 0 | Newcomer | 0 | Post, comment, react |
| 1 | Contributor | 10 | + bookmark, follow |
| 2 | Trusted Member | 50 | + create tags |
| 3 | Established | 150 | + nominate reviewers |
| 4 | Guardian | 400 | + review content |
| 5 | Elder | 1000 | Full permissions |

### 6. Propose Changes
Members can propose changes to the constitution. Proposals go through a workflow: Draft → Open → Discussion → Voting → Approved/Rejected.

## Features

- **Communities** — Create and join communities
- **Posts** — Text, questions, discussions, guides, announcements
- **Comments** — Threaded comments with moderation
- **Reactions** — helpful, insightful, well_explained, constructive, agree
- **Tags** — Categorize posts within communities
- **Bookmarks** — Save posts for later
- **Notifications** — Get notified about comments, reactions, moderation decisions
- **Search** — Find posts across communities
- **User Profiles** — Reputation, trust level, post history
- **Community Health** — Dashboard with stats, top contributors, moderation cases
- **Audit Log** — Track all important actions
- **Rate Limiting** — IP-based and auth-based rate limits
- **Security Headers** — XSS protection, nosniff, CSRF tokens

## Tech Stack

- **Backend:** Node.js + Express 5
- **Database:** SQLite (via better-sqlite3)
- **Templates:** EJS
- **Auth:** bcryptjs + express-session
- **Moderation:** Pattern-based engine (extensible)

## File Structure

```
constitutional-moderation/
├── app.js              # Express server, all routes
├── db.js               # SQLite schema (20+ tables)
├── moderation.js       # Pattern-based toxicity engine
├── reputation.js       # Multi-dimensional trust system
├── security.js         # CSRF, rate limiting, headers
├── seed.js             # Demo data seeder
├── .env                # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies
├── views/
│   ├── partials/
│   │   └── nav.ejs         # Navigation bar
│   ├── index.ejs           # Landing page
│   ├── auth.ejs            # Login/Register
│   ├── communities.ejs     # Community list
│   ├── community.ejs       # Single community
│   ├── create-community.ejs
│   ├── constitution.ejs    # View constitution
│   ├── edit-constitution.ejs
│   ├── create-post.ejs     # New post
│   ├── post.ejs            # Single post + comments
│   ├── moderation.ejs      # Review queue
│   ├── dashboard.ejs       # User dashboard
│   ├── notifications.ejs   # Notification center
│   ├── settings.ejs        # Profile settings
│   ├── profile.ejs         # Public profile
│   ├── proposals.ejs       # Governance proposals
│   ├── proposal-detail.ejs # Single proposal
│   ├── create-proposal.ejs # New proposal
│   ├── appeals.ejs         # Appeal tracking
│   ├── health.ejs          # Community health
│   ├── rejected.ejs        # Rejected/pending posts
│   ├── search.ejs          # Search results
│   └── error.ejs           # Error page
└── public/
    └── style.css           # Complete CSS
```

## Limitations

- Pattern-based moderation (not real ML) — upgradeable to OpenAI/Perspective API
- No email verification (registration is username/password)
- No real-time updates (no WebSockets)
- No file uploads or images
- Single-server only (SQLite)

## Environment Variables

Create `.env`:
```
SESSION_SECRET=your-random-secret-here
PORT=3000
```

## License

ISC
