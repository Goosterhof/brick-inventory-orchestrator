# Build Record: Audit Remediation Round 5 — Paper Trail

**Build Record #:** 2026-05-26-audit-remediation-5-paper-trail
**Filed:** 2026-05-26
**Work Order:** [`2026-05-05-audit-remediation-5-paper-trail`](../work-orders/2026-05-05-audit-remediation-5-paper-trail.md)
**Builder:** Brickwright (Foundry)
**Wing:** Foundry (paper trail / ADR)

---

## Work Summary

Archaeology session closing the Medium finding from the 2026-05-05 full sweep audit (Finding 7) — two substantive deliveries shipped without paper trail. Three deliverables filed:

| Action | File | Notes |
|---|---|---|
| Created | `.claude/records/build-records/2026-04-20-medic-cors.md` | Retroactive Build Record for Delivery A (medic/CORS, original commit `2c5ef79`). Documents the three Sapper M5 Medium findings closed, the new `CorsConfigTest` feature test, and the explicit "Filed Retroactively" preamble. |
| Created | `.claude/records/build-records/2026-04-21-dto-input-result-migration.md` | Retroactive Build Record for Delivery B (DTO Input/Result migration, original PR #160 merge `56cd7e9` plus seven constituent commits). The substantive part of the archaeology — Decisions Made section articulates the Input/Result rule by Action usage direction, with the dependency-content consequence derived from the rule. Marker interface retirement, architecture test enforcement, Deptrac layer rewrite, and CLAUDE.md update all covered. |
| Modified | `.claude/docs/adr/0025-computed-resource-data.md` | Appended "Amended 2026-04-21" subsection covering the three rule changes (marker interface retirement, Input/Result namespace split, three-angle `DataTransferObjectPlacementTest` enforcement). Two in-place supersedence notes added inline in the original Decision and Enforcement sections — original prose preserved verbatim, with brief forward-pointers to the amendment. |
| Created | `.claude/records/build-records/2026-05-26-audit-remediation-5-paper-trail.md` | This file — meta Build Record for the archaeology session itself. |
| Modified | `.claude/records/work-orders/2026-05-05-audit-remediation-5-paper-trail.md` | Status flipped `Open → Closed`. The "Shift Log" field at the bottom renamed to "Build Record" (current Brickworks vocabulary) and linked to this record. |

No production code changes. The DTO migration and CORS work are already in the codebase from April 2026; this Work Order documents them retroactively.

## Archaeology Findings — Commit Reachability

The dispatch warned that the WO-referenced commits lived in the standalone backend repo prior to the 2026-05-17 subtree absorption (commit `83c2f28`) and might not be reachable. **Verification: none of the eleven referenced commits are reachable from the orchestrator's history.**

Verification command:
```
for sha in 2c5ef79 6dd9145 8e9cf1d 2cb1dff c16b5eb 8ed25c3 20316b6 f2adae1 56cd7e9 9942d22 6a0cd39; do
  git rev-parse "$sha" 2>&1
done
```
All eleven returned `fatal: ambiguous argument … unknown revision or path not in the working tree.` A follow-up `git cat-file -t` on each also returned `fatal: Not a valid object name`. The subtree absorption was a content collapse, not a history merge — the entire pre-merger backend timeline was flattened into one snapshot commit (`8ec15e8 chore: restock backend with Laravel 13 upgrade, ADR-0020 DTO split, and dep refresh` on 2026-04-21 in the orchestrator's pre-absorption sequence, then later the formal subtree-add at `83c2f28` on 2026-05-17).

**How the archaeology adapted:** the reconstruction relied on the surviving on-disk artifacts as the primary source, with the audit's verbatim characterization of each delivery serving as the secondary frame. Specifically:

- For Delivery A (medic/CORS): inspected `backend/config/cors.php` (current `array_values(array_filter([env('FRONTEND_URL', …), env('FRONTEND_URL_PRODUCTION')], …))` shape), `backend/.env.example` (current production env vars), `backend/routes/api.php` (current `cache.headers:private;max_age=3600` directives on Rebrickable-backed routes), and `backend/tests/Feature/Configuration/CorsConfigTest.php` (current two-`it()` test under the `describe('CORS configuration', …)` block, with `covers(HandleCors::class)`).
- For Delivery B (DTO migration): inspected `backend/app/DataTransferObjects/Input/` (seven domain subfolders), `backend/app/DataTransferObjects/Result/` (five domain subfolders), `backend/tests/Architecture/DataTransferObjectPlacementTest.php` (three Pest `test()` blocks for the three enforcement angles), `backend/deptrac.yaml` (sibling `InputDTO`/`ResultDTO` leaf layers with divergent allowed-deps), `backend/app/Http/Resources/ComputedResourceData.php` (current `@template TSource of object`, no marker interface), and `backend/CLAUDE.md` ("DTOs — Input vs Result" section).
- A `git grep` for `ResourceDataSourceInterface` across `backend/app/` and `backend/tests/` returned zero hits — confirming the marker retirement.

**Map mismatch caveat — also flagged in the dispatch:** the WO referenced `docs/adr/0010-computed-resource-data.md`. That path **does not exist** in the orchestrator. ADR renumbering during the Brickworks Phase 5 merger (Work Order `2026-05-19-phase-5-adr-renumbering`) renumbered the original Foundry ADR-0010 to ADR-0025 and moved it into the consolidated `.claude/docs/adr/` sequence. The amendment was therefore filed against `.claude/docs/adr/0025-computed-resource-data.md`, which is the same decision document under the post-merger numbering.

## The Input/Result Rule — As Articulated

The WO calls this out as the most important section of the DTO migration Build Record. The rule, articulated verbatim in `2026-04-21-dto-input-result-migration.md` § Decisions Made #1:

> **DTOs are split by usage direction at the Action boundary. `App\DataTransferObjects\Input` is what the Action receives; `App\DataTransferObjects\Result` is what the Action returns.**

The rule is about direction, not content. The Input/Result namespace dictates which side of the Action boundary the DTO crosses. The dependency-content footnote (Input may not reference Models; Result may carry `Collection<Model>`) is the rule's **consequence**, enforced separately at the Deptrac layer, not the rule itself.

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `2026-04-20-medic-cors.md` filed, dated 2026-04-20, reconstructs Sapper M5 Medium #1/#2/#3 and the new feature test | Yes | Filed at `.claude/records/build-records/2026-04-20-medic-cors.md` (note path — Brickworks vocabulary translation: `journals/` → `build-records/`). |
| `2026-04-21-dto-input-result-migration.md` filed, dated 2026-04-21 (PR #160 merge), reconstructs the seven-commit migration with Decisions Made capturing the Input/Result naming rule | Yes | Filed at `.claude/records/build-records/2026-04-21-dto-input-result-migration.md`. |
| ADR-0010 contains "Amended 2026-04-21" subsection covering marker interface retirement, Input/Result namespace split, `DataTransferObjectPlacementTest` enforcement | Yes | Filed against the renumbered `.claude/docs/adr/0025-computed-resource-data.md`. All three rule changes covered, with a section explaining **why** the marker became redundant (the longer answer at the end of the amendment). |
| Amended ADR-0025 is internally consistent — no remaining text describes `ResourceDataSourceInterface` as a current requirement | Yes | Two in-place supersedence notes inserted: (1) at the top of the "Two sibling abstract classes" subsection, supersedence flag on the `ResourceDataSource` references; (2) under the Enforcement table, supersedence flag on the marker-implementation row and the `Data → Contract` Deptrac row. Original prose left verbatim per the WO's explicit instruction; the supersedence notes point forward to the amendment. |
| Both retroactive logs include "Filed retroactively" preamble noting original-work date vs. log-filing date | Yes | Each carries an explicit "Filed Retroactively" section at the top, naming the 2026-04-20 / 2026-04-21 shipping date vs. the 2026-05-26 filing date and explaining the subtree-collapse caveat. |
| `composer phpstan` passes (no type errors introduced by ADR text) | Yes | `[OK] No errors` — 339/339 files analyzed, level max. See § Quality Gauntlet below. |
| `composer test:arch` passes | Yes | `107 passed (1860 assertions)` — all architecture invariants intact. See § Quality Gauntlet below. |
| Build record for THIS Work Order filed at `2026-05-26-audit-remediation-5-paper-trail.md` | Yes | This file. |

## Decisions Made

1. **Translate WO vocabulary to current Brickworks terms while building, not retroactively** — The Work Order was filed 2026-05-05 in Stud & Sort Logistics vocabulary (Shipping Order, shift log, journals/, Head Sorter, Logistics Director), two weeks before the 2026-05-19 Brickworks merger consolidated to the current names (Work Order, Build Record, build-records/, Brickwright, Steward). All three deliverable files were written in current vocabulary from the start; the WO itself remains in its filed-at-time vocabulary except for the closing-status edit. This matches the Brickworks discipline of not retroactively editing historical records (AC #5 of the WO is explicit on that point).

2. **File the amendment against the renumbered ADR (0025), not the WO-referenced number (0010)** — The WO referenced `docs/adr/0010-computed-resource-data.md`. That file does not exist. The Phase 5 merger renumbered it to `0025-computed-resource-data.md` under `.claude/docs/adr/`. Filing against the current path preserves the link integrity from the renumbering forward; filing against the WO's stale path would have created a dangling reference. The Build Records both reference ADR-0025 explicitly.

3. **Append supersedence notes inline rather than rewriting the original sections** — The WO's explicit guidance was "the original stays as filed, but the amendment must make clear that this constraint no longer applies … a short note in the original section … is acceptable; rewriting the original sentences is not." I added exactly two such notes: one at the top of the "Two sibling abstract classes" subsection (covering the `ResourceDataSource` / `ResourceDataSourceInterface` references in §Decision), and one under the Enforcement table (covering the marker-implementation row and the `Data → Contract` Deptrac row). Both notes are visually distinct (blockquote italics) and point forward via an anchor to the amendment section.

4. **Write the rule first, then derive the consequence, in the DTO migration Build Record** — The WO's Notes from the Issuer explicitly framed this. The Decisions Made #1 in `2026-04-21-dto-input-result-migration.md` opens with "**The rule, stated as the architecture intends to be read:** DTOs are split by usage direction at the Action boundary." The dependency-content (no-Model-in-Input, may-carry-Model-in-Result) is presented as the consequence, not the rule. The ADR amendment follows the same structure — "rule first, then the consequence" — at the top of its §1.

5. **Read all seven constituent commits' messages from the audit's characterization rather than from `git show`** — Because none are reachable, the reconstruction relied on the audit's verbatim list of commit messages (which the WO transcribed) plus the on-disk artifacts. The commit messages themselves are preserved in both the WO and the Build Record; the diffs are gone but the prose intent survives.

6. **No `--no-verify` bypass needed** — The expected file count (4 new build records, 1 modified ADR, 1 modified WO ≈ 6 files) is well under the 20-files / 500-lines threshold for the pre-push permit gate (ADR-0028). No Steward sign-off for bypass required. The branch is `claude/audit-remediation-5-paper-trail`, slug-aligned with the WO filename.

## Quality Gauntlet

### Foundry Wing

| Check | Result | Notes |
|---|---|---|
| lint:test | Not run | Doc-only edits — no PHP touched. Pre-commit hook routes to backend's gauntlet only when staged paths touch `backend/**`; this PR touches only `.claude/` and `.claude/docs/adr/`. |
| phpstan | Pass | `[OK] No errors` — 339/339 files analyzed at level max. Captured to `/tmp/phpstan.log`. Run from `backend/` cwd. |
| deptrac | Not run | Doc-only edits. |
| test | Not run | Doc-only edits. Pre-push gauntlet would invoke this if the pushed range touched `backend/**`, which it does not. |
| test:coverage | Not run | Same. |
| test:feature-coverage | Not run | Same. |
| mutation | Not run | Same. |
| test:arch | Pass | `Tests: 107 passed (1860 assertions)` — all architecture invariants intact. Captured to `/tmp/test-arch.log`. Run from `backend/` cwd. |

The two gates required by the dispatch (`composer phpstan` and `composer test:arch`) both pass. They are the safety net for the ADR text in case any symbol referenced in the amendment has been renamed or retired in a way the prose missed — `phpstan` would have caught a dangling type reference; `test:arch` would have caught a layer-fence violation introduced by stale prose. Neither fired.

## Showcase Readiness

The archaeology session itself is portfolio-relevant in a small but specific way: a senior architect reading this delivery sees the Brickworks paying down a three-cycle paper-trail debt **with discipline rather than urgency** — the rule was articulated more carefully in the retroactive Build Record than it had been at the time of the original PR, and the ADR amendment closes a specific gap (the marker interface's redundancy) that the original ADR's prose had not yet acknowledged. Retroactive paper trail done well is its own portfolio signal: the institution learned something specific about the decision, not just that the decision was made.

The unflattering corner is the recurring pattern itself — the audit's "third consecutive cycle the same pattern has appeared" wording is the structural finding the Brickworks owes a structural answer to. The structural answer landed in ADR-0028 (pre-push permit gate, 2026-05-05), which is the right shape — making "ship without a Work Order" cost a `--no-verify` and an explicit Steward sign-off. This paper-trail closure does not absolve the misses; it pays the existing debt down while the gate prevents new debt.

## Proposed Knowledge Updates

The Steward dispositions these critically.

- **Learnings — candidate:** "When a Work Order references file paths that predate a renumbering or restructure, verify the current path before editing; the WO's path may be stale but the target document survives under a new name." Triggering context: the WO referenced `docs/adr/0010-computed-resource-data.md`; the current path is `.claude/docs/adr/0025-computed-resource-data.md` after the Phase 5 merger renumbering. The "verify external-state claims" rule (graduated 2026-05-03) covers this in spirit, but specifically calls out file existence, not file path. A narrow specialization for "WO-referenced path vs current path" might be worth promoting if a second instance surfaces.

- **Learnings — candidate:** "Subtree-absorbed commits are not reachable by SHA from the absorbing repo's history; reconstruction must use on-disk artifacts plus prose sources (audit characterizations, WO scope text). The subtree merge is content-only, not history-merging." Triggering context: all eleven WO-referenced SHAs returned `fatal: ambiguous argument`. This is a clean second observation of a reachability gap (the first was in the merger's closing Build Record's drift log on 2026-05-19). Two observations across separate sessions — eligible for graduation if a third confirms it, or if the Steward judges the pattern strong enough on two.

- **Pulse — no updates proposed.** The pulse refresh on 2026-05-05 (sibling Work Order, doc-hygiene) already captured the post-archaeology shape of the warehouse.

- **Decision ledger — no updates.** The amendment lives in the ADR file; the ledger row already points there. The ADR's status remains `accepted` — an amendment evolves, it does not invalidate.

## Self-Debrief

### What Went Well

- **The dispatch's caveats matched reality.** The WO author pre-flagged that (a) the WO used pre-Brickworks vocabulary, (b) the commits might not be reachable post-subtree, and (c) the ADR path might be stale. All three caveats materialized exactly as warned. The dispatch's translation tables made the vocabulary swap mechanical; the reachability check was a 30-second `git rev-parse` loop; the ADR path lookup was a single `find` invocation.
- **Articulating the Input/Result rule "direction first, consequence second" was the right framing call.** The WO's Notes from the Issuer was explicit on this, and writing the Build Record's Decisions Made #1 in that order made the ADR amendment's §1 fall out naturally — both files use the same opening sentence, which keeps the reader's mental model consistent across the two documents.
- **The two-supersedence-note approach kept the original ADR prose intact.** The notes are visually distinct (blockquote italics), short, and forward-pointing to the amendment. A reader following the original Decision section sees the supersedence flag the moment they reach `ResourceDataSource` and knows to scroll to the amendment for the current state. The audit-trail honesty of preserving the original prose verbatim is intact.

### What Went Poorly

- **The original WO assumed standalone-repo commit reachability without flagging it as an assumption.** That is not the Brickwright's gap to fix retroactively — the dispatch warned about it explicitly. But the WO itself was written 2026-05-05, when the subtree-absorption pattern was already known (the absorbing commit was 2026-05-17, two weeks later, and the Foundry had been on the orchestrator's `backend/` path since then). Future WOs that reference pre-absorption commits should carry an explicit reachability caveat.
- **One unverified detail in the medic/CORS Build Record.** The audit lists "5 files changed" for `2c5ef79`; I could account for four files concretely (`config/cors.php`, `.env.example`, `routes/api.php`, the new `CorsConfigTest.php`) and inferred the fifth was most likely `bootstrap/app.php` (for the `cache.headers` alias registration), but the original commit's exact fifth-file identity is not preserved through the subtree collapse. I flagged this explicitly in the Build Record rather than papering over it.

### Blind Spots

- **I did not run `composer deptrac` even though the ADR amendment references new Deptrac edges.** The justification is that the Deptrac config (`backend/deptrac.yaml`) was not edited in this session — the amendment only prose-describes the edges that have been in place since April. But a future Brickwright reading this Build Record might assume the gauntlet was complete because the dispatch listed `phpstan` and `test:arch` as the only required gates. The dispatch's two-gate requirement was right; my note about it is for completeness.
- **I did not cross-check the seven constituent commit messages against the audit's wording.** The WO transcribed them; I used the WO's transcription. If the audit's characterization was slightly off (e.g., the order of commits), the Build Record inherits that error. Mitigation: the commits' content survives in code, and the Build Record's claims about what each commit did are anchored to the on-disk artifacts, not to the commit messages' literal text.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| When a Work Order references file paths or commit SHAs from before a structural change (subtree absorption, renumbering, folder reorganization), verify each reference's current shape **before** starting the work, and record any path-drift or reachability gaps explicitly in the Build Record as CEO-actionable lines. | This Work Order referenced `docs/adr/0010-computed-resource-data.md` (renumbered to `0025`) and eleven SHAs (none reachable). Both were flagged in the dispatch; both required adaptation. The "verify external-state claims" rule covers this in spirit but does not specifically include "WO-referenced paths and SHAs". A narrow specialization to the WO's reference surface would tighten the pre-work check. | 2026-05-26-audit-remediation-5-paper-trail |
| When filing a retroactive Build Record, structure the "Filed Retroactively" preamble as a stand-alone section with three pieces: (a) the original shipping date and provenance (PR, commit SHA), (b) the reason for retroactive filing (which audit finding funded this work), and (c) the sources used to reconstruct (on-disk artifacts, audit characterizations, WO scope text). Retroactive logs without source-disclosure are harder to verify in the next audit. | The two retroactive Build Records filed in this session both carry this three-piece preamble. The next auditor reading them can verify each claim against the cited sources without re-deriving the reconstruction. | 2026-05-26-audit-remediation-5-paper-trail |

---

**Status:** Closed
**Linked Commit:** _to be filled in after commit_
