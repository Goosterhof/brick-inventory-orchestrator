# Minutes — 2026-06-13 — Brick Lab: Fable 5 Prototyping Experiment

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-06-13 — Brick Lab: Fable 5 Prototyping Experiment

_Session began 2026-06-12 and ran past midnight. CEO's brief: test what Fable 5 can do by prototyping "a new and improved LEGO brick" across Canvas 2D, SVG, CSS 3D, raw WebGL, GSAP, and Three.js, with explicit freedom to experiment._

### Decisions

- **Brick Lab lives in the Showcase app under `pages/`**: experiments are coverage-exempt by existing policy while staying inside type-check, oxlint, conventions, knip, and the three-app build. Chosen over `components/` placement, which would have demanded 100% coverage on throwaway prototypes.
- **One invented part across all six techniques**: BW-3001X (clutch channels +12% grip, self-seating alignment chamfers, vented core tubes) — each prototype tells the same product story in its own medium.
- **New parts list entries**: `three`, `@types/three`, `gsap` — showcase-only; the 660 kB BrickLab chunk warning accepted because showcase is dev-only and outside the families/admin size-limit budgets.
- **PR #200 merged** (six prototypes); CEO singled out the Forge for iteration 2 (**PR #201**, raymarched click + material lab + baseplate floor), then the Draftsman ("I really like its playful feeling") for the free-build rework.
- **Draftsman v2 ships a dev-only scene-state contract** (`data-bricks` attribute mirroring `{col, span, level, state}` per brick) so probes assert placement invariants over state, not pixels — chosen over `defineExpose`, which the conventions linter forbids.
- **Forge performance answer**: adaptive render-scale governor (frame-time EMA with hysteresis, ×0.5–native) rather than cutting scene content — slow devices keep frame rate instead of pixels.

### False Starts

- **Blueprint v1 composition**: dimension text rendered 48px instead of 12 and the title block clipped off-sheet. Root cause was not the geometry — UnoCSS attributify hijacks SVG presentation attributes (`font-size="12"` matches the `font-size-12` utility; generated CSS beats the attribute; numeric `opacity` gets percent-divided). Fixed with scoped classes and rgba-folded opacity.
- **Forge round-1 performance record**: "60fps at DPR 2 under SwiftShader" was asserted, not measured. Real measured baseline: ~11.5 fps at DPR 1. Pattern Master corrected its own record unprompted in round 2 and re-engineered from measurements.
- **Draftsman v2 painter's sort**: column-primary draw order made correct physics look like wrong landings (interpenetration with mixed widths/overhangs). Data exonerated by deterministic reproduction; one-line fix to z-primary sort. Bug was invisible in round-2 screenshots because uniform towers never put a higher brick at a lower column index.

### Friction Signals

- One CEO bug report this session (stacking/overlap screenshot, `image.png`) — reproduced deterministically, root-caused, and fixed in a single round.
- The Steward's own visual probe caught the Blueprint scale bug before the CEO saw it; one rework round.
- Playwright probe-side scroll-staleness produced a false alarm during the overlap investigation (locator screenshots auto-scroll and stale cached coordinates) — second occurrence of this probe-bug class this session.

### Dynamics

- CEO granted broad creative latitude up front ("you are free to experiment") and steered by selection afterward — merging, then naming the Forge and the Draftsman for deeper rounds rather than prescribing features.
- Pattern Master proposed the jam-vs-seat A/B as the chamfer story and volunteered the performance-record correction; the Steward relayed both unedited.
- Steward presented the attributify/SVG discovery as a learnings candidate per the three-tier review rather than committing it directly — deferred to CEO.

### Process Meta

- Three Pattern Master agents dispatched in parallel (Canvas 2D + SVG, raw WebGL + Three.js, GSAP + CSS 3D) with strict file-ownership partitioning; zero cross-agent conflicts. Same agents resumed via SendMessage for four follow-up rounds (Blueprint fix, Forge iteration 2, Draftsman v2, overlap bug fix) with context intact.
- Steward independently verified every round: full gauntlet spot-checks plus own headless-Chromium probes (Playwright from `e2e/`) and screenshot deliveries to the CEO.
- Pre-commit and pre-push gauntlets passed clean on every commit; no `--no-verify` bypasses this session. `Agent Review Requested` label auto-applied by workflow on both PRs.
- `/minutes` fired (this file).

### Notes

- The showcase app is exempt from the path-alias lint doctrine and size-limit watches only families/admin — combined with the `pages/**` coverage exemption, showcase pages are the sanctioned sandbox for visual experiments.
- UnoCSS attributify vs SVG presentation attributes is a Gallery-wide footgun: the offending utility can be generated from a match in *any* scanned file and then applies everywhere. Also recorded in Steward memory.
- Known cosmetic limit accepted in Draftsman: right-descending staircases can clip a sliver of a back stud (inherent box-painter ambiguity; per-face sorting would be needed). Documented, not hidden.

### Action Items

- CEO: approve or decline the proposed `[Gallery]` learnings entry (attributify/SVG presentation-attribute collision).
- CEO: taste call on Forge engagement timing (0.5s legibility-first vs 0.3s snappier — single constant).
- CEO: decide on graduating the damped-cosine settle family (`e^(−9..10t)`, 22–24 rad/s — now spans squash, shudder, stack bounce across two approved rounds) into the design-system parameter log.
- CEO: merge PR #201 (Forge iteration 2) and review the Draftsman v2 PR.
- CEO: direction on where the Brick Lab goes next (promote a winning technique to a shared component, code-split the Three.js chunk, or further iterations).

### Open Questions

- Which prototype technique, if any, graduates from the lab into product surfaces?

---
