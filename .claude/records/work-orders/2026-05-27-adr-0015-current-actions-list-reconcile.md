# Work Order: ADR-0015 Current Actions list reconcile

**Work Order #:** 2026-05-27-adr-0015-current-actions-list-reconcile
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (doc-only, ADR-0015 lives in `.claude/docs/adr/`)
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `adr-0015-current-actions-list-reconcile`

---

## The Job

ADR-0015's "Current Actions using this pattern" lists under the optimistic-locking upsert and race-condition guard exceptions are manually maintained and have drifted from the code. Reconcile both lists against the current state of `backend/app/Actions/`.

**Known drift (per 2026-05-26 Foundry audit Finding 2):**
- `UpsertThemeAction` uses the optimistic-locking upsert pattern (try-catch on `UniqueConstraintViolationException`) but is **absent** from the list at line 162-167.
- `StoreSetPartsAction` is **listed** at line 167 but the file does not appear in `grep -rln "try {" backend/app/Actions/` — either the file was removed/renamed without updating the list, or the pattern was refactored out.
- `ImportOwnedSetsAction` uses try-catch but its pattern category needs verification — is it optimistic-locking upsert, race-condition guard, or one of the other documented approved exceptions (partial-failure resilience)?

## Scope

### In the Box

- File: `.claude/docs/adr/0015-actions-and-services-separation.md`
- Run the source-of-truth scan: `grep -rln "try {" backend/app/Actions/` to enumerate every Action using try-catch.
- For each Action found, classify which approved-exception category it falls under:
  1. Partial-failure resilience
  2. Optimistic-locking upsert (`UniqueConstraintViolationException` → retry as update)
  3. Race-condition guard (`UniqueConstraintViolationException` → re-throw as domain exception)
- Update both "Current Actions using this pattern:" blocks (line 162-167 and line 179-180) so each Action listed exists in code and each code Action with try-catch is listed under the correct category.
- If any Action's try-catch pattern doesn't fit any of the three documented approved exceptions, that's a separate finding — flag it in the Build Record (do not silently extend ADR-0015's allowed patterns).

### Not in This Set

- No edits to `backend/app/Actions/*.php` — this is a doc-reconcile, not a code-change WO.
- No ADR text changes outside the two "Current Actions using this pattern:" lists (e.g., don't reword the approved-exception explanations themselves).
- No new approved-exception categories — if a code-side try-catch doesn't fit existing categories, surface it as a finding for a separate (future) WO.
- No edits to the architecture tests (`tests/Architecture/*`).
- No bundling with the other 4 WOs filed today.

## Acceptance Criteria

- [ ] Both "Current Actions using this pattern:" lists in ADR-0015 match the output of `grep -rln "try {" backend/app/Actions/` — every listed Action exists; every grep-found Action is listed under the correct category.
- [ ] `UpsertThemeAction` appears in the appropriate list (very likely the optimistic-locking upsert block).
- [ ] `StoreSetPartsAction` either still exists in code (re-verify and keep in list) or is removed from the list with a one-line note in the Build Record explaining the resolution.
- [ ] `ImportOwnedSetsAction`'s try-catch category is classified and either added to the appropriate list or flagged as not-fitting in the Build Record.
- [ ] Build Record records the full inventory: every Action with try-catch, its category, and whether the ADR list was correct before the WO.
- [ ] Casebook Standing Suspicion row for `[Foundry] ADR-0015 "Current Actions" list maintenance` updated by the Steward post-merge.
- [ ] Casebook Methodology Note row for `Foundry gauntlet run after new Action is added with try-catch` referenced as the standing check that should have caught this earlier (no edit needed; the check already exists — this WO is a one-time reconcile, not a process change).

## References

- ADR: [`0015-actions-and-services-separation.md`](../../docs/adr/0015-actions-and-services-separation.md) lines 162-167, 179-180.
- Audit: [`2026-05-26-foundry-pulse-refresh`](../audits/2026-05-26-foundry-pulse-refresh.md) — Finding 2 (low).
- Casebook (Foundry) Standing Suspicion: `[Foundry] ADR-0015 "Current Actions" list maintenance`, first noticed 2026-05-26.
- Pulse: Foundry Tech Debt row (Low — documentation drift).
- Source command (use this verbatim in the Build Record): `grep -rln "try {" backend/app/Actions/`

## Notes from the Issuer

Smallest of today's 5 WOs by code/test volume — it's a doc edit informed by a 7-Action grep result. Filed at `When-convenient` priority because it doesn't gate any behavior; it just keeps the ADR's documented list honest. If the Brickwright finds a try-catch that doesn't fit any existing approved-exception category, that's the most interesting outcome — it would surface either a new pattern that should be approved (separate ADR amendment) or an Action that's bending the rules (separate Foundry audit).

Doc-only diff under `.claude/`. PrePushPermitGate inactive (no `backend/` or `frontend/` paths). ADR-0028 uniform-rule applies via convention; close in work commit since the gate doesn't fire.

---

**Status:** Open
**Build Record:** _to be filled when filed_
