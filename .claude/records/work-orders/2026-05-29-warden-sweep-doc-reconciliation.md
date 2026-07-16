# Work Order: Cross-Wing — Doc/Manual Drift Reconciliation (Sweep Low Findings)

**Work Order #:** 2026-05-29-warden-sweep-doc-reconciliation
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Steward-led (doc territory) — Brickwright for the `.oxlintrc.json` config item
**Wing:** Cross-wing (Atrium)
**Priority:** Low
**Branch slug (for PrePushPermitGate):** `warden-sweep-doc-reconciliation`

---

## The Job

The sweep surfaced a cluster of doc-vs-reality drifts that are corrections, not engineering. Per the audit's Steward Evaluation these fold into a Steward doc/manual pass. Bundled here so they are tracked rather than lost. One item (the dead oxlint override) is a config edit for the Brickwright.

## Scope

### In the Box

**Gallery manual (`frontend/CLAUDE.md`):**
- **G-doc-1** (medium): structure tree + Services convention describe http/router/loading/toast/translation as local factories — five are now `@script-development/fs-*` package imports; only `auth/` + `sound.ts` remain local. Correct the Materials/Services sections and structure tree.
- **G-doc-2** (medium): Linting Standards documents a singleton exemption for `src/shared/services/storage.ts`, a deleted file (migrated to `@script-development/fs-storage`). Remove the bullet. **Brickwright:** remove the dead per-file override at `frontend/.oxlintrc.json:227` (matches nothing).
- **G-doc-3/4/5** (low): Husky listed as a dependency it isn't; `shared/helpers` list stale (lists removed `copy`, omits `bricklinkWantedList`); undocumented `sound.ts` + `useBrickPickup.ts`.
- **G-arch-2** (low): `lint-vue-conventions.mjs` / `.oxlintrc.json` messages cite stale pre-merger ADR numbers (ADR-001/002/003/005/010) — reconcile to the consolidated sequence.

**Foundry manual (`backend/CLAUDE.md`):**
- **F-doc-2** (low): "4 custom war-room rules" — 5 are registered (2 inert against an absent `AuditLog` model). Confirm intent with the package owner, then correct the count.
- **F-doc-3** (low): Exceptions section documents 5 of 11 rendered mappings — add the 6 omitted (409 duplicate import, 422 self-removal, 422 invalid invite, 404 user-not-in-family, 404 invite-not-found, 502 invalid-API-response).

### Not in This Set

- Pulse edits (Steward applies those directly in the next Pulse pass).
- Any behaviour change — these are documentation/config corrections only.

## Acceptance Criteria

- [ ] Gallery + Foundry manual drifts above corrected.
- [ ] Dead `.oxlintrc.json:227` override removed (Brickwright); Gallery lint still green.
- [ ] Stale pre-merger ADR numbers in lint config messages reconciled.
- [ ] F-doc-2 "4 vs 5 rules" confirmed with package owner before editing the count.
- [ ] Build Record (or Steward note) filed recording the corrections.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — Doc Drift table + low-severity observations

---

**Status:** Migrated to Kendo — BIO-0010 (2026-07-16). File frozen as archive; live tracking on the board.
