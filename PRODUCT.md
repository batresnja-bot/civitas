# Civitas — PRODUCT.md

register: product

## What it is
Civitas is a governance platform for online communities: plain-language
constitutions, AI-assisted post screening, community review of borderline cases,
transparent appeals, trust levels, and governance proposals. The React SPA
(this `client/`) is the modern frontend; it talks to the Express JSON API at
`/api` and is served at `/app`.

## Who uses it, where
Community members and moderators, on desktop and mobile, in a focused task:
reading and writing posts, reviewing flagged content, voting on proposals. The
tool should disappear into the task — earned familiarity over novelty.

## Design direction
Modern, friendly, trustworthy. Restrained color: a warm near-neutral canvas, one
confident "iris" primary reserved for actions / selection / state, and three
semantic moderation colors (approved = emerald, borderline = amber, rejected =
rose) that are the product's signature vocabulary. Density is welcome where it
helps (rule lists, dashboards); prose stays at a comfortable 65–75ch.

## Non-negotiables
- Body/secondary text meets ≥4.5:1 contrast (no washed-out muted gray on tint).
- Every interactive control has default/hover/focus/active/disabled/loading.
- Loading uses skeletons for content, not center spinners.
- Empty states teach the next action.
- Moderation status is always legible and consistently colored.
- Motion conveys state (150–250ms); no orchestrated page-load sequences.
