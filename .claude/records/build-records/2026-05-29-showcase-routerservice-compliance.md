# Build Record: Showcase RouterService Compliance + Linter Gap Close

**Build Record #:** 2026-05-29-showcase-routerservice-compliance
**Filed:** 2026-05-29
**Work Order:** [`2026-05-29-showcase-routerservice-compliance`](../work-orders/2026-05-29-showcase-routerservice-compliance.md)
**Builder:** Brickwright
**Wing:** Gallery

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order still `In Progress`. The Steward owns the WO file and will flip its Status to `Completed` post-merge with a back-link to this BR. Per the dispatch instruction, the Brickwright did not touch the WO file and did not commit/push.

---

## Work Summary

Two parts: (1) migrate the showcase app off raw `vue-router` primitives onto `createRouterService()` (path (a), CEO-ruled); (2) close the enforcement gap so raw Vue Router usage anywhere under `src/apps/**` is flagged.

| Action | File | Notes |
|---|---|---|
| Modified | `frontend/src/apps/showcase/router/index.ts` | Replaced `createRouter`/`createWebHistory` from `vue-router` with `createRouterService([...routes], {base: import.meta.env.BASE_URL})` from `@script-development/fs-router`. Now exports `showcaseRouterService`, `ShowcaseRouterView`, `ShowcaseRouterLink` — mirrors admin's `router/index.ts` exactly. Type-only `RouteRecordRaw` import retained (matches admin/families). |
| Modified | `frontend/src/apps/showcase/main.ts` | `app.use(showcaseRouter)` → `showcaseRouterService.install()`. Matches admin/families bootstrap. |
| Modified | `frontend/src/apps/showcase/App.vue` | Dropped `import {RouterLink, RouterView} from 'vue-router'`. Now imports `ShowcaseRouterLink`, `ShowcaseRouterView`, `showcaseRouterService` from `./router`. Raw `<RouterLink>`/`<RouterView>` tags → `<ShowcaseRouterLink>`/`<ShowcaseRouterView>`. Active-link state switched from `$route.name` to a `computed(() => showcaseRouterService.currentRouteRef.value.name)`. Existing routes (`showcase`, `playground`) and nav styling preserved. |
| Modified | `frontend/scripts/lint-vue-conventions.mjs` | Added check 6b (raw `<RouterView>`/`<RouterLink>`/kebab in `src/apps/**` templates) + check 6c (raw `createRouter`/`createWebHistory`/`createWebHashHistory`/`RouterView`/`RouterLink` value-imports from `vue-router` in `src/apps/**`). Word-boundary lookbehind + `import type` exclusion prevent false positives on sanctioned wrappers and type-only imports. |
| Created | `frontend/src/tests/unit/lint-vue-conventions.spec.ts` | Regression proof: 4 tests drive the linter as a subprocess against temp-dir fixtures whose path contains `src/apps/`. Asserts the rule **fires** on raw import + raw template usage (with exact messages) and **passes** on `createRouterService()` + sanctioned-component usage. |
| Created | `frontend/src/tests/unit/apps/showcase/App.spec.ts` | Behavioral coverage for the migrated App.vue (mirrors admin's `App.spec.ts`): renders both `ShowcaseRouterLink`s with correct `to` props, renders `ShowcaseRouterView`, applies active class from `currentRouteRef`. |
| Modified | `frontend/vitest.config.ts` | Registered `rootProject('showcase/root', 'apps/showcase')` (picks up the new showcase App spec) and `fileProject('lint-vue-conventions', 'lint-vue-conventions.spec.ts')` (picks up the linter regression spec, sibling to `architecture.spec.ts`). |

### Before / After (the migration pattern)

**Before** (`router/index.ts`):
```ts
import {createRouter, createWebHistory} from 'vue-router';
export const showcaseRouter = createRouter({history: createWebHistory(import.meta.env.BASE_URL), routes: [...routes]});
```
**After:**
```ts
import {createRouterService} from '@script-development/fs-router';
const routerService = createRouterService([...routes], {base: import.meta.env.BASE_URL});
export const showcaseRouterService = routerService;
export const ShowcaseRouterView = routerService.RouterView;
export const ShowcaseRouterLink = routerService.RouterLink;
```

**Before** (`App.vue`): `import {RouterLink, RouterView} from 'vue-router'` + `<RouterLink :class="$route.name === 'showcase' ? ...">`.
**After:** `import {ShowcaseRouterLink, ShowcaseRouterView, showcaseRouterService} from './router'` + `<ShowcaseRouterLink :class="currentRouteName === 'showcase' ? ...">` driven by a `computed` over `currentRouteRef`.

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| (Path a) Showcase routes through `createRouterService()`; no raw `vue-router` primitives remain in the app | Yes | `grep` of `src/apps/showcase/` shows only `createRouterService` (sanctioned factory) and the `RouteRecordRaw` type import remain — no `createRouter`/`createWebHistory`/raw `RouterView`/`RouterLink`. Standalone `npm run build:showcase` green. |
| Linter flags raw Vue Router usage anywhere under `src/apps/**`; a regression test/fixture proves it | Yes | `lint-vue-conventions.mjs` checks 6b + 6c cover all of `src/apps/**` (templates + value imports). `lint-vue-conventions.spec.ts` (4 tests) proves the rule fires on raw usage and passes on RouterService usage. The gap was real: the showcase had no oxlint per-app override at all, and the existing per-app bans only covered `useRouter`/`useRoute`. |
| Gallery gauntlet green (type-check, lint, lint:vue, knip, test:coverage, build) | Yes | All green — see table below. 100% coverage maintained. |
| Build Record filed | Yes | This record. |

## Decisions Made

1. **Closed the gap in the custom linter (`lint-vue-conventions.mjs`), not oxlint `no-restricted-imports`.** The WO offered either. Chose the custom linter because: (a) it already owns the analogous shared-component RouterLink ban (check 6), so the rule lives next to its sibling; (b) one uniform `src/apps/**` rule beats adding/maintaining four parallel oxlint override blocks (families, admin, showcase, domains — and showcase had **no** override block at all, which is precisely how the violation slipped through); (c) the custom linter catches both template usage (`<RouterView>` from global registration, which JS-import bans can't see) and value imports in one pass. oxlint's existing `useRouter`/`useRoute` bans remain untouched and complementary.

2. **Followed the admin app's layout (relative `./router`, not `@app/`).** The showcase pages already use relative imports, and critically `@app/*` in `tsconfig.app.json`/`tsconfig.vitest.json`/`knip.json` resolves only to `families` + `admin` — showcase is not an `@app/` target. Admin (the closest dev-simple analog) uses `./router` relatively, so the showcase mirrors admin exactly rather than guessing at an alias that wouldn't resolve.

3. **Added a showcase `App.spec.ts` even though `App.vue` is coverage-excluded.** `src/apps/**/App.vue` is excluded from the 100% gate, so this isn't required for coverage. Added it anyway because admin has the identical precedent, the showcase is the pattern-discipline showroom, and it gives the migration behavioral proof (active-link state from `currentRouteRef`, sanctioned components mounting).

4. **Regression fixtures live in an OS temp dir, not under `src`.** The linter scans all of `src` by default, so a deliberately-bad fixture committed under `src` would break the gauntlet. The spec writes fixtures into `mkdtempSync(...)` at runtime under a nested `src/apps/...` path (so the linter's `file.includes('src/apps/')` checks fire) and passes the absolute path as an explicit argv. Fixtures are torn down in `afterAll` — nothing committed, nothing scanned by the default run.

## Quality Gauntlet

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| format:check | Pass | oxfmt clean, 335 files |
| lint | Pass | oxlint exit 0; warnings only (no errors). The one new warning on `lint-vue-conventions.spec.ts:4` (`unicorn/import-style` on `node:path` named import) is identical to the pre-existing warning on `architecture.spec.ts:2` — consistent with house precedent. |
| lint:vue | Pass | Custom linter — all conventions passed; new checks 6b/6c don't false-positive on migrated showcase, families, or admin. |
| type-check | Pass | vue-tsc clean. Showcase (dev-only, not in `npm run build`) type-checks via the project-references graph. |
| test:coverage | Pass | Lines 100% (1344/1344), Branches 100% (1118/1118), Functions 100% (422/422), Statements 100% (1445/1445). |
| knip | Pass | 0 violations. |
| size | Pass | families 129.85 kB / 350 kB, admin 30.91 kB / 150 kB. |
| build | Pass | families + admin built in 7.80s. |
| build:showcase (extra) | Pass | Standalone dev-only showcase build green (3.19s) — proves the migrated routing compiles + bundles. |

Collect-guard/test-guard reporters emitted informational warnings (per ADR-0012 they are non-failing) on pre-existing files only (`PlacePartModal`, `AboutPage`, `BrickDnaPage`, `ComponentHealth`, the showcase component cluster). The two new specs do not appear in any slow-file list — no new test-perf regression introduced.

## Showcase Readiness

Strong. The showcase is the artifact a prospective client opens to judge pattern discipline, and it was the one app silently breaking the firm's own routing doctrine (ADR-0003 "no exceptions for 'simple' apps"). After this migration all three apps speak one routing dialect, and the enforcement gap that let the divergence persist is closed with a tested rule that fires across the whole `src/apps/**` surface — not a one-off patch on the showcase. The regression spec drives the linter as a black box against fixtures, so the guard is provably load-bearing rather than green-by-construction. A senior reviewer sees: a real architectural drift caught, the drift fixed to match the established pattern exactly, and the hole that let it through sealed with a test.

## Proposed Knowledge Updates

- **Learnings:** Candidate — "When closing a per-app convention via the linter, confirm every app is in scope. The showcase had **no** oxlint `no-restricted-imports` override block at all (only families/admin/domains did), so even the existing `useRouter`/`useRoute` ban never applied to it. A `src/apps/**`-wide rule in `lint-vue-conventions.mjs` is more robust than per-app oxlint overrides for app-universal bans."
- **Pulse:** Gallery → Pattern Maturity: "RouterService wrapper — Battle-tested" can note all three apps (families, admin, showcase) now comply, with raw-primitive usage guarded by `lint-vue-conventions.mjs` checks 6b/6c across `src/apps/**`. Active Concerns: no change. (Steward to apply post-merge.)
- **Domain Map / Foundry Map:** No change.
- **Component Registry:** Auto-generated; no manual update.
- **Decision Record:** No new ADR — this implements existing ADR-0003. ADR-0003's enforcement section could be amended to cite the new linter checks as the automated guard (Steward's call).

## Self-Debrief

### What Went Well

- Studying admin first (the simpler compliant reference) paid off — the showcase migration was a near-mechanical mirror of admin's three-file pattern.
- Reading the fs-router `createRouterLink` runtime impl confirmed `inheritAttrs` lets the UnoCSS attributify attributes and `:class` fall through onto the rendered `<a>`, so the nav styling survived the swap without rework.
- Catching the `@app/*` alias scope (families + admin only, not showcase) before writing imports avoided a type-check failure.

### What Went Poorly

- First cut of the regression spec returned a relative fixture path while the file lived in a temp dir — the linter's `readFileSync` resolved against `frontend/` cwd, the file wasn't there, and the linter crashed with exit 1, masquerading as a "detection" pass on the raw fixtures and a hard fail on the compliant ones. Fixed by returning the absolute temp path (which still contains `src/apps/`, satisfying the rule's path check).
- First `App.spec.ts` used `ref()` inside `vi.hoisted()` — hoisted runs before imports, so `ref` was undefined (`Cannot access '__vi_import_1__' before initialization`). Swapped to a plain hoisted stub object, since the component only reads `currentRouteRef.value.name`.

### Blind Spots

- I initially assumed the showcase had an oxlint per-app override I'd need to extend; it had none. Worth verifying the actual config rather than assuming symmetry across apps.
- Didn't initially register a vitest project for the showcase app root — the existing showcase project only covered `components/`. Caught it because the new `App.spec.ts` otherwise wouldn't run.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| When a regression test invokes a CLI/script against fixtures, return the **absolute** on-disk path (not a cwd-relative one) and verify it both exists for `readFileSync` AND contains the substring the rule keys on. | Relative fixture path crashed the linter subprocess, producing a false "pass" on the raw cases and a false "fail" on the compliant cases. | This record |
| Never call Vue runtime helpers (`ref`, `reactive`, `computed`) inside `vi.hoisted()` — hoisted bodies run before module imports resolve. Use plain JS stubs (objects/`vi.fn`) for hoisted mock state. | `ref()` in `vi.hoisted()` threw `Cannot access ... before initialization`. | This record |
| When closing a per-app convention via linting, enumerate every app folder and confirm each is in the rule's scope before assuming the existing config covers them. | The showcase had no oxlint override block at all, which is exactly why the violation survived every gate. | This record |
