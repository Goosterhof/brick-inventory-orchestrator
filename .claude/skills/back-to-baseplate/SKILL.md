---
name: back-to-baseplate
description: Switch back to main branch, pull latest, and sync submodules — a clean return to the Baseplate
allowed-tools: Bash, Read
---

# Back to Baseplate

Return everything to a clean state on main. This is the "put all the bricks back in the box" skill.

## Process

### Step 1: Check Current State

Run `git status` to check for uncommitted changes (staged, unstaged, or untracked files that matter).

- If there are **uncommitted changes**: STOP and warn the user. List what's dirty and ask how they want to handle it (stash, commit, or discard). Do NOT proceed until the user confirms.
- If clean: continue.

### Step 2: Check Current Branch

Run `git branch --show-current`.

- If already on `main`: skip to Step 4.
- If on another branch: continue to Step 3.

### Step 3: Switch to Main

```bash
git checkout main
```

If checkout fails (e.g., detached HEAD, conflicts), report the error and stop.

### Step 4: Pull Latest

```bash
git pull origin main
```

If pull fails (e.g., merge conflicts), report the error and stop.

### Step 5: Restock Parts (Update Submodules to Latest Main)

For each submodule (`backend` and `frontend`):

```bash
git submodule foreach 'git checkout main && git pull origin main'
```

This pulls the latest `main` in each submodule, not just the commit the Baseplate currently references. After this, the Baseplate will show the submodules as modified if their latest main is ahead of the recorded commit — that's expected and correct.

### Step 6: Confirm

Report the final state:
- Current branch
- Last commit on main (one-line)
- Submodule status (`git submodule status`)

## Output Format

Keep it short. Example:

```
Back on the Baseplate.
- Branch: main
- Latest: abc1234 chore: update submodules
- Submodules: both synced to main refs
```

If anything went wrong, explain clearly what happened and what the user needs to do.
