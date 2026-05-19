# The Brickworks — Meeting Minutes

_Board meeting notes between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-05-19 — Brickworks Merger Execution (Phases 1–8 + Closeout)

### Decisions

- **Brickworks vocabulary locked**: The Steward / Brickwright / Quality Warden / Pattern Master for personas; Work Order / Build Record / Audit for artifacts; Foundry / Gallery / Atrium for places. Lab's trades-vocabulary alternative declined by CEO.
- **Phase 0.5 + 1 bundled in one PR**: vocabulary lock and the root CLAUDE.md identity rewrite ship together since the rewrite uses the locked vocabulary.
- **Branch-slug discipline**: every multi-phase PR branches as `phase-N/form-the-brickworks` so the slug after the last `/` matches the umbrella Work Order and `PrePushPermitGate` accepts the >threshold push without per-phase sub-permits.
- **Agent graduation logs split per wing**: Brickwright and Quality Warden each ship with two companion files (`-foundry-graduation.md` and `-gallery-graduation.md`) rather than one merged graduation log. Keeps wing-irrelevant learnings out of the wrong wing's dispatch.
- **`adr-interrogator` rewritten neutral**: rather than picking a winner between BE and FE framings, wrote a fresh Brickworks-flavored version. FE's Devil's Court (re-interrogation of accepted ADRs under frequency/threshold signals) preserved; BE version lacked it.
- **Cross-wing record collisions resolved via `-foundry`/`-gallery` suffixes**: 8 permits + 5 journals had identical slugs across both surfaces because the underlying work was cross-wing. Both versions preserved; zero data lost. 3-way collision for `2026-05-17-monorepo-migration` keeps the root copy unsuffixed (Atrium-level) and adds wing suffixes to the BE/FE copies.
- **ADR-0015 compliance restored, not violated**: the laboratory exemption was always granted to brick-inventory as a whole; the pre-monorepo split into two sovereign sequences was a structural artifact, not doctrine. Phase 5 consolidation restores the single-sovereign-sequence shape ADR-0015 already envisions.
- **Phase 5 hard gate enforced as two commits in one PR**: mapping table + dry-run diff commit (`33a2b0b`) landed before the rewrite execution commit (`a308729`). Made the gate auditable rather than aspirational.
- **Phase 7 ships as three independently revertable commits**: 7a (Foundry rewrite), 7b (Gallery rewrite), 7c (surface deletions). If the merged agents prove inadequate, reverting just 7c restores the surface fallback without losing the wing-manual rewrites.
- **Substantive agent verification deferred from Phase 2 to fresh-session test**: the harness cannot dispatch newly-written agents mid-session. Phase 7's PR body documents the recovery path if the merged Brickwright / Quality Warden / Pattern Master fail on real dispatch.
- **Late status flip via separate PR (#71)**: per ADR-0028's protocol, Work Order `Status:` flips to `Completed` happen AFTER the closing Build Record's PR merges, not when it's filed locally. Keeps the documented `--no-verify` escape hatch from getting eroded by routine close-out pushes.

### Notes

- **Two-pass sentinel substitution**: Phase 5's ADR renumbering had cyclic conflicts (BE `0011 → 0001` collides with `0001 → 0013`). Single-pass `sed` would cascade incorrectly. Solved by writing each old ID to a unique sentinel first, then expanding sentinels to new IDs. Pattern worth keeping for any future bulk rename with overlapping source/target sets.
- **Hooks that `cd` must anchor via `git rev-parse --show-toplevel`**: Phase 3's auto-format-on-commit hook caught its own bug on the first commit from a `backend/` cwd (left over from a `cd backend && php artisan key:generate`). Productive friction — the hook failed loud rather than format-nothing silent. Same anchoring applied to `check-formatting.sh`.
- **Frontend CI's commitlint only fires when `frontend/**` files change**: Phase 3's PR initially failed commitlint on sentence-case "Phase 3 —" subject. PRs #62/#63/#64 had passed because they hadn't touched FE paths. Going forward in the merger every PR touched both wings, so commitlint fired consistently and no further violations occurred. Pattern: pre-emptively normalize commit-subject case from the first phase even if early phases skip wing CI.
- **`oxfmt` ignore-list interacted badly with `lint-staged` glob**: `frontend/.oxfmtrc.json` listed `CLAUDE.md` in `ignorePatterns` (legacy from when the pre-merger manual had wide tables). Phase 7b's new clean tables triggered `oxfmt` to error with "Expected at least one target file" when lint-staged passed the ignored target. Resolved by removing the ignore — `oxfmt`'s only changes to the new manual were cosmetic column-width padding.
- **Pre-move authorship signal was already destroyed**: Phase 4 spec asked to capture a `git shortlog -sn` artifact before the records move. The subtree merge in PR #28 had already collapsed authorship into a single author; the bulk move could not degrade a signal that was already lost. Filed the finding as the artifact rather than pretending otherwise. Per-file `git log --follow` still traces history through both renames.
- **Foundry `learnings.md` was a placeholder, not substance**: the merge had to pick FE because BE had no real content. Foundry section explicitly notes the placeholder origin and points readers at `backend/CLAUDE.md` and the Foundry graduation log until Build Records start filing fresh Foundry learnings.
- **War-room ADR refs left untouched throughout Phase 5**: `War Room ADR-0019` annotations in `ModelArchitectureTest.php` and the war-room ADR list in root `CLAUDE.md` line 87 reference a separate sovereign sequence at `adrs.script.nl`. BIO renumbering doesn't touch them.
- **W-4 ADR-0021 collision turned out historical, not in-flight**: the phpstan-warroom-rules adoption was completed pre-Phase-4 (per the Foundry Pulse 2026-05-01 entry). The renamed file's body retains old vocabulary as a snapshot of when it was filed; no subsequent records reference it under new vocabulary. No drift action required.
- **Visibility gate clean across every phase**: zero genuine deny-corpus hits despite Phase 6 being flagged as the highest-FE-source-concentration phase. All `script-development` hits were `@script-development/<package>` npm imports, covered by the explicit allow-exception.
- **Wing manuals halved in size**: backend/CLAUDE.md 508 → 291 lines; frontend/CLAUDE.md 454 → 263 lines. Persona content, Operations Protocol, Dispatch Report, Rebuttal/Counter-Filing/Graduation protocols, and ADR ledger table all moved to root/agent-files. Wing manuals are now focused operational reference.

### Action Items

- [ ] CEO: review the closing Build Record's BE/FE Divergences Resolved drift log; append the Steward Evaluation section (training proposal dispositions, overall assessment, notes for the builder)
- [ ] CEO: schedule the war-room follow-up missions — Adjutant for registry refresh, General for briefing refresh + war-room CLAUDE.md line 20 + adr-governance.md line 261 edits
- [ ] CEO: fresh-session substantive verification of `Agent(subagent_type=brickwright)`, `quality-warden`, `pattern-master` against small real tasks in each wing (deferred from Phase 2; surface fallbacks now deleted as of #69)

### Open Questions

- Whether the per-wing graduation log split should be folded back into a single Brickwright log once enough cross-wing learnings have surfaced — currently kept split because Foundry-Mockery learnings don't fire in the Gallery and Gallery-JSDOM learnings don't fire in the Foundry, but the split adds bookkeeping overhead

---

## 2026-05-19 — PR triage session: war-room + dependabot batch

### Decisions

- **Merge order strategy**: war-room PRs first (smaller, structural), then dependabot in two passes — backend first (independent of frontend lockfile), then frontend serially because all 8 frontend bumps touch `package-lock.json`. Backend protection is `strict:false`, so siblings don't go stale, but file-level lockfile conflicts still force serial frontend merges.
- **fs-dialog 0.2.0 spec adaptation**: keep `shallowMount` (arch-test enforces unit tests must not use `mount`). Fix is unstubbing `Suspense: false` and `DemoDialogContent: false` by name so the inline component renders. Rejected alternative: switch to `mount` — fails `mount boundary enforcement` arch-test.
- **fs-http 0.3.0 sibling bumps**: ship `fs-loading 0.1.0 → 0.1.2` and `fs-adapter-store 0.1.4 → 0.1.6` in the same commit. The dependabot single-package bump can't resolve because the old siblings still pin peer `fs-http ^0.1.0`. Filed as one combined commit on the dependabot branch rather than a separate manual PR — keeps the dependabot PR's identity.
- **PRs I modify lose dependabot rebase**: once a user commit lands on a dependabot branch, `@dependabot rebase` refuses ("PR has been edited by someone other than Dependabot"). Manual `git rebase origin/main && git push --force-with-lease` is the path.

### Notes

- **fs-dialog 0.1.0 vs 0.2.0 stubbing difference**: source-diff shows 0.1.0 caches one vnode per dialog (`dialog.node`) and replays it every container re-render; 0.2.0 calls `dialog.render()` per-tick, creating fresh vnodes. The fresh-render path causes `shallowMount` to stub the inline `DemoDialogContent` component where the cached-vnode path didn't. Suspense wrapper is in both versions (not the regression's cause). Root cause is the vnode-cache → fresh-render change interacting with `@vue/test-utils`'s shallow stub walk.
- **Umbrella `gate` workflow gap on long-lived dependabot PRs**: gate landed in PR #57 on 2026-05-18; dependabot PRs filed on 2026-05-17 only ran the old `ci`/`e2e` workflows. Branch protection requires `gate`, so they showed mergeable: BLOCKED even with `ci:SUCCESS, e2e:SUCCESS`. A rebase re-fires CI under the new workflow shape.
- **commitlint `--from base.sha` trap on stale PRs**: `.github/workflows/frontend-ci.yml` uses `${{ github.event.pull_request.base.sha }}` as the lint range start. On a PR whose dependabot rebase hasn't refreshed `base.sha`, that SHA stays at the original branch-point — for our 2026-05-17 dependabot PRs that was the monorepo migration commit (PR #28). The range then includes ~1500 historical commits absorbed by the subtree merge, some with header-length or subject-case violations. Manual rebase + force-push updates `base.sha` to current main HEAD and the range collapses to PR-only commits. War-room PRs and PRs that took dependabot's rebase don't hit this because their `base.sha` was refreshed.
- **wait-e2e action flake on PR #73**: `lewagon/wait-on-check-action@v1.3.4` hit a transient `rubygems.org` network failure fetching `concurrent-ruby-1.2.2.gemspec.rz`, exited 17 and the umbrella `gate` aggregator reported FAIL because `E2E=failure`. The actual `e2e` job from the E2E Tests workflow completed SUCCESS ~3 min later. A `gh run rerun --failed` cleared it. Worth knowing the failure shape if it recurs.
- **Dependabot's auto-supersession is helpful but silent**: #37 closed in favor of #75 (3-update group vs 2-update), #40 closed because vitest/browser-playwright was up-to-date after #43 landed, #42 closed for the same reason. The closure happens on receipt of `@dependabot rebase` when dependabot decides the PR is no longer the right way to express the update.

### Action Items

- [ ] CEO: file a follow-up to fix the commitlint `--from` range in `.github/workflows/frontend-ci.yml` so long-lived dependabot PRs don't trip on historical commits. Options: switch to `--from $(git merge-base HEAD ${{ github.event.pull_request.base.sha }})` with `--first-parent`, or use `head_sha` baselines, or scope to commits that touch `frontend/**`.
- [ ] Steward: monitor whether the `vnode-cache → fresh-render` change in fs-dialog 0.2.0 affects other places that import fs-dialog (only DialogServiceDemo at the moment — the Gallery's other dialog consumers all use full `mount` already since they're integration tests).

### Open Questions

- Whether the `mount-boundary` arch-test should grow an explicit allow-list mechanism for cases like DialogServiceDemo — where the inline-defineComponent + shallowMount + Vue 3.5 reactive-vnode interaction makes the rule painful. Today the unstubbing-by-name workaround works; if it stops working on a future Vue or vue-test-utils bump, we'll need to revisit.

---
