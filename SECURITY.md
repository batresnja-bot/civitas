# Security Policy

## Status
Civitas is a **prototype / demo**, not production infrastructure. **Do not use it
for sensitive or personal production data.** The public demo may reset and runs
on free-tier hosting with no uptime guarantee.

## What's implemented
- **Authentication:** server-side sessions (express-session), bcrypt password
  hashing, `httpOnly` cookies; `Secure` cookies + `trust proxy` in production.
- **CSRF:** a token is required on every state-changing API request
  (`x-csrf-token` header), validated against the session.
- **Rate limiting:** per-IP limits on the API and stricter limits on auth routes.
- **Input validation:** server-side validation on all write endpoints
  (username/email/password rules, content presence, allowed enums).
- **Security headers:** `nosniff`, `X-Frame-Options: DENY`, referrer-policy,
  permissions-policy.

## On the roadmap (not yet complete — stated honestly)
- **Role-based access:** owner/reviewer gating enforced on every server mutation
  (currently partial; being audited).
- **Audit log:** immutable record of moderation/review actions (who, what, when).
- **Postgres-backed persistence** for production deployments.

## Data minimization
The demo stores only what it needs to function (accounts, posts, comments,
reactions, moderation cases). It does **not** collect analytics PII, device
fingerprints, third-party tracking, or content from external platforms.

## Responsible disclosure
Found a vulnerability? Email **<security-contact>** with steps to reproduce.
Please do not open public issues for security bugs, and do not run destructive
tests against the live demo.

## Known limitations
Pattern-based screening (false positives and negatives are expected), demo-scale
data, no formal penetration test, no SLA. Treat all automated outputs as prompts
for human review, never as verdicts.
