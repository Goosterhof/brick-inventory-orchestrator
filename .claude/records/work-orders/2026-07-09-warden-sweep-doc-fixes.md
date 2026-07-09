# Work Order: Cross-wing doc-drift fixes from the 2026-07-09 Warden sweep

**Work Order #:** 2026-07-09-warden-sweep-doc-fixes
**Filed:** 2026-07-09
**Issued By:** The Steward (dispositions of audit [`2026-07-09-warden-cross-wing-sweep`](../audits/2026-07-09-warden-cross-wing-sweep.md))
**Assigned To:** Brickwright (cross-wing)
**Wing:** Atrium (touches both wing manuals + one lint config)
**Priority:** Standard — but F-arch-1 and G-doc-1 are the audit's two named "cheapest credibility wins"
**Status:** Open
**Branch slug (for PrePushPermitGate):** `warden-sweep-doc-fixes`

---

## The Job

Reconcile the four medium doc-vs-code drifts (plus associated lows) confirmed by the 2026-07-09 cross-wing sweep. In every case the **code is canonical** and the doc is stale — no runtime changes in this box.

## Scope

### In the Box

1. **F-arch-1 (medium)** — `backend/CLAUDE.md` › Controllers: replace the bullet "No `ResourceData` construction — Actions return the shaped data" with the ADR-0021-conformant rule (controllers construct ResourceData via `::from()` and return `->toResponse()`/`->toResponseWithStatus()`; Actions return Models or Result DTOs, never ResourceData).
2. **F-doc-1 (medium)** — `backend/CLAUDE.md` › Exceptions: enumerate all 12 rendered exception→status mappings from `bootstrap/app.php:66-99` (adds CannotRemoveSelf→422, UserNotInFamily→404, InviteCodeNotFound→404, InvalidInviteCode→422, ImportAlreadyInProgress→409, InvalidApiResponse→502, ReportSubmission→502).
3. **G-doc-1 (medium)** — `frontend/CLAUDE.md` › Materials table: `JSDOM` → `happy-dom`.
4. **G-doc-2 (medium)** — `frontend/CLAUDE.md` › Blueprint Room + Services: reconcile `shared/services/` against the actual tree (only `auth/` + `sound.ts` remain locally; http/router/loading/toast/translation are `@script-development/fs-*` packages). Document `sound.ts`.
5. **G-doc-3 + G-arch-2 (low)** — remove the dead `src/shared/services/storage.ts` singleton exemption from `frontend/CLAUDE.md` Linting Standards AND the matching dead override at `.oxlintrc.json:227`.
6. **G-doc-4 (low)** — Blueprint Room `helpers/` comment: drop phantom `copy`, add `bricklinkWantedList`.
7. **F-doc-2 (low)** — `backend/CLAUDE.md` Floor Plan: add `Actions/Feedback/` and the ImportJob/InviteCode/Theme models.

### Not in This Set

- No code-behavior changes (the `.oxlintrc.json` edit removes a dead override matching nothing).
- G-arch-1 (stale ADR numbers in lint messages) — already owned by open WO `2026-05-29-warden-sweep-doc-reconciliation`; execute that WO, don't duplicate here.
- Pulse fixes (G-doc-5/6) — already applied directly by the Steward.

## Acceptance Criteria

- [ ] Each item above verified against its source-of-truth file, not against the audit text.
- [ ] `rg -n "JSDOM" frontend/CLAUDE.md` returns no hits; `rg -n "storage.ts" frontend/CLAUDE.md frontend/.oxlintrc.json` returns no live-exemption hits.
- [ ] The Exceptions block lists 12 mappings matching `bootstrap/app.php` exactly.
- [ ] Both wings' gauntlets green (docs-only, but the `.oxlintrc.json` edit must pass `npm run lint`).
