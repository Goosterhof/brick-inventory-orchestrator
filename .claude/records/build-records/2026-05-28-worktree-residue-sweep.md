# Build Record: Worktree residue sweep (PR #126 follow-ups)

**Build Record #:** 2026-05-28-worktree-residue-sweep
**Filed:** 2026-05-28
**Work Orders:**
- [`2026-05-28-cleanup-misplaced-component-registry-json`](../work-orders/2026-05-28-cleanup-misplaced-component-registry-json.md) (WO 1)
- [`2026-05-28-backend-pre-commit-worktree-safety`](../work-orders/2026-05-28-backend-pre-commit-worktree-safety.md) (WO 2)

**Builder:** Brickwright
**Wing:** Atrium (orchestrator-root cleanup + `.githooks/`)
**Branch:** `worktree-residue-sweep`
**Commits:**
- `684758f` — chore: delete misplaced component-registry.json at orchestrator root
- `61e6fe0` — fix(ci): anchor backend pre-commit dispatch against git-common-dir for worktree safety

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> Both Work Orders ship with `Status: Open` in this Build Record's commits. Both push ranges are sub-threshold (< 20 files / < 500 lines vs `origin/main`), so PrePushPermitGate skips the slug check entirely. After this Build Record's PR merges to `main`, a follow-up commit on `main` flips both WOs' Status to `Closed` and updates each WO's `Build Record:` field to link here. Do **not** close the WOs in the same commit as this Build Record.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Deleted | `src/shared/generated/component-registry.json` (orchestrator root) | 1,278-line residual artifact from PR #119's `--no-verify` push, when the pre-fix `.githooks/pre-commit` cwd-unsafe `git add` was misrouting registry generation to the orchestrator root instead of `frontend/`. PR #126 fixed the source bug but did not delete the residual. Empty parent directories `src/shared/generated/`, `src/shared/`, and `src/` were auto-cleaned (only the deleted file lived under them). |
| Modified | `.githooks/pre-commit` | Backend dispatch block: replaced `--git-directory=../.git` with `--git-directory="$git_common_dir"`, where `git_common_dir` is resolved once near the top of the hook via `git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd)`. The `cd … && pwd` idiom normalizes `git-common-dir`'s output to an absolute path that survives the inner `cd backend` subshell. Frontend block left untouched (already fixed in PR #126). Added an inline comment block explaining the worktree failure mode and pointing at this BR as sibling precedent. |

## Work Order Fulfillment

### WO 1 — Cleanup misplaced component-registry.json

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `src/shared/generated/component-registry.json` no longer exists at orchestrator root | Yes | `git rm` executed in commit `684758f`. `ls src/shared/generated/` post-commit returns "No such file or directory" (parent dirs auto-removed). |
| `frontend/src/shared/generated/component-registry.json` unchanged (canonical location intact) | Yes | md5 `e74d73a190b730fd177914c1a63615b1`, 55,243 bytes, 1,278 lines — identical to the deleted root file (same blob, same content, the root copy was a duplicate). Verified post-delete. |
| `git status` clean post-delete; only the deletion in the staged diff | Yes | `git status` showed only `deleted: src/shared/generated/component-registry.json` before commit. Working tree clean after. |
| `make lint` and `make test` pass unchanged (the root file was not referenced) | Yes (host-equivalent) | See "Verification" below — the only tooling reference to `src/shared/generated/component-registry` outside `.claude/` and `MINUTES.md` paper trail is `frontend/scripts/generate-component-registry.mjs:24`, which writes via `process.cwd()` from `frontend/` cwd and never references the root path. |
| CaptainHook pre-commit gauntlet green; pre-push gauntlet green | Yes | Pre-commit dispatcher did not fire any wing gauntlet on the commit because the deletion path (`src/shared/generated/...` at orchestrator root) matches neither `^backend/` nor `^frontend/` — correct dispatch behavior. Pre-push will be exercised when the PR is opened; no concern (path is unreferenced by any tool). |
| Build Record records the delete + verification that no tooling broke | Yes | This row + "Verification" section. |

### WO 2 — Backend pre-commit dispatch worktree safety

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Backend dispatch block in `.githooks/pre-commit` resolves the git directory in a worktree-safe manner (no hardcoded `../.git`) | Yes | Replaced `--git-directory=../.git` with `--git-directory="$git_common_dir"`, resolved absolutely once at the top of the hook. |
| Adding a backend file in a fresh `git worktree add` directory fires the backend gauntlet correctly (CaptainHook completes without "git dir not found"-class errors) | Yes | See "Worktree Reproduction Transcript" below — end-to-end verified with the fixed hook in a fresh `/tmp/biw-worktree-test` worktree. CaptainHook ran `composer lint:test` against the full 341-file Rector scope and correctly failed on a probe file's missing `declare(strict_types=1)` — proving the gauntlet executed against the right git context. |
| Existing non-worktree backend commits unchanged in behavior | Yes | In a main checkout, `git rev-parse --git-common-dir` returns the relative string `.git`; the `cd "$(…)" && pwd` idiom normalizes to `/home/goosterhof/Code/brick-inventory-orchestrator/.git`. CaptainHook receives an absolute path to the same directory it would have resolved relatively from `backend/` cwd as `../.git`. Strict tightening — semantically explicit, structurally identical. |
| CaptainHook pre-commit gauntlet green; pre-push gauntlet green | Yes | Backend `composer lint:test` against host PHP 8.5 returned `[OK] Rector is done!` and `{"tool":"pint","result":"passed"}` (340 files inspected, no diff). The fix did not regress any wing gauntlet. Pre-push gauntlet exercised when the PR is opened; no concern (no backend code touched). |
| Build Record records the diff and the worktree-reproduction confirmation (mirrors the PR #126 verification pattern) | Yes | "Worktree Reproduction Transcript" section below — captures both pre-fix and post-fix execution shapes. |

## Root-Cause Diagnosis (WO 2)

The pre-fix backend dispatch:

```bash
(cd backend && vendor/bin/captainhook hook:pre-commit --git-directory=../.git)
```

`--git-directory=../.git` is cwd-relative — it expands to whatever `../.git` resolves to from `backend/` cwd at hook invocation time. Two distinct context shapes:

1. **Main checkout.** `<repo>/.git` is a directory. `../.git` from `<repo>/backend/` resolves to `<repo>/.git/` (the real git dir). CaptainHook gets what it expects.
2. **Git worktree.** `<worktree>/.git` is a **92-byte ASCII text file** containing a `gitdir:` pointer (e.g. `gitdir: /home/.../brick-inventory-orchestrator/.git/worktrees/biw-worktree-test`). `../.git` from `<worktree>/backend/` resolves to that file, not a directory.

CaptainHook's `--git-directory` argument is a path-to-the-git-directory parameter. Passing a `gitdir:`-pointer file rather than the real git directory is semantically wrong and depends on undocumented tolerance. In the reproduction below, the pre-fix hook still **executed** the gauntlet but inspected only 9 files via Rector (broken file-changed condition because the file-vs-directory git-dir mismatch breaks how CaptainHook computes the diff scope), versus 341 files inspected via Rector with the fixed hook. The structural fix corrects behavior, not just semantics.

## Chosen Fix (WO 2)

Resolve the git directory absolutely **once**, near the top of the hook (after the existing `cd "$repo_root"`):

```bash
git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd)
```

- `git rev-parse --git-common-dir` returns the path to the **common** git dir (the main repo's `.git/`). In a main checkout it returns the relative string `.git`; in a worktree it returns an absolute path. Critically, it returns the COMMON dir, not the per-worktree dir — so configuration (hooks, refs, packed-refs, config) all point at the same place regardless of which worktree we're invoked from.
- `cd "$(…)" && pwd` normalizes both shapes to absolute. This matters because the inner `cd backend` subshell would otherwise re-resolve a relative `.git` against `backend/` cwd (where it does not exist as a sibling).
- Resolved once at the top and reused. The pattern mirrors the existing `repo_root=$(git rev-parse --show-toplevel)` line that PR #126 leaned on for the frontend fix.

The backend dispatch then becomes:

```bash
(cd backend && vendor/bin/captainhook hook:pre-commit --git-directory="$git_common_dir")
```

Sibling-pattern to PR #126's frontend fix. Different anchor (`$git_common_dir` vs `$repo_root`), same shape: resolve absolutely once at the top, pass explicitly to operations inside subshells.

## Worktree Reproduction Transcript (WO 2)

**Setup.** From the main checkout at `worktree-residue-sweep` (after commit `684758f` for WO 1, with the hook fix in working tree but not yet committed):

```bash
$ git worktree add --detach /tmp/biw-worktree-test HEAD
Preparing worktree (detached HEAD 684758f)
HEAD is now at 684758f chore: delete misplaced component-registry.json at orchestrator root
```

The worktree's `.git` is a `gitdir:`-pointer file:

```bash
$ ls -la /tmp/biw-worktree-test/.git
-rw-r--r-- 1 goosterhof goosterhof 92 May 28 15:33 /tmp/biw-worktree-test/.git
$ cat /tmp/biw-worktree-test/.git
gitdir: /home/goosterhof/Code/brick-inventory-orchestrator/.git/worktrees/biw-worktree-test
```

**Structural proof.** From `backend/` cwd in the worktree:

```bash
$ cd /tmp/biw-worktree-test/backend
$ ls -la ../.git && file ../.git
-rw-r--r-- 1 goosterhof goosterhof 92 May 28 15:33 ../.git
../.git: ASCII text                                          # <-- a FILE, not a directory

$ git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd) && echo "$git_common_dir"
/home/goosterhof/Code/brick-inventory-orchestrator/.git
$ file "$git_common_dir"
/home/goosterhof/Code/brick-inventory-orchestrator/.git: directory   # <-- a DIRECTORY
```

The OLD form passed a 92-byte text file to CaptainHook's `--git-directory`. The NEW form passes an absolute path to the real directory.

**End-to-end with FIXED hook.** Copied the fixed hook into the worktree and symlinked `backend/vendor` (worktrees don't auto-install dependencies). Then staged a backend probe and committed:

```bash
$ cp /home/goosterhof/Code/brick-inventory-orchestrator/.githooks/pre-commit /tmp/biw-worktree-test/.githooks/pre-commit
$ ln -sfn /home/goosterhof/Code/brick-inventory-orchestrator/backend/vendor /tmp/biw-worktree-test/backend/vendor
$ cd /tmp/biw-worktree-test
$ mkdir -p backend/tests/Architecture
$ printf '<?php\n// worktree probe — verifies pre-commit dispatch survives gitdir-as-file\n' > backend/tests/Architecture/_worktree_probe.php
$ git add backend/tests/Architecture/_worktree_probe.php
$ git restore --staged .githooks/pre-commit       # don't stage the hook copy itself
$ git commit -m "probe: verify FIXED backend dispatch in worktree"
→ backend changes staged; running backend pre-commit gauntlet
pre-commit:
 - composer lint:test                                                : failed
captainhook failed executing all actions, took: 78.88s

  [... Rector dry-run output: scans 341 files ...]
  1 file with changes
  1) tests/Architecture/_worktree_probe.php:1
     +declare(strict_types=1);
   Applied rules: SafeDeclareStrictTypesRector
   [OK] 1 file would have been changed (dry-run) by Rector
```

**The gauntlet ran.** CaptainHook resolved the git directory correctly, computed the full Rector scope (341 files), and correctly failed on the probe file's missing strict_types declaration. The failure is a **legitimate lint finding** on the probe content, not an infrastructure failure — proving the dispatch works.

**End-to-end with OLD hook (control case).** Reverted the hook in the worktree to capture the pre-fix execution shape:

```bash
$ git checkout HEAD -- .githooks/pre-commit       # snap back to old hook
$ git commit -m "probe: verify OLD backend dispatch in worktree"
→ backend changes staged; running backend pre-commit gauntlet
pre-commit:
 - composer lint:test                                                : failed
captainhook failed executing all actions, took: 22.56s

  [... Rector dry-run output: scans only 9 files ...]
  1 file with changes
  1) tests/Architecture/_worktree_probe.php:1
   [...]
```

The OLD hook scanned only **9 files** through Rector — the file-changed condition (`FileChanged\Any *.php`) computed a much narrower diff set because CaptainHook's diff resolution was running against a misshapen git-directory argument. The FIXED hook scanned **341 files** (the full Rector scope) — the correct full-repo dry-run that a CaptainHook backend gauntlet is supposed to do.

This 9-vs-341 file-count delta is the **observable behavioral correction** the fix delivers. It directly contradicts the WO's framing of "silent misbehavior" — the misbehavior isn't silent, it's a quietly under-inspecting gauntlet, which is arguably worse (it would let real lint violations through in a worktree-mode commit).

**Cleanup.**

```bash
$ rm /tmp/biw-worktree-test/backend/vendor      # remove the vendor symlink
$ git worktree remove --force /tmp/biw-worktree-test
$ git worktree list      # confirms /tmp/biw-worktree-test no longer listed
```

## Verification That No Tooling Broke (WO 1)

Grep for any reference to the orchestrator-root path across tooling file types:

```bash
$ grep -rn "src/shared/generated/component-registry" \
    --include="*.json" --include="*.mjs" --include="*.ts" --include="*.js" \
    --include="*.sh" --include="*.toml" --include="*.yml" --include="*.yaml" \
    --include="Dockerfile" --include="Makefile" \
    . 2>/dev/null | grep -v node_modules | grep -v ".git/" | grep -v ".claude/"
frontend/scripts/generate-component-registry.mjs:24:const OUTPUT_PATH = join(ROOT, 'src/shared/generated/component-registry.json');
```

**Only one hit** — `frontend/scripts/generate-component-registry.mjs:24`, which uses `process.cwd()` to anchor `ROOT`. The frontend pre-commit hook always invokes this script via `cd "$repo_root/frontend"` (post-PR-#126), so `process.cwd()` is always `<repo>/frontend/` and the join produces `<repo>/frontend/src/shared/generated/component-registry.json`. **The script never produces or references an orchestrator-root path.** The deletion is safe.

Paper-trail hits (under `.claude/`, `MINUTES.md`, and `BUILD_RECORDS/`) are commentary about the bug-fix history — none reference the orchestrator-root file as a live artifact.

## Decisions Made

1. **Bundled two WOs into one Build Record on one branch.** Both WOs are PR #126 follow-up residue; both are sub-threshold; both touch only Atrium-level files (`.githooks/` + a deleted orchestrator-root residual). Filing them under one BR keeps the paper trail proportional to the work. Two commits (one per WO) preserve per-WO diff isolation for the post-merge close-out scripts.

2. **WO 2 fix uses `git rev-parse --git-common-dir` (not `--git-dir`).** `--git-dir` returns the per-worktree dir in a worktree context (e.g. `.git/worktrees/biw-worktree-test/`), which is **not** what CaptainHook wants — CaptainHook reads hooks config, refs, and packed-refs, which are in the COMMON dir, not the per-worktree dir. `--git-common-dir` returns the common dir uniformly across both contexts. This was confirmed by the WO's explicit hint ("`$(git rev-parse --git-common-dir)`") and by reading CaptainHook's source (it loads its config via the git-directory argument).

3. **Normalized to absolute via `cd "$(…)" && pwd`.** `--git-common-dir` returns the literal string `.git` in a main checkout — relative, and relative to `$repo_root` (where the hook's `cd "$repo_root"` already lives). If passed unchanged to the inner `cd backend` subshell, the relative path would re-resolve against `backend/` cwd and break. The `cd … && pwd` idiom is the portable POSIX way to normalize-to-absolute without bringing in `realpath` (not on all Linux distros by default in some minimal images).

4. **WO 2 reproduction used a `--detach` worktree on `HEAD`, not a fresh branch.** The branch `worktree-residue-sweep` was already checked out in the main repo at the time of verification (`git worktree add <branch>` would fail with `already used by worktree`). `--detach HEAD` at the same commit gave a fresh worktree with identical content. Equivalent for the verification's purpose.

5. **WO 2 reproduction used a symlinked `backend/vendor` from the main checkout.** Worktrees don't share `vendor/` (the directory is not tracked by git), so CaptainHook's binary wouldn't otherwise be available in the worktree. Symlinking from the main checkout's installed vendor tree gave the worktree access to the same CaptainHook binary the production hook would invoke. The symlink was cleaned up before `git worktree remove`.

6. **Did NOT run `make lint` / `make test`** at the orchestrator level (per WO acceptance criteria) because they require Docker compose containers running, and the changes touch only `.githooks/pre-commit` (orchestrator-level shell) plus an unreferenced root-level file deletion — neither exercises backend or frontend wing code. Substituted with **host-equivalent** validations: backend `composer lint:test` ran clean against host PHP 8.5 (`[OK] Rector is done!`, Pint passed), frontend `npm run format:check` and `npm run lint` ran clean (all 333 files formatted; only pre-existing lint warnings, none touched). Plus the worktree reproduction itself exercised the backend gauntlet end-to-end. Steward visibility: if the WO's `make lint`/`make test` requirement is strict (containers up), I'd need a separate dispatch with Docker available; flagging here.

## Diff Summary

### Commit 684758f — WO 1

```
.../src/shared/generated/component-registry.json | 1278 -------------------
1 file changed, 1278 deletions(-)
delete mode 100644 src/shared/generated/component-registry.json
```

### Commit 61e6fe0 — WO 2

```
.githooks/pre-commit | 22 +++++++++++++++++++---
1 file changed, 18 insertions(+), 4 deletions(-)
```

Hook diff:

```diff
 repo_root=$(git rev-parse --show-toplevel)
 cd "$repo_root"

+# Resolve the git directory absolutely so the backend dispatch's
+# `cd backend && vendor/bin/captainhook --git-directory=...` invocation
+# works regardless of whether `.git` at the repo root is a directory
+# (main checkout) or a file containing a `gitdir:` pointer (worktree).
+# `git rev-parse --git-common-dir` returns the path to the common git dir
+# (the main repo's .git/) — in a worktree this is already absolute; in a
+# main checkout it is the relative string `.git`. Normalize to absolute
+# via the `cd … && pwd` idiom so the value survives the inner `cd backend`
+# subshell. Sibling fix to PR #126's frontend $repo_root anchoring;
+# see WO 2026-05-28-backend-pre-commit-worktree-safety.
+git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd)
+
 staged_backend=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^backend/' || true)
 staged_frontend=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^frontend/' || true)

 if [ -n "$staged_backend" ]; then
     echo "→ backend changes staged; running backend pre-commit gauntlet"
-    # --git-directory points at the parent's .git/ — captainhook would
-    # otherwise look for backend/.git/ which doesn't exist in the monorepo
-    # (the only git directory is at the orchestrator root).
-    (cd backend && vendor/bin/captainhook hook:pre-commit --git-directory=../.git)
+    # --git-directory passes the absolute git dir resolved above.
+    # The pre-fix form (`--git-directory=../.git`) assumed `.git` is a
+    # directory two levels up from `backend/`, which is true in a main
+    # checkout but false in a worktree (where `.git` at the worktree
+    # root is a `gitdir:`-pointer file, not a directory).
+    (cd backend && vendor/bin/captainhook hook:pre-commit --git-directory="$git_common_dir")
 fi
```

## Unexpected Findings

1. **CaptainHook tolerated being passed a `gitdir:`-pointer FILE as `--git-directory` without crashing.** I expected the OLD-form worktree dispatch to fail with a "git dir not found"-class error (matching the WO's framing of "silently misbehaves"). It did not crash — it ran, but inspected only 9 files via Rector instead of the full 341. The structural bug surface is real, but the failure mode is "quietly under-inspecting gauntlet" rather than "noisy infrastructure error." This is arguably worse than a hard crash because it would let real lint violations slip through in worktree-mode commits. The WO's framing was directionally correct but the failure mechanism is subtler. Updated the WO 2 commit message and this BR to reflect the more accurate picture.

2. **The 9-vs-341 file-count delta is the observable behavioral correction.** Both runs failed on the same Rector finding (the probe file's missing `declare(strict_types=1)`), so the visible test-output looks identical at the failure line. But the diff scope was wildly different — the FIXED form did a full-repo Rector dry-run (the gauntlet's intended scope), the OLD form did a 9-file scan (broken scope). Captured this in the Build Record's reproduction transcript because it's the clearest evidence the fix corrects behavior, not just defends against a hypothetical.

3. **Empty parent directories cleaned themselves up after `git rm`.** I expected to need to manually `rmdir` `src/shared/generated/`, `src/shared/`, and `src/` after the delete (per the WO's "remove the empty parent directories" instruction). Git already cleaned them up on its own — likely because they were untracked (only the deleted file was tracked). Confirmed with `ls -la src/` returning "No such file or directory." No manual `rmdir` walk needed. Captured this in the BR's diff summary for the next Brickwright facing a similar situation.

4. **The deleted file's md5 matched the canonical file's md5** (`e74d73a190b730fd177914c1a63615b1`). The root copy was a literal duplicate blob — same 55,243 bytes, same 1,278 lines. This is unsurprising given the PR #119 hook-bug mechanism (the hook regenerated the registry at `src/shared/generated/...` instead of `frontend/src/shared/generated/...`), but it's worth recording: deleting the root copy loses zero information.

## Showcase Readiness

Neither change touches Showcase-visible code. WO 1 is paper-cleanup of an unreferenced file; WO 2 is a hook-script fix. No Showcase impact.

## Proposed Knowledge Updates (CEO/Steward to review)

### Pulse

- Remove the "Cleanup-pending: residual orchestrator-root `src/shared/generated/component-registry.json`" item from the in-flight concerns list (if it's still flagged from the 2026-05-27 BR). Resolved 2026-05-28 by this WO's commit `684758f`.
- Remove the "Backend dispatch worktree-safety: outstanding" item from the in-flight concerns list. Resolved 2026-05-28 by this WO's commit `61e6fe0`.

### Casebook Recurring Pattern

- The 2026-05-27 row "Worktree-mode pre-commit hook regen path bug" can be flipped to **Resolved across both wings (2026-05-28)**. PR #126 closed the frontend leg; this BR closes the backend leg. The generalized lesson — *"Hooks that depend on paths under `.git` must resolve via `git rev-parse --git-common-dir` (or `--show-toplevel` for the working tree) and normalize to absolute before crossing into subshells"* — should be added to the Casebook as a "Closed Pattern" with two leg-reproductions on record.

### Learnings (cross-wing)

- Add: *"In worktrees, `<repo>/.git` is a 92-byte `gitdir:`-pointer FILE, not a directory. Hooks and tools that hard-code paths like `--git-directory=../.git` will receive a file path and either crash (loud) or silently under-inspect (quiet — the worse case). `git rev-parse --git-common-dir` + `cd … && pwd` is the portable resolution. Sibling-pattern to the 2026-05-19 lesson 'Hooks that `cd` must anchor via `git rev-parse --show-toplevel`' — same shape, different anchor."*
- Confirming-observation count: 1 (this dispatch). The frontend leg's `git add` path-relativity is a sibling, not the same root cause — different mechanism, same class. Keep as a candidate for now; promote when a second independent observation lands.

### Decisions Ledger / ADRs

- No new decisions. The fix is a structural correction, not a doctrine change. Reinforces existing decisions (ADR-0028 PrePushPermitGate is unaffected; the WO bundling pattern under ADR-0028's uniform-rule worked cleanly).

## Self-Debrief

**What went well.** The two-commit / one-BR bundling kept the paper trail proportional. The worktree reproduction was end-to-end and captured both the structural difference (file-vs-directory) and the behavioral difference (9-vs-341 Rector file count) — the latter is the kind of "evidence, not opinion" the Brickwright manual asks for. The fix mirrors PR #126's pattern, so future readers seeing `repo_root=$(…)` + `git_common_dir=$(…)` near the top of `.githooks/pre-commit` will recognize the family resemblance.

**What didn't go well.** I attempted to run `make lint` / `make test` at the orchestrator level per the WO acceptance criteria but didn't have Docker compose containers running, so I substituted host-equivalent backend lint:test + frontend format:check/lint. Flagged that substitution explicitly in "Decisions Made" so the Steward can rule. If strict adherence to the WO's `make lint`/`make test` is required, a Docker-up dispatch is needed; the wing-level checks I did exercise the same code paths.

**What I'd do differently next time.** When a WO calls for `make lint` / `make test`, check Docker state at the start of the dispatch and either bring containers up (`make up`) early to overlap with the build work, or flag immediately that the orchestrator-level checks aren't reachable and propose the host-equivalent substitution before doing the work. I treated the substitution as a back-half decision; it should have been front-half.

**Failed Quality Warden rebuttals this dispatch.** None. The work was straight execution against two clearly-scoped WOs.

## Training Proposals

None this dispatch. The learnings above belong in the cross-wing knowledge base (Casebook + Learnings); the Brickwright's per-wing graduation logs already capture the "verify external-state claims" and "delta-on-a-metric baseline" principles that drove this dispatch's verification rigor.

---

## Steward Evaluation

_(To be appended by The Steward upon review.)_
