# Shipping Order: Monorepo Migration — Absorb Backend into Baseplate

**Order #:** 2026-05-17-monorepo-migration
**Filed:** 2026-05-17
**Issued By:** CEO
**Assigned To:** Head Sorter (orchestrator-level execution; warehouse cross-references this permit so the Pre-Push Permit Gate finds it)
**Priority:** Standard

---

## The Shipment

The Baseplate is absorbing the standalone backend repo via `git subtree add --prefix=backend` so that `backend/` becomes a tracked subdirectory of `brick-inventory-orchestrator`. The standalone repo will be archived after deploy reconfig is verified. This permit exists at the warehouse so the Pre-Push Permit Gate (ADR-0013) accepts pushes from the `chore/monorepo-migration` branch in the monorepo end-state.

## Scope

### In the Crate

- Subtree-merge `Goosterhof/brick-inventory-backend` into `backend/` of the orchestrator (history preserved).
- Delete the `post-install-cmd` block in `backend/composer.json` so CaptainHook does not auto-install hooks into the parent `.git/hooks/` directory.
- Update `backend/CLAUDE.md` Pre-Commit Gauntlet and Pre-Push Gauntlet sections to note that hooks are dispatched from the root, while gauntlet contents (`lint:test → phpstan → deptrac → test:arch`, then `PrePushPermitGate → composer test`) are unchanged.
- Move `backend/.github/workflows/ci.yml` → orchestrator `.github/workflows/backend-ci.yml` with widened path filters (Makefile, docker-compose, scripts/, .env.example) and `defaults.run.working-directory: backend`.
- Move `backend/.github/dependabot.yml` → orchestrator `.github/dependabot.yml` (composer entry pointed at `/backend`).
- Delete the now-empty `backend/.github/` after the moves.

### Not on This Pallet

- Modifying any backend `app/`, `database/`, `routes/`, `tests/`, or other source code. Backend internals are untouched.
- Modifying `backend/captainhook.json` — the gauntlet contents stay exactly as they are; only the invocation path changes (via root dispatcher).
- Modifying ADRs, journals, or other permits.
- Railway deployment configuration (handled at orchestrator level, Phase 0).

## Acceptance Criteria

- [ ] `backend/` is a plain subdirectory of the orchestrator after `git subtree add`, with full pre-merge history reachable via `git log` and `git blame`.
- [ ] `backend/composer.json`'s `post-install-cmd` block is removed.
- [ ] `backend/CLAUDE.md` Pre-Commit / Pre-Push Gauntlet sections describe the root dispatcher flow.
- [ ] `backend/.github/` is removed; backend-ci.yml lives at orchestrator root with path filters covering `backend/**`, `docker/backend.Dockerfile`, `docker-compose*.yml`, `Makefile`, `scripts/**`, `.env.example`.
- [ ] Root `.github/dependabot.yml` lists `composer` ecosystem with `directory: /backend`.
- [ ] Pre-push from the orchestrator monorepo with backend files in the range invokes `PrePushPermitGate` (via the root dispatcher → `cd backend && vendor/bin/captainhook hook:pre-push`) and the gate matches this permit by slug.

## References

- Migration Plan: `docs/monorepo-migration-plan.md` in the orchestrator (sovereign blueprint)
- Decision: ADR-0013 (Pre-Push Permit Gate)
- Related Permit: `frontend/.claude/records/permits/2026-05-17-monorepo-migration.md` (the Plate's side of the same migration)

## Notes from the Issuer

This is a one-time absorption. The standalone `brick-inventory-backend` repo will be archived after Phase 6 of the migration plan, tagged `pre-monorepo-merge-2026-05-17` as the historical anchor. No backend source code moves; the warehouse floor plan does not change. The Logistics Director should evaluate the migration plan revision and the dispatcher implementation as those are the load-bearing changes on this side.

---

**Status:** Completed
**Shift Log:** _to be filed at orchestrator level after Phase 5 verification_
