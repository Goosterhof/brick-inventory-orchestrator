# Work Order: Phase 4 — Records Move + Folder Rename

**Work Order #:** 2026-05-19-phase-4-records-move
**Filed:** 2026-05-19
**Issued By:** The Steward (under CEO authority granted by the umbrella Work Order)
**Assigned To:** The Steward (self-executed; cross-wing structural change)
**Priority:** Standard
**Parent Work Order:** [`2026-05-18-form-the-brickworks`](2026-05-18-form-the-brickworks.md) (umbrella; remains `In Progress`)

> This is a Phase 4 sub-Work-Order under the umbrella, filed because the Phase 4 spec calls out a "Phase 4 Work Order" specifically as the home for the pre-move git-shortlog artifact. The umbrella permit remains the authorization basis; the branch slug for the Phase 4 PR matches the umbrella (`form-the-brickworks`) so `PrePushPermitGate` matches the umbrella, not this file.

---

## The Job

Execute Phase 4 of `MERGER_PLAN.md` (rev 4):

1. Rename root folders: `.claude/records/permits/` → `.claude/records/work-orders/`; `journals/` → `build-records/`; `inspections/` → `audits/`
2. Move all surface records (backend + frontend, all three artifact types) into the renamed root folders
3. Pick the better of each template-pair, rename, update body vocabulary
4. **Atomically** update `backend/tools/CaptainHook/PrePushPermitGate.php` (`PERMIT_DIRECTORY` constant) and `backend/captainhook.json` (`TEMPLATE_FILENAME`) in the same commit as the bulk move
5. Update `/.claude/hooks/journal-nudge.sh` path constants in the same commit (RECORDS_ROOTS folder names)

## Pre-Move Artifact — Author Shortlog

Per Phase 4 spec: "capture `git shortlog -sn -- .claude/records/` output from both surfaces *before* the move and file it as a permanent artifact in the Phase 4 Work Order. Aggregate ownership signals (`git shortlog`, blame heatmaps) reset on bulk moves; per-file `git log --follow` still traces history."

**Captured at: 2026-05-19, branch `phase-4/form-the-brickworks` from `main` HEAD `87472f8`.**

### `git shortlog -sn -- .claude/records/`

*(empty — no commits)*

### `git shortlog -sn -- backend/.claude/records/`

*(empty — no commits)*

### `git shortlog -sn -- frontend/.claude/records/`

*(empty — no commits)*

### `git log --all --format='%an' -- backend/.claude/records/permits/ | sort | uniq -c`

```
      2 Gerard Oosterhof
```

### Finding

**The aggregate authorship signal was already destroyed before Phase 4 began.** The subtree merge that absorbed `brick-inventory-backend` and `brick-inventory-frontend` into this orchestrator (PR #28, commit `83c2f28` — "feat: collapse backend + frontend submodules into monorepo with unified deploy") collapsed the per-record commit history into a single squash commit. From that point on, every record in `backend/.claude/records/` and `frontend/.claude/records/` shows as authored by Gerard Oosterhof in `git log --follow`.

Phase 4's bulk move via `git mv` is structurally incapable of degrading a signal that was already lost. `git log --follow <path>` will continue to trace each record's filename history through the Phase 4 rename, leading back to the single subtree-merge commit — exactly the depth of history available before Phase 4.

The signal that the spec set out to preserve does not exist in the post-monorepo-merger repo. This finding supersedes the spec's concern: there is nothing to preserve.

The original per-author commit history is still preserved in the pre-monorepo upstream repos (`brick-inventory-backend`, `brick-inventory-frontend`) — those repos are intact at their pre-subtree-merge HEADs. A researcher wanting historical authorship would consult them, not the orchestrator's HEAD.

## Acceptance Criteria

- [ ] All three root folders renamed: `work-orders/` / `build-records/` / `audits/` exist; `permits/` / `journals/` / `inspections/` do not
- [ ] All records from both surfaces moved into the renamed root folders via `git mv`
- [ ] Three templates exist with new names: `.work-order-template.md`, `.build-record-template.md`, `.audit-template.md`
- [ ] Each template body uses new vocabulary (Work Order / Build Record / Audit / The Steward / Brickwright / Quality Warden)
- [ ] `backend/tools/CaptainHook/PrePushPermitGate.php` `PERMIT_DIRECTORY` constant updated to `.claude/records/work-orders`
- [ ] `backend/captainhook.json` `TEMPLATE_FILENAME` updated to `.work-order-template.md`
- [ ] `/.claude/hooks/journal-nudge.sh` RECORDS_ROOTS structure updated to new folder names
- [ ] **All of the above in a single atomic commit**
- [ ] `composer test:arch` passes from `backend/` cwd
- [ ] Visibility-corpus grep on new template bodies returns zero hits

## Status

**Status:** Completed

## Build Record

This Phase 4 sub-Work-Order's outcome is absorbed into the umbrella [closing Build Record](../build-records/2026-05-19-form-the-brickworks.md), which covers all eight phases of the Brickworks merger.
