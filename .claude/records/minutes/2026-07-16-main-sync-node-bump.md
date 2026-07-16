# Minutes — 2026-07-16 — Main Sync + Node Bump Housekeeping

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-16 — Main Sync + Node Bump Housekeeping

### Decisions

- **Discard the orphaned index, don't keep it**: The staged changeset on `main` was a stale reversal of merged PR #245 (fs-form adoption) — it re-added the retired local `useFormSubmit`/`useValidationErrors` composables, stripped `@script-development/fs-form`, downgraded fs-* + vue packages, and deleted two live Work Orders. Classified as pre-#245 residue, not work-in-progress. Stashed as a safety net, then dropped on CEO instruction.
- **Bump host Node to 24.15.0**: Pulled tree's `package.json` engines field wants `^24.15.0`; host was on 24.13.0 (EBADENGINE warning). Installed 24.15.0 via nvm, set as `default`, rebuilt all three apps clean.
- **Uninstall 24.13.0**: Removed the old version entirely rather than keeping it as a fallback (CEO instruction).

### Friction Signals

- Session opened on CEO caution — "we have some active work here? we should first check what that is and why we left it there" — before syncing. Investigation confirmed the caution was warranted: the "active work" would have reverted a merged PR and deleted two Work Orders had it been committed.
- Node bump took two rebuild passes: the first build silently ran on 24.13.0 because the session's inherited PATH was frozen to the old `bin`. Caught via `node -v` in build output; second pass forced `nvm use 24.15.0`.
- Two flawed clean-shell simulations before confirming the default alias resolves correctly — `env -i bash -lc` (login shell skips nvm, lives in `.bashrc`) and `bash -c 'source ~/.bashrc'` (hit `.bashrc`'s non-interactive early-return guard). Third attempt (`bash -ic`) confirmed a fresh interactive terminal resolves to 24.15.0.

### Process Meta

- No subagents dispatched; no ceremony bypasses. Root reflog (`pull --tags` fast-forward, `reset: moving to origin/main`) was the key evidence for classifying the orphaned index.
- `git stash push --include-untracked` used as a reversible intermediate before the destructive discard; stash dropped once the fast-forward landed clean.

### Notes

- **Origin of the orphaned index**: pre-#245 working state left dangling on `main` (not on a branch, not stashed) after main was reset/fast-forwarded past the fs-form merge. The proper home for that work was the already-merged `feat/fs-form-adoption` branch (`008eeec`); this was its abandoned starting-point residue.
- **Session-scoped PATH freeze**: Claude Code's shells inherit the parent process PATH, frozen to whatever Node was active at launch (24.13.0). After uninstalling 24.13.0, bare `node` calls from this session's shells fail until `nvm use default`. Persistent config (nvm `default -> 24.15.0`) is correct; new terminals get 24.15.0. `.bashrc` only sources nvm (no pin); no hardcoded node path in profile.
- WSL interop leaves `/mnt/c/Program Files/nodejs/` on PATH behind the nvm entry — shadowed, harmless.

### Action Items

- CEO: none outstanding — housekeeping session, tree synced to `origin/main` at `cd6d0c3`, working tree clean.

---
