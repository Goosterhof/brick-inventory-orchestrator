# Pattern Master — Graduation Log

Training proposals from Build Records are tracked here. Patterns emerge from accumulated Parameter Records across multiple deliveries. The Steward manages this log.

### Discovered Parameters

_Animation parameter patterns observed across deliveries. When a pattern has 3+ approvals in a consistent range, it becomes a graduation candidate._

| Parameter Pattern | Observed Range | Approvals | Rejections | Status |
| --- | --- | --- | --- | --- |
| Page transition enter duration | 200-220ms | 2 | 0 | Tracking |
| Page transition leave duration | 140ms | 2 | 0 | Tracking |
| Page transition easing | cubic-bezier(0.2, 0, 0, 1) | 2 | 0 | Tracking |
| Page transition translate distance | 12px (3 LEGO studs) | 2 | 0 | Tracking |

### Candidates

_Patterns with enough data points to suggest a rule. Need Steward test scenarios before graduation._

| Proposal | First Observed | Journal Evidence | Context |
| --- | --- | --- | --- |
| Before writing any component, check existing components for the defineProps pattern | 2026-04-09 | 2026-04-09-page-transition-system, 2026-04-10-page-transition-refactor | Lint caught non-destructured defineProps; then mount boundary violation in refactor tests |
| After writing tests, run coverage on the specific project before the full gauntlet | 2026-04-09 | 2026-04-09-page-transition-system | SSR branches only caught by full coverage run; project-specific run would have been faster |
| When testing showcase demos, use unique selectors that won't collide with stub content | 2026-04-09 | 2026-04-09-page-transition-system | SectionHeading stub caused false selector matches in PageTransitionDemo test |
| Check knip before committing new exports to avoid unused-export violations | 2026-04-09 | 2026-04-09-page-transition-system | PageTransitionConfig and UsePageTransition were exported but unused externally |
| A composable is warranted only when 2+ components consume the same reactive logic | 2026-04-10 | 2026-04-10-page-transition-refactor | usePageTransition had one consumer; separation was pure indirection with zero reuse benefit |
| shallowMount with explicit unstubbing for defineExpose template ref testing | 2026-04-10 | 2026-04-10-page-transition-refactor | `{PageTransition: false}` unstubs one component while keeping others shallow |
| Never use defineExpose — demo should own state and pass down via props | 2026-04-10 | 2026-04-10-remove-define-expose | Used defineExpose to let demo read animation state; CEO ruled hard no — inverted ownership |
| Before adding a lint rule exception, ask if the architecture is wrong | 2026-04-10 | 2026-04-10-remove-define-expose | Added lint-vue-allow-expose exception; the underlying architecture was wrong, not the rule |
| Before writing UnoCSS attributify responsive values, grep for the exact `attr="\d+ sm:\d+"` pattern to confirm the value-list grammar (no redundant attribute prefix inside the quotes) | 2026-04-17 | 2026-04-17-playground-mobile-friendly | First-pass edit wrote `gap="6 sm:gap-8"` and `p="4 sm:p-6"` — redundant attribute prefix inside attributify value list |
| When a Work Order requires visual viewport verification and no GUI browser / Playwright / MCP browser is available, flag this as a verification gap in the Work Order Fulfillment section up-front, not buried in a caveat | 2026-04-17 | 2026-04-17-playground-mobile-friendly | Permit asked for browser verification at 4 widths; environment had no GUI browser; disclosure was done correctly but should be codified for consistency |
| When adding layout-only changes to a page matched by `vitest.config.ts` pages-exclusion, skip writing new tests — the 100% mandate doesn't apply to excluded paths | 2026-04-17 | 2026-04-17-playground-mobile-friendly | Architect briefly considered writing a PlaygroundPage.spec.ts before the config skim confirmed exclusion |

### Graduated

_Patterns confirmed through test scenarios. Promoted into the Pattern Master's pre-work checklist._

| Proposal | Graduated | Confirming Journals | Promoted To |
| --- | --- | --- | --- |
| Before writing new code, check architecture tests and linter rules for conventions that constrain the implementation | 2026-04-10 | 2026-04-09-page-transition-system, 2026-04-10-page-transition-refactor | Pre-work checklist: "Before writing components or tests, check architecture.spec.ts and lint-vue-conventions.mjs for rules that constrain the implementation." |

### Dropped

_Patterns evaluated and rejected. Kept for institutional memory._

| Proposal | Dropped | Journal Evidence | Reason |
| --- | --- | --- | --- |
| _(none yet)_ | | | |
