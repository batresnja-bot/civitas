# Decision Receipts

The core idea of Civitas. People accept outcomes they understand — silent,
unexplained removals are the single biggest driver of "this place is arbitrary."
A Decision Receipt turns a moderation action into a fair, legible, contestable
process.

## What they are
A consistent, human-readable record attached to every consequential moderation
action — held, removed, restored, approved-borderline, or appealed.

## Why they matter
Fair *process* matters as much as fair *outcomes*. A receipt converts a black box
into something a member can read, learn from, and challenge — which keeps trust
intact even when the answer is "no."

## Fields
- **Status** — held / needs changes / approved
- **What happened** — plain-language summary
- **Relevant norm** — the specific community rule
- **Why** — the exact phrase or pattern that triggered it
- **Reviewed by** — automated screening and/or human reviewers
- **What happens next** — the member's options
- **Expected time** — rough turnaround for review
- **Appeal** — whether and how it can be challenged

## Example
> **Held for review.**
> **Norm:** Critique code, not people.
> **Why:** "you clearly have no idea what you're doing" targets the person, not the code.
> **Reviewed by:** automated screening → two community reviewers.
> **What's next:** edit the sentence, wait for review, or withdraw the post.
> **Expected time:** usually under 6 hours.
> **Appeal:** available after a final decision.

## How they reduce unfairness
- **Specific** — names the exact trigger, not a vague "violated guidelines."
- **Non-humiliating** — neutral tone; reviewer identity hidden by default.
- **Educational** — shows the norm and a fixable path forward.
- **Contestable** — appeal is built in, not a favor you have to beg for.

## How appeals work
Any final decision can be appealed to a human. The appeal references the receipt;
the outcome updates the receipt. (Receipt + appeal-availability are implemented;
the appeal-submission flow is on the roadmap.)

## What not to overclaim
A receipt does **not** assert the screening is correct or objective. It explains
*why the system flagged something* and gives a human a fair way to overturn it.
A receipt is never phrased as a verdict.
