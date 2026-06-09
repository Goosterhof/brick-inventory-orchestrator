# Minutes — 2026-06-09 — Fable-5 Harness Review

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-06-09 — Fable-5 Harness Review

### Decisions

- **Review framing carried over from 2026-05-28**: a harness is compensation for model limitations; a model bump shifts which limitations bind. Pieces sorted keep / reconsider / fix / CEO-decision, same as the Opus 4.8 review.
- **Crew model-pin split (headline)**: builders (`brickwright`, `pattern-master`, `steward` subagent) moved `model: opus` → `model: inherit`; `quality-warden` stays pinned `opus`. Rationale: cross-model inspection — the session engine's builds get audited by a different engine, so same-model blind spots cannot self-approve. Rationale anchored as a note in `quality-warden.md` so the pin isn't "aligned" away later.
- **Key mechanical fact behind the decision**: a frontmatter `model:` pin overrides the parent session's model, so the old "crew floats on the `opus` alias and picks up the new model automatically" (4.8 minutes, line 39) does NOT hold for fable — first model arrival where the alias doesn't carry the crew. Verified via claude-code-guide against current docs; `inherit` is a documented value.
- **Dropped the auto-oxfmt commit hook**: the PreToolUse `git commit` → `npx oxfmt --write .` (whole Gallery Wing) hook removed from `settings.json`. Redundant with lint-staged in the `.githooks` pre-commit gauntlet, and the blanket `--write` was the mechanism behind the commit-boundary contamination friction logged in the 4.8 minutes.
- **SessionStart goes self-repairing on web**: on `$CLAUDE_CODE_REMOTE=true` the hook now installs Node 24 via nvm (scanning `/opt/nvm`, where the web image keeps nvm without exporting `NVM_DIR` — a second latent gap found during the fix) and runs `npm install` for the Gallery Wing. Local sessions stay report-only. Timeout 10s → 600s; container caching makes repeat runs ~20ms.
- **Cleared, kept as-is**: destructive-git guard, generated-file guard, permissions allow-list, PostToolUse format check, `.githooks` dispatchers. The suspected hooks-schema bug (`if:` field) was cleared — `if` with permission-rule syntax and `statusMessage` are both documented, supported fields.

### Friction Signals

- The "Node 22 / no node_modules" environment gap recurred from the 2026-05-28 session (minuted then as a verification limitation) — second occurrence is what escalated it from note to fix.

### Dynamics

- Steward recommended the split (builders inherit / Warden opus); CEO accepted the recommendation. CEO selected both remediation threads offered (oxfmt-hook removal, remote-env fix) and did not take the minutes-only option.
- Rejected alternatives on the model question: inherit-everywhere (no control group — a new-engine weakness hits builds and audits at once), pin-`fable`-everywhere (same, plus sticky across non-fable sessions), keep-`opus`-pins (new engine never does real builds).

### Process Meta

- `claude-code-guide` subagent dispatched once to verify model-pin resolution semantics and the hooks `if:`/`statusMessage` schema against current docs — both questions settled authoritatively before the board paper.
- `session-start-hook` skill fired for the remote-env thread; its validation gauntlet run: hook executed end-to-end as remote (Node 24.16.0 activated, deps installed, exit 0), oxlint clean on a sample file, `string.spec.ts` 8/8 green on Node 24.
- One false start in validation: `vitest run --project unit` failed (wrong project name); direct spec path worked.
- `/minutes` fired (this file). No `--no-verify` used; staged paths were `.claude/**` only, so no wing gauntlet applied.
- Session ran on the new engine; review precedent file `2026-05-28-opus-4.8-harness-review.md` used as the yardstick.

### Notes

- The Warden's `opus` pin is now load-bearing doctrine, not leftover config — documented inline in the agent file with a do-not-align warning citing this review.
- 4.8 minutes' headline learning ("parallel harness-review sessions need WO claiming") noted; this session stayed under the PrePushPermitGate threshold (6 files), so no Work Order was filed.

### Action Items

- [ ] **CEO**: merge the branch so the self-repairing SessionStart reaches the default branch — web sessions only pick it up from there.
- [ ] **Steward (future session)**: first real Brickwright dispatch on the new engine runs under Warden to exercise the cross-model audit loop; evaluate before declaring the trial settled.

### Open Questions

- Should the Warden's cross-model pin become standing doctrine (always one engine behind/different from the builders), or is it trial-only scaffolding to be removed once the new engine is trusted? Revisit at the next `/retro`.

---
