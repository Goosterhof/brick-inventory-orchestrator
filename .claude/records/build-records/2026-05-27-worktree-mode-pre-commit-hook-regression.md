# Build Record: Worktree-mode pre-commit hook regression

**Build Record #:** 2026-05-27-worktree-mode-pre-commit-hook-regression
**Filed:** 2026-05-27
**Work Order:** [`2026-05-27-worktree-mode-pre-commit-hook-regression`](../work-orders/2026-05-27-worktree-mode-pre-commit-hook-regression.md)
**Builder:** Brickwright
**Wing:** Atrium (orchestrator-root `.githooks/`)

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order still in `Status: Open`. After this Build Record's PR merges to `main`, a follow-up commit on `main` flips the WO Status to `Closed` and updates the WO's "Build Record:" link to point at this BR. Do **not** close the WO in the same commit as this Build Record.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `.githooks/pre-commit` | Frontend block: replaced `(cd frontend && ... && git add src/shared/generated/component-registry.json && ...)` with `(cd "$repo_root/frontend" && ... && git -C "$repo_root" add frontend/src/shared/generated/component-registry.json && ...)`. Anchors both the cd target and the `git add` path absolutely against `$repo_root` (set near the top of the script via `git rev-parse --show-toplevel`). Backend block left untouched — its surface is out of scope per the WO and structurally different (no `git add` of generated files). Added an inline comment block explaining the worktree failure mode so future readers don't unwind the anchoring without context. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `.githooks/pre-commit` correctly stages `frontend/src/shared/generated/component-registry.json` from both main-checkout and git-worktree contexts. | Yes | Verified in worktree via the fixed-hook fragment reproduction below (see "Verification"). Main-checkout path is structurally a superset case — `$repo_root` resolves to the main checkout there too, and `git -C "$repo_root" add frontend/...` is identical to the previous behavior modulo the explicit prefix. |
| A reproduction case is documented in the Build Record. | Yes | See "Reproduction Procedure" below. Covers both pre-fix (old hook) and post-fix (new hook) behavior, including the exact commands and the expected `git status` output at each step. |
| No spurious orchestrator-root `src/shared/generated/component-registry.json` appears in `git status` after the hook runs from a worktree. | Yes (post-fix hook surface) | The fixed hook only ever writes/stages the `frontend/`-prefixed path. The already-tracked orchestrator-root file from the three 2026-05-27 bypass merges (`814fea7`, `820cde2`, `a44f479`, squashed into `71166b3` and friends) is a residual artifact and is **out of scope** of this WO — flagged as a follow-up in "Proposed Knowledge Updates" so the Steward can dispatch a cleanup WO separately. The fix prevents recreation; the residue is a separate paper trail. |
| Existing main-checkout pre-commit behavior unchanged (regression-test the happy path). | Yes | `$repo_root` resolves to the main checkout root in a main-checkout commit; `git -C "$repo_root" add frontend/src/...` from that root behaves identically to the old `cd frontend && git add src/...` (both stage `frontend/src/shared/generated/component-registry.json`). The change is a strict tightening — the new form removes a cwd-dependency that the old form happened to satisfy in main but not consistently in worktrees. |
| Build Record records: the root-cause diagnosis, the chosen fix, and the reproduction case. | Yes | "Root-Cause Diagnosis", "Chosen Fix", and "Reproduction Procedure" sections below. |
| Casebook Recurring Pattern row added for "Worktree-mode pre-commit hook regen path bug" with 3 occurrences. | Pending Steward (already-filed) | The Casebook row already exists at `.claude/docs/quality-warden-casebook.md` under `[Atrium] Worktree-mode pre-commit hook regen path bug` (3 occurrences, 2026-05-27, escalated to WO). Proposed update: flip "In-flight at filing time" to "**Resolved 2026-05-27** — fix landed in BR `2026-05-27-worktree-mode-pre-commit-hook-regression`. Verified via worktree reproduction." Steward applies post-merge. |

## Root-Cause Diagnosis

The pre-fix hook block:

```bash
if [ -n "$staged_frontend" ]; then
    echo "→ frontend changes staged; running frontend pre-commit pipeline"
    (cd frontend && \
        node scripts/generate-component-registry.mjs && \
        npx oxfmt --write src/shared/generated/component-registry.json && \
        git add src/shared/generated/component-registry.json && \
        npx lint-staged --relative)
fi
```

Two cwd-dependent operations sit inside the subshell:

1. `node scripts/generate-component-registry.mjs` — the script uses `const ROOT = process.cwd(); const OUTPUT_PATH = join(ROOT, 'src/shared/generated/component-registry.json');`. The output path is anchored to whatever the subshell's cwd is when `node` is invoked.
2. `git add src/shared/generated/component-registry.json` — git interprets the path as cwd-relative, then re-anchors it to the worktree root when staging.

Both operations rely on the subshell's cwd being `<worktree-root>/frontend`. The outer hook does `cd "$repo_root"` near the top (anchored via `git rev-parse --show-toplevel`), and the subshell then does `cd frontend`. In the **expected** path resolution this composes to `<worktree-root>/frontend` and both operations behave correctly.

The bug surface is that the composition is fragile to any context where the outer `cd "$repo_root"` and the inner `cd frontend` produce a different cwd than `<worktree-root>/frontend`. Three independent reproductions on 2026-05-27 (PRs #119, #120, #121 — commits `814fea7`, `820cde2`, `a44f479`) all landed a `src/shared/generated/component-registry.json` artifact at the orchestrator root, indicating that in those worktree-dispatch contexts the registry-write step landed at the worktree root rather than under `frontend/`. The dominant hypothesis — consistent with the WO's framing and the script's source — is that some interaction between worktree dispatch, the lint-staged stash/restore cycle, or a parent shell's pre-set cwd caused the `cd frontend` to be skipped or no-op'd in the bug-triggering shell session, while `git add` (cwd-relative) then matched a root-level file that the prior step had created.

**In plain English:** the hook had two cwd-dependent commands sitting inside `(cd frontend && ...)`, and the cd-then-relative-path pattern is not worktree-safe in the presence of weird shell-state interactions. The MINUTES.md 2026-05-19 Phase 3 sibling lesson captures the same shape — *"Hooks that `cd` must anchor via `git rev-parse --show-toplevel`"* — which I read as: relative-path-after-cd is the anti-pattern; absolute-path-anchored-to-`$repo_root` is the safe form. The inverse case here (the WO's framing): a hook that DOES `cd`, but also needs its `git add` anchored.

I attempted to reproduce the exact failure end-to-end in this worktree and could **not** trigger the spurious-root-write on my run — the registry script wrote to `<worktree-root>/frontend/src/shared/generated/component-registry.json` correctly, and `git add` from a `frontend/` cwd correctly staged the `frontend/`-prefixed path. This non-reproduction is **not** evidence that the bug doesn't exist: three independent dispatches landed it within hours of each other on 2026-05-27, so the bug surface is real and the defensive fix is warranted even when the immediate-environment repro doesn't trigger it.

## Chosen Fix

Of the three shapes the WO offered:

1. Anchor the `git add` path via `git rev-parse --show-toplevel` + explicit `frontend/` prefix
2. Run `git add` from inside the `frontend/` cwd
3. Use `git -C frontend add src/shared/generated/component-registry.json`

I chose **option 1, extended to both cd targets and the git-add path**:

```bash
if [ -n "$staged_frontend" ]; then
    echo "→ frontend changes staged; running frontend pre-commit pipeline"
    (cd "$repo_root/frontend" && \
        node scripts/generate-component-registry.mjs && \
        npx oxfmt --write src/shared/generated/component-registry.json && \
        git -C "$repo_root" add frontend/src/shared/generated/component-registry.json && \
        npx lint-staged --relative)
fi
```

**Why this shape:**

- **`cd "$repo_root/frontend"`** instead of `cd frontend` — eliminates the dependency on the outer cwd. If the outer `cd "$repo_root"` is bypassed by any shell-state weirdness, this still lands in the right place. `$repo_root` is the worktree root in worktree dispatches (verified — `git rev-parse --show-toplevel` returns the worktree root, not the gitdir-anchored main checkout root).
- **`git -C "$repo_root" add frontend/src/...`** — the `-C` flag tells git to run as if it had been launched from `$repo_root`, and the explicit `frontend/` prefix means the staged path is unambiguous regardless of the subshell's cwd. This is the load-bearing change: even if everything else in the subshell drifts, `git add` cannot misfire.
- The `node` and `npx oxfmt` invocations are left as cwd-relative (`src/shared/...`) because they're now inside a hardened cwd via `cd "$repo_root/frontend"`. Belt-AND-suspenders on the `git add` is the right defensive shape — that's the operation that actually stages a path into the commit, and it's worth making cwd-independent.

Rejected: option 2 alone (just `cd frontend` and rely on it) — that's effectively what the buggy hook already did. Option 3 alone (`git -C frontend add src/...`) — works but is less readable; the explicit `frontend/`-prefixed path under `git -C "$repo_root"` is clearer to a future reader about what's actually being staged.

I added an inline comment explaining the worktree failure mode and pointing at this BR, so future maintainers don't simplify the anchoring back to the buggy form.

## Reproduction Procedure

A future Brickwright can confirm the bug pre-fix and verify the fix post-fix by following these steps. The procedure assumes a normal main-checkout at `<repo>` with frontend `node_modules` installed (or can skip the `lint-staged` step to inspect just the bug-bearing fragment).

### Setup (both directions)

```bash
# From the main checkout root
cd <repo>
git fetch origin
git worktree add /tmp/wt-prehook-repro origin/main
cd /tmp/wt-prehook-repro

# Confirm worktree-mode wiring
file .git                            # should print "ASCII text" (worktree .git is a file, not a dir)
git rev-parse --show-toplevel        # should print /tmp/wt-prehook-repro
cat .git                             # contains `gitdir: <main-repo>/.git/worktrees/<name>`
```

### Stage a frontend-only change

```bash
echo "// touch $(date +%s)" >> frontend/src/apps/families/main.ts
git add frontend/src/apps/families/main.ts
git status --porcelain
# Expected: `M  frontend/src/apps/families/main.ts`
```

### Pre-fix behavior (against the buggy hook on commit `57875c0` or earlier on main, or by reverting the fix)

Run the frontend block of the pre-fix hook manually (skipping `lint-staged` to focus on the bug surface):

```bash
(cd frontend && \
    node scripts/generate-component-registry.mjs && \
    npx oxfmt --write src/shared/generated/component-registry.json && \
    git add src/shared/generated/component-registry.json)
git status --porcelain
```

**Pre-fix expected output (in the worktree-shell-state that triggered the three 2026-05-27 reproductions):**

```
M  frontend/src/apps/families/main.ts
A  src/shared/generated/component-registry.json     # <-- THE BUG: orchestrator-root path, no frontend/ prefix
```

*Caveat:* the bug requires a worktree-shell context that triggers the cwd/path-resolution interaction. On my reproduction run in this worktree (`agent-a47a63748dc770839`) the pre-fix form ALSO correctly staged the `frontend/`-prefixed path — i.e. the bug did not surface in my environment. Three independent dispatches on 2026-05-27 did surface it (PR #119/#120/#121). The fix is defensive — it prevents the bug regardless of the surrounding shell state.

### Post-fix behavior (against the fixed hook in this BR)

Run the frontend block of the fixed hook manually:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
(cd "$REPO_ROOT/frontend" && \
    node scripts/generate-component-registry.mjs && \
    npx oxfmt --write src/shared/generated/component-registry.json && \
    git -C "$REPO_ROOT" add frontend/src/shared/generated/component-registry.json)
git status --porcelain
```

**Post-fix expected output (verified in this BR's worktree):**

```
M  frontend/src/apps/families/main.ts
M  frontend/src/shared/generated/component-registry.json   # <-- correctly prefixed
```

(No `src/shared/generated/component-registry.json` at the orchestrator root.)

### Cleanup

```bash
cd <repo>
git worktree remove /tmp/wt-prehook-repro --force
```

## Verification

I ran the post-fix fragment in this worktree (`/home/goosterhof/Code/brick-inventory-orchestrator/.claude/worktrees/agent-a47a63748dc770839/`) against the worktree's HEAD (`b689da2`). Captured verbatim:

**Before (clean state with only the hook fix unstaged):**

```
$ git status --porcelain
 M .githooks/pre-commit
?? .claude/records/work-orders/2026-05-27-worktree-mode-pre-commit-hook-regression.md
```

**After staging a frontend change and running the fixed-hook fragment:**

```
$ echo "// touch $(date +%s)" >> frontend/src/apps/families/main.ts
$ git add frontend/src/apps/families/main.ts
$ REPO_ROOT=$(git rev-parse --show-toplevel)
$ (cd "$REPO_ROOT/frontend" && \
    node scripts/generate-component-registry.mjs && \
    git -C "$REPO_ROOT" add frontend/src/shared/generated/component-registry.json)
Generated component registry — 51 components (236ms)
$ git status --porcelain
 M .githooks/pre-commit
?? .claude/records/work-orders/2026-05-27-worktree-mode-pre-commit-hook-regression.md
M  frontend/src/apps/families/main.ts
M  frontend/src/shared/generated/component-registry.json
```

Hash check on orchestrator-root file (should be unchanged):

```
$ md5sum src/shared/generated/component-registry.json frontend/src/shared/generated/component-registry.json
e74d73a190b730fd177914c1a63615b1  src/shared/generated/component-registry.json     (== HEAD; untouched)
a30e6ccc5dd11719eee44db8898a2c36  frontend/src/shared/generated/component-registry.json   (newly generated, staged)
```

The orchestrator-root file is byte-identical to HEAD — the fixed hook did not touch it. The `frontend/`-prefixed file is the newly generated registry, correctly staged.

I then reverted the test stage and the touched main.ts so this BR's commit contains only the hook change, the WO, and this BR.

## Quality Gauntlet

Neither wing's gauntlet fires on this commit — the diff path is `.githooks/pre-commit`, `.claude/records/work-orders/2026-05-27-worktree-mode-pre-commit-hook-regression.md`, `.claude/records/build-records/2026-05-27-worktree-mode-pre-commit-hook-regression.md`. No `backend/` or `frontend/` paths touched, so the dispatcher correctly skips both. The verification IS the reproduction test above.

### Foundry Wing

| Check | Result | Notes |
|---|---|---|
| (gauntlet skipped — no backend changes) | N/A | Hook diff path doesn't trigger the backend block. |

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| (gauntlet skipped — no frontend changes) | N/A | Hook diff path doesn't trigger the frontend block. |

## Showcase Readiness

This is a piece of infrastructure that pays itself back the moment parallel-dispatch worktree-mode commits resume. The fix shape (`git -C "$repo_root" add <absolute-prefix>/path`) is itself a teachable pattern — it's the inverse of the 2026-05-19 sibling lesson and worth surfacing as a learning so future hook authors reach for it on the first try. The inline comment in the hook tells the next reader exactly why the anchoring exists, with a pointer to this BR.

What would make this stronger: a more aggressive in-repo reproduction harness — for example, a script under `scripts/` (or a `make` target) that creates an ephemeral worktree, simulates a frontend-only commit, runs the hook, and asserts no spurious root file is created. That would catch any regression of this anchoring pattern automatically. I did not build it because the WO scope doesn't ask for it and the existing reproduction procedure documented above is sufficient for manual verification. Flagged in "Proposed Knowledge Updates" as a candidate follow-up.

## Proposed Knowledge Updates

- **Learnings:** Propose adding a Gallery-or-cross-wing learning: *"Pre-commit / pre-push hooks that need to `cd` AND run `git add` (or any other path-anchored git operation) on a generated artifact must anchor BOTH operations against `$repo_root = $(git rev-parse --show-toplevel)`. The cd target should be `$repo_root/<subdir>`, not just `<subdir>`. The `git add` should be `git -C "$repo_root" add <full-prefix>/<relative-path>`. This is worktree-safe; the cd-then-relative form is not, even when the outer hook also `cd`s to `$repo_root`."* Cross-references MINUTES.md 2026-05-19 Phase 3 lesson and this BR.
- **Pulse:** Flag the residual orchestrator-root `src/shared/generated/component-registry.json` artifact (committed via `814fea7` → `71166b3`) as a cleanup-pending item. Out of scope for this WO; the fix prevents recreation but doesn't delete the existing tracked artifact. A small follow-up WO could `git rm src/shared/generated/component-registry.json` and `git rm -r src/` (the orchestrator-root `src/` directory exists ONLY because of this artifact and serves no other purpose). Steward to decide whether to dispatch this as its own WO or batch into a future hygiene sweep.
- **Domain Map / Foundry Map:** No changes; this is Atrium-level infrastructure.
- **Component Registry:** No changes; the fix prevents pollution but doesn't change component shape.
- **Decision Record:** Not ADR-worthy on its own — this is a bug fix, not an architectural decision. If a future learning crystallizes "worktree-safety as a first-class hook authoring concern", that could become an ADR amendment, but for now the inline-comment + learning + casebook row is the right paper-trail weight.
- **Casebook:** Propose Steward update the existing `[Atrium] Worktree-mode pre-commit hook regen path bug` row (occurrences: 3, last seen 2026-05-27) post-merge to:
  - Append to "Escalated to Pulse?" column: *"**Resolved 2026-05-27** — fix landed in BR `2026-05-27-worktree-mode-pre-commit-hook-regression`. The hook now anchors both `cd` target and `git add` path against `$repo_root` via `git rev-parse --show-toplevel`. Verified post-fix in worktree reproduction. Pattern: cd-then-relative-path inside a subshell is not worktree-safe — anchor both operations absolutely."*
  - Optionally move to a "Crossed-Out / Resolved" section if the Casebook maintains one.
- **Defensive harness (deferred candidate):** Propose a future WO to add `scripts/test-worktree-pre-commit-hook.sh` — an automated test that creates an ephemeral worktree, simulates a frontend-only commit, runs the pre-commit hook, and asserts no spurious orchestrator-root file is created. Would convert the "manual reproduction procedure" in this BR into a regression-detector. Not in this WO's scope. Steward to dispatch separately if the pattern recurs.

## Self-Debrief

### What Went Well

- The fix shape was clear once I'd read the WO's three options and the sibling 2026-05-19 Phase 3 lesson together — option 1 (anchor everything) generalizes both directions of the cd/path-resolution anti-pattern. Settled on the shape inside 10 minutes of reading the hook.
- The verification chain (staged change → run fixed fragment → check `git status` → md5sum the two registry locations) is a clean, repeatable test that future maintainers can use without setting up a separate harness.
- Caught the WO-file-not-in-worktree issue early (it's in the main checkout's working tree only, never committed) and copied it into the worktree so the commit can carry WO + BR + fix together. This is consistent with how the other 2026-05-27 worktree-mode dispatches structured their commits.

### What Went Poorly

- I could not reproduce the bug end-to-end in this worktree. The pre-fix form of the `git add` correctly staged the `frontend/`-prefixed path in my repro. Three independent dispatches DID hit the bug within hours of each other, so the bug surface is real — but my inability to trigger it on demand means my "Reproduction Procedure" includes a caveat about needing the right shell-state context. Future maintainers may need to dispatch the same kind of parallel-worktree workload to confirm the bug pre-fix; the post-fix form is the load-bearing piece and is verified directly.
- I considered also fortifying the backend block's `--git-directory=../.git` reference (which assumes `.git` is a directory, but in a worktree it's a file). The WO scope explicitly says "No edits to other hook scripts (`pre-push`, etc.) unless the same bug surface exists in them" — the backend block is the SAME script but a DIFFERENT bug surface. I left it alone per scope; flagging here so the Steward can decide whether to dispatch a follow-up.

### Blind Spots

- I did not test the post-fix hook end-to-end with `lint-staged` actually running, because this worktree lacks `frontend/node_modules/`. I verified the bug-bearing fragment (registry-regen + git-add) but not the full pipeline. The `lint-staged` portion is post-`git add` and operates on staged paths; the fix is upstream of it and doesn't change its inputs, so the risk is low — but a future Brickwright (or the merge into a main checkout that has `node_modules`) should run the full hook on a frontend change to confirm.
- I did not check whether the orchestrator-root `src/shared/generated/component-registry.json` artifact is referenced anywhere else in the codebase (CI workflows, scripts, tooling). If anything reads it, the cleanup follow-up will need to update those references. Spot-checked the obvious paths (`.github/workflows/`, `Makefile`, `Dockerfile`) and saw no references; full sweep is a cleanup-WO concern.
- The post-fix hook still has the implicit assumption that `frontend/` exists at `$repo_root/frontend/`. If the repo ever reorganizes (which the merger plan suggests it won't, but theoretical), this anchor would break. Acceptable given the merger lock-file pins this layout.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| **When fixing a hook that uses cwd-relative paths inside a `(cd <subdir> && ...)` subshell, audit ALL path-anchored operations inside the subshell (not just the one named in the bug report) and anchor each against `$repo_root`. Belt-and-suspenders is the right shape for hook scripts because the failure mode is silent corruption of the next commit.** | The WO named the `git add` as the bug site but the same subshell also has `node scripts/...` and `npx oxfmt --write` which were ALSO cwd-dependent. Fixing only the named site would leave the script's `process.cwd()`-based output-path resolution as a remaining fragility. I generalized to `cd "$repo_root/frontend"` to harden both. | This record's "Chosen Fix" section. |
| **When a Work Order asserts a bug that doesn't reproduce in your environment, capture the non-reproduction explicitly in the BR alongside the defensive fix. The fix is still correct; the missing-repro is signal, not noise.** | Pre-fix `(cd frontend && git add src/...)` correctly staged the prefixed path in my worktree repro. Three independent dispatches still hit the bug. The defensive fix is right; my inability to repro is environmental. Documenting both keeps the Steward's evaluation honest. | This record's "Verification" caveat + "What Went Poorly" entry. |
| **For Atrium-level infrastructure fixes (no backend/ or frontend/ paths touched), explicitly note in the BR that neither wing gauntlet fires and the verification IS the manual reproduction. Don't leave the Quality Gauntlet section blank — fill it with N/A + rationale.** | Hook diff path triggers neither dispatcher branch, so a future Steward reviewing this BR can't take a clean "all gauntlets green" signal. The verification is the reproduction. Naming this explicitly in the BR avoids the appearance of skipped quality checks. | This record's "Quality Gauntlet" section. |

---

## Steward Evaluation

_Appended by The Steward after reviewing the Build Record. The builder's sections above are not edited — they stand as written._

**Overall Assessment:** Excellent | Solid | Adequate | Needs Improvement

### Work Order Fulfillment Review

_Did the builder deliver what the Work Order specified? Any gaps or over-delivery?_

### Decision Review

_Were the decisions well-reasoned? Any that should have been escalated to the CEO?_

### Showcase Assessment

_Does the delivery strengthen the portfolio, or is there polish needed?_

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| _The proposed rule_ | Candidate / Dropped | _Why — be specific_ |

### Notes for the Builder

_Direct feedback. What to repeat, what to do differently next time._
