# Work Order: Laravel 12 → 13 Doc Sweep + Two Low-Severity Drift Fixes

**Work Order #:** 2026-05-20-laravel-13-doc-sweep
**Filed:** 2026-05-20
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (governance + wing manual)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `laravel-13-doc-sweep`

---

## The Job

The Laravel 13 upgrade shipped 2026-04-19 but four governance documents still claim "Laravel 12". Update all four. While in the docs, fold in two LOW-severity housekeeping fixes from the same audit (vocabulary-lock Authority line, Pulse Foundry Overall Health clause) — neither warrants its own Work Order.

## Scope

### In the Box

**Framework version fixes (Finding 2 — medium):**

| File | Line (approx) | Current | Target |
|---|---|---|---|
| `backend/CLAUDE.md` | 15 | `\| Framework \| Laravel 12 \|` | `\| Framework \| Laravel 13 \|` |
| `.claude/docs/foundry-map.md` | 61 | `\| Framework \| Laravel 12 \|` | `\| Framework \| Laravel 13 \|` |
| `CLAUDE.md` (root) | 80 | `The Brick (Laravel 12 API, formerly...)` | `The Brick (Laravel 13 API, formerly...)` |
| `.claude/agents/quality-warden.md` | 16 | `Laravel 12, PHP 8.5, Deptrac boundaries` | `Laravel 13, PHP 8.5, Deptrac boundaries` |

**vocabulary-lock Authority path (Finding 3 — low):**

- `docs/vocabulary-lock.md` line 6 — change `\`.claude/records/permits/2026-05-18-form-the-brickworks.md\`` to `\`.claude/records/work-orders/2026-05-18-form-the-brickworks.md\``. Body content (forward-tense narration) stays as a historical artifact.

**Pulse Foundry Overall Health clause (Finding 4 — low):**

- `.claude/docs/pulse.md` line 23 — remove the parenthetical `(now consolidated into 0001–0029 by Phase 5)` from the "13 coherent BIO sovereign ADRs" sentence, and rewrite the sentence in present-tense referencing the 29-ADR consolidated sequence as current fact. If you re-evaluate Overall Health while editing, update the assessed date to 2026-05-20; otherwise leave the date alone and just fix the sentence.

### Not in This Set

- No code changes — composer.json is already on `^13.0`; this is doc drift only.
- No edits to ADR files, Build Records, or audits (historical record).
- No edits to `MERGER_PLAN.md`, `MERGER_PLAN_REVIEW.md`, `MERGER_PLAN_WAR_ROOM_REVIEW.md` (historical plans frozen at filing).
- No edits to the body of `vocabulary-lock.md` beyond the Authority line path (the future-tense narration is intentional historical preservation).
- No re-write of the Pulse Overall Health section beyond the one stale clause (full Pulse re-evaluation is a separate Warden cycle).

## Acceptance Criteria

- [ ] All four Laravel-12 mentions in the table above are now `Laravel 13`
- [ ] `rg -n 'Laravel 12' backend/CLAUDE.md CLAUDE.md .claude/ docs/` returns no hits in active governance/agent/manual docs (historical files under `docs/MERGER_PLAN*.md` may legitimately retain the term and are excluded)
- [ ] `docs/vocabulary-lock.md` Authority line resolves to `.claude/records/work-orders/2026-05-18-form-the-brickworks.md` (file exists at that path — verify)
- [ ] `.claude/docs/pulse.md` Foundry Overall Health section no longer contains the parenthetical "(now consolidated into 0001–0029 by Phase 5)" mid-sentence; reads as current-state prose
- [ ] No edits outside the five files listed in Scope

## References

- Triggering Audit: [`2026-05-20-post-merger-baseline.md`](../audits/2026-05-20-post-merger-baseline.md) — Findings 2 (medium), 3 (low), 4 (low)
- Laravel 13 upgrade Build Record: `.claude/records/build-records/2026-04-19-laravel-13-upgrade.md` (referenced in Pulse Overall Health as "Laravel 13.7 deprecation cascade")
- Brickworks formation Work Order (the real path for the vocab-lock Authority line): [`2026-05-18-form-the-brickworks.md`](2026-05-18-form-the-brickworks.md)

## Notes from the Issuer

Pure housekeeping. The four Laravel-12 references are surface-level docs that escaped both the Laravel-13 upgrade and the merger's Phase 7 wing-manual rewrite. Awareness exists elsewhere in the codebase (Pulse already mentions "Laravel 13.7 deprecation cascade"), so this is a pure doc-sweep — no risk of behavior change.

The two LOW items are folded in because they're both single-line edits in the same broader category (post-merger doc drift). Doing them as separate Work Orders would be more paper trail than the fixes are worth. If the Brickwright finds the bundle awkward in practice, split into two commits within the same PR — but one Work Order, one branch.

A follow-up Casebook/Training proposal from the audit is: "framework version upgrade Build Records should include a doc sweep step in acceptance criteria" — that's an SOP change, **not** part of this Work Order; the Steward will evaluate that proposal separately.

---

**Status:** Open
**Build Record:** _link to Build Record when filed_
