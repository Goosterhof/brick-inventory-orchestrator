# Building Permit: War-Room oxfmt Template Adoption

**Permit #:** 2026-04-23-oxfmt-template-adoption
**Filed:** 2026-04-23
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

The war room has standardized an oxfmt configuration (`war-room/templates/oxfmt.json`) across all territories. Six territories have already adopted it today — fs-packages (#50), the lab orchestrator (#89), and each of the five lab experiments (Gatekeeper, War Table, Parlour, Smokestacks, Crucible). Brick & Mortar is the seventh. Replace the current `.oxfmtrc.json` with the canonical template and reformat the frontend accordingly.

## Scope

### In the Box

- Replace `.oxfmtrc.json` with a byte-identical copy of `war-room/templates/oxfmt.json` — **clean template, not the heavily-commented JSONC version** (CEO direction: uniformity across territories, comments reproduced only oxfmt docs).
- **Update `CLAUDE.md` Building Code section** to reflect `singleQuote: true` — the prior text said "double quotes only (single quotes are a code violation)," which becomes instantly false once the new config lands. Per war-room doctrine's _doctrine propagation check_: if a deployment changes patterns documented in the territory's CLAUDE.md, the deployment includes the CLAUDE.md update. CEO ratified this scope addition after the CFO surfaced the conflict mid-permit.
- Run `npm run format` to reformat the entire frontend under the new config.
- **Teach `TestGuardReporter` to double its thresholds under `coverage.enabled`** — the gauntlet surfaced that the Test Guard fires on `test:coverage` at files that don't trip it under `test:unit`, because coverage instrumentation adds ~2x on top of the full-suite load the 2000ms threshold was originally calibrated against. The sibling `CollectGuardReporter` already has this coverage-mode doubling. CEO ratified the scope addition on the grounds that the reformat exposed (did not cause) the gate's tightness, and A was the doctrine-propagation path — if the reformat's gauntlet reveals a downstream gate we have to update, we update it in the same PR.
- Land as four commits for clean `git blame`:
    1. Config swap + CLAUDE.md Building Code update (`.oxfmtrc.json` and `CLAUDE.md`; permit itself rides here)
    2. `TestGuardReporter` coverage-mode thresholds (logic change only, pre-reformat style — quote flip lands in commit 3)
    3. Mechanical reformat (all other files, incl. any husky-regenerated component-registry drift; the quote flip on `test-guard-reporter.ts` also lands here)
    4. `.git-blame-ignore-revs` pointing at (3)
- Verify the full Quality Gauntlet passes locally.
- File a construction journal at `.claude/records/journals/2026-04-23-oxfmt-template-adoption.md`.

### Not in This Set

- **No behavioral changes.** The reformat is mechanical — indent (already 4-space), quote style (double → single), bracket-spacing semantics (unchanged — already false), import group ordering (unchanged — already types-before-values), and arrow-paren/whitespace-sensitivity settings (already matching template). The only active _policy_ shift is `singleQuote: false → true`.
- **No sovereignty adjustments.** Brick & Mortar's accountability system (permits, journals, evaluations) remains authoritative for local work. This permit is an instance of it, not a replacement.
- **No changes to Husky hooks or lint-staged config.** The pre-commit chain stays as-is; if the component-registry regenerator emits different bytes under the new format, those bytes land in commit (2).

## Acceptance Criteria

- [ ] `.oxfmtrc.json` matches `war-room/templates/oxfmt.json` byte-for-byte.
- [ ] `CLAUDE.md` Building Code quote line reflects `singleQuote: true`.
- [ ] `TestGuardReporter` doubles its thresholds when `vitest.config.coverage.enabled` is true (mirrors `CollectGuardReporter`).
- [ ] `npm run format:check` — clean.
- [ ] `npm run lint --type-aware` — no _new_ errors (pre-existing baseline drift documented, not introduced).
- [ ] `npm run lint:vue` — pass.
- [ ] `npm run type-check` — clean.
- [ ] `npm run knip` — no _new_ findings.
- [ ] `npm run size` — within budget.
- [ ] `npm test` (or equivalent — adapt to present scripts) — all pass.
- [ ] `npm run build` — all three apps (families, admin, showcase) build.
- [ ] Four commits on branch, pushed, PR open.
- [ ] `.git-blame-ignore-revs` exists at frontend root and references the reformat commit.
- [ ] Construction journal filed.

## References

- War Room Template: `war-room/templates/oxfmt.json`
- Precedent PRs: script-development/fs-packages#50 (public package — published source), plus six prior adoptions in sibling territories (PR refs redacted for showcase posture).
- Related Permit: none — this is a first-of-kind for Brick & Mortar.
- War Room Context: Part of the war-room-wide oxfmt template rollout campaign (2026-04-23). Three additional sibling-territory cascades scheduled to follow.

## Notes from the Issuer

**Why file a permit for a "config tweak."** The firm's rule exempts config tweaks. Strictly read, this _is_ one — a single `.oxfmtrc.json` change. But it propagates a mechanical reformat across the entire frontend. The General's call is that the permit system exists precisely so a change like this is announced and contextualized for future architects reading `git log` or blame. The cost of filing is low; the benefit is discoverability of _why_ every file's quote style changed on 2026-04-23.

**Why the clean template over the commented JSONC.** The current `.oxfmtrc.json` reproduces oxfmt's own documentation in ~200 lines of comments. It is legible, but the comments contain no Brick & Mortar-specific rationale — they restate upstream defaults. The CEO directed: clean template. If future readers want rationale, the CLAUDE.md ADR Projections section is the right home for it ("we follow `war-room/templates/oxfmt.json`; see war-room doctrine principle #7").

**Husky component-registry pre-commit side-effect.** The frontend's pre-commit hook regenerates `src/shared/generated/component-registry.json` and stages it. If that file's bytes differ under the new format, the Architect bundles the regenerated file into commit (2) — same mechanical pass, keeps the split of intent clean (config ≠ mass reformat).

---

**Status:** Complete
**Journal:** [`.claude/records/journals/2026-04-23-oxfmt-template-adoption.md`](../journals/2026-04-23-oxfmt-template-adoption.md)
**PR:** [Goosterhof/lego-storage-frontend#194](https://github.com/Goosterhof/lego-storage-frontend/pull/194)
