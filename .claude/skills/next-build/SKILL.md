---
name: next-build
description: Check the Idea Vault and recommend the next feature to build
allowed-tools: Read, Glob, Grep, Bash
---

# Next Build

Review the Idea Vault and determine what should be built next.

## Process

### Step 1: Read the Idea Vault

Read `docs/idea-vault.md`. If it doesn't exist, tell the user to run `/brick-apprentice` first.

### Step 2: Scan for Actionable Ideas

Identify all ideas that are candidates for work, in this priority order:

1. **In Progress** — Has unfinished slices or tasks. This is the default next pick.
2. **Ship It** — Approved but not yet started.
3. **Prototype First** — Needs a proof-of-concept. Only suggest if nothing higher-priority exists.

Skip ideas with status: Shipped, Return to Shelf, Back to the Drawing Board.

### Step 3: Check Current State

For the top candidate, quickly verify what's already been done:

- Check recent git log in `backend/` and `frontend/` for related commits
- Look at the relevant backend routes, controllers, or frontend domains that already exist
- If the idea has a **Progress** section, use that as the source of truth

### Step 4: Present the Recommendation

Output a short, clear recommendation:

```
## Next Build

### [Idea Name]
**Status:** [current status]
**What's done:** [brief summary of completed work]
**What's next:** [the specific next slice/task to tackle]

### Ready to build?
[1-2 sentences on what the first concrete step would be — e.g., "Start with the backend storage option endpoints" or "Create the frontend storage domain"]
```

If there are multiple viable candidates, briefly list them as alternatives after the main recommendation.

## Rules

- Do NOT modify the Idea Vault — this skill is read-only
- Do NOT start building anything — just recommend
- Keep it concise — the user wants a quick answer, not a deep analysis
- If all ideas are shipped/shelved, suggest running `/brick-apprentice` to brainstorm new ones
