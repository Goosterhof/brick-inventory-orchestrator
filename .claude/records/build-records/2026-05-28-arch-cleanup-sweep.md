# Build Record: Arch cleanup sweep — bundle WOs 1-6

**Build Record #:** 2026-05-28-arch-cleanup-sweep
**Filed:** 2026-05-28
**Umbrella Work Order:** [`2026-05-28-arch-cleanup-sweep`](../work-orders/2026-05-28-arch-cleanup-sweep.md)
**Sibling Work Orders covered:**

- [`2026-05-27-arch-cleanup-1-showcase-section-heading-singles`](../work-orders/2026-05-27-arch-cleanup-1-showcase-section-heading-singles.md)
- [`2026-05-27-arch-cleanup-2-showcase-multi-and-shared`](../work-orders/2026-05-27-arch-cleanup-2-showcase-multi-and-shared.md)
- [`2026-05-27-arch-cleanup-3-app-shells-and-auth`](../work-orders/2026-05-27-arch-cleanup-3-app-shells-and-auth.md)
- [`2026-05-27-arch-cleanup-4-sets-pages`](../work-orders/2026-05-27-arch-cleanup-4-sets-pages.md)
- [`2026-05-27-arch-cleanup-5-storage-pages-and-modals`](../work-orders/2026-05-27-arch-cleanup-5-storage-pages-and-modals.md)
- [`2026-05-27-arch-cleanup-6-parts-about-brickdna`](../work-orders/2026-05-27-arch-cleanup-6-parts-about-brickdna.md)

**Builder:** Brickwright
**Wing:** Gallery
**Branch:** `arch-cleanup-sweep`

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):** All 7 Work Orders (umbrella + 6 siblings) ship with `Status: Open`. After this Build Record's PR merges to `main`, a follow-up commit on `main` flips the Status on all 7 and adds Build Record back-links. Do NOT close the WOs in the same branch as this Build Record. (PR #138 lesson.)

---

## Headline Outcome

**7 of 33 specs cleanable; 26 non-cleanable per WO escape valve.** The WO acceptance criterion "all 33 imports removed" turned out to rest on a false premise (see Decisions Made §1) — most specs use `findComponent(ImportedClass)` class selectors without `vi.mock(...)` infrastructure, which the WO explicitly excluded ("Do not invent `vi.mock` stubs — that's a separate WO").

Of the 7 cleanable specs:

- **6 fully cleaned** (entire allowlist entry removed): ScanSetPage, StorageOverviewPage, AboutPage, BrickDnaPage, PartsMissingPage, PartsUnsortedPage.
- **1 partially cleaned** (one import + allowlist trim): SetDetailPage (PlacePartModal dropped; 4 other imports remain).

After cleanup the `LEGACY_CROSS_COMPONENT_IMPORTS` allowlist shrinks from **33 entries** to **27 entries** (the WO's stated target was 6 split-spec entries — not reachable in this sweep; 21 legacy debt entries remain pending precursor WOs).

**Headline collect-delta:** `AboutPage.spec.ts` (the 47-day-old Casebook Standing Suspicion) Vite Duration **3.60s → 1.18s** (transform 370ms → 148ms, import 457ms → 188ms). The 16 Lego shape imports were the highest-impact single-spec payoff and the Standing Suspicion is closed.

## Work Summary

### Per-sibling-WO breakdown

| WO | Specs in scope | Specs cleaned | Specs non-cleanable | Imports removed | Allowlist entries removed |
|---|---|---|---|---|---|
| WO 1 (showcase SectionHeading) | 7 | 0 | 7 | 0 | 0 |
| WO 2 (showcase multi + shared) | 6 | 0 | 6 | 0 | 0 |
| WO 3 (app shells + auth + home) | 5 | 0 | 5 | 0 | 0 |
| WO 4 (sets pages) | 5 | 1 + 1 partial | 3 + 1 partial | 4 + 1 = 5 | 1 full + 1 partial trim |
| WO 5 (storage + modals) | 5 | 1 | 4 | 5 | 1 |
| WO 6 (parts + about + brickdna) | 5 | 4 | 1 | 37 | 4 |
| **Aggregate** | **33** | **7 (6 full, 1 partial)** | **26** | **47** | **6 full + 1 partial** |

### Files touched

| File | Action | Notes |
|---|---|---|
| `frontend/src/tests/unit/apps/families/domains/sets/pages/ScanSetPage.spec.ts` | Modified | -4 imports, selector conversion, vm.$emit cast |
| `frontend/src/tests/unit/apps/families/domains/sets/pages/SetDetailPage.spec.ts` | Modified | -1 import (PlacePartModal only); selector conversion for the modal |
| `frontend/src/tests/unit/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` | Modified | -5 imports, selector conversion, vm.$emit cast |
| `frontend/src/tests/unit/apps/families/domains/about/pages/AboutPage.spec.ts` | Modified | -16 imports, selector conversion, `.props(...)` casts |
| `frontend/src/tests/unit/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts` | Modified | -5 imports, selector conversion |
| `frontend/src/tests/unit/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` | Modified | -7 imports, selector conversion, `emit` helper |
| `frontend/src/tests/unit/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts` | Modified | -9 imports, selector conversion, `emit` helper |
| `frontend/src/tests/unit/architecture.spec.ts` | Modified | Removed 6 full allowlist entries + trimmed PlacePartModal from SetDetailPage entry (-58 net lines) |

### Commits on branch

| SHA | Message |
|---|---|
| `5c311e5` | docs(atrium): file umbrella WO bundling arch-cleanup sibling WOs 1-6 (pre-existing) |
| `6e6a56c` | test: arch-cleanup 4 — drop unused imports in ScanSet/SetDetail specs |
| `96a0289` | test: arch-cleanup 5 — drop unused imports in StorageOverviewPage spec |
| `69dcc3e` | test: arch-cleanup 6 — drop unused imports in About/BrickDna/Parts specs |

Three substantive commits chosen over six because WOs 1, 2, 3 turned out fully non-cleanable — no diff to package per their slug.

## Collect-Delta Measurements

Vite `--run` Duration per spec, measured cold (no shared transform cache) on the same hardware before and after the cleanup. Three components: `transform` (Vite SFC/TS compile), `import` (module-graph resolution), `tests` (test execution body), `environment` (JSDOM setup). The collect-phase contributors are `transform` + `import`.

| Spec | Before (Duration) | After (Duration) | Transform Δ | Import Δ |
|---|---|---|---|---|
| `AboutPage.spec.ts` (WO 6 headline — 16 imports) | 3.60s | **1.18s** | 370ms → 148ms (-60%) | 457ms → 188ms (-59%) |
| `BrickDnaPage.spec.ts` (WO 6 — 5 imports) | 3.66s | 991ms | 569ms → 171ms (-70%) | 745ms → 214ms (-71%) |
| `PartsMissingPage.spec.ts` (WO 6 — 7 imports) | 3.18s | 1.18s | 485ms → 205ms (-58%) | 650ms → 242ms (-63%) |
| `PartsUnsortedPage.spec.ts` (WO 6 — 9 imports) | 3.78s | 1.14s | 698ms → 258ms (-63%) | 805ms → 282ms (-65%) |
| `StorageOverviewPage.spec.ts` (WO 5 — 5 imports) | 4.01s | 932ms | 450ms → 178ms (-60%) | 538ms → 218ms (-59%) |
| `ScanSetPage.spec.ts` (WO 4 — 4 imports) | 3.32s | 2.45s | 568ms → 474ms (-17%) | 627ms → 567ms (-10%) |
| `SetDetailPage.spec.ts` (WO 4 partial — 1 import) | 5.56s | 2.16s | 2.15s → 968ms (-55%) | 2.29s → 1.07s (-53%) |

Significant per-spec collect-time reductions across all cleaned specs, with the largest absolute savings on the heaviest pre-cleanup spec (`SetDetailPage`: -2.4s in transform, -1.2s in import — even though we only dropped one import, the PlacePartModal subgraph carries `@phosphor-icons/vue` transitive deps that dominate the module graph). The `ScanSetPage` delta is the smallest (the spec's heavy components — BarcodeScanner with hardware shims, BackButton — were already `vi.mock`-ed, so the static imports were not the binding constraint).

**WO 1 sampling, WO 2 `FormValidationWorkbench`, WO 3 `HomePage`, WO 4 `AddSetPage`/`EditSetPage`** — not measured because these specs turned out non-cleanable (see Non-Cleanable Specs section). Their collect-deltas remain pending precursor `vi.mock` infrastructure WOs.

## Non-Cleanable Specs

The WO escape valve (umbrella WO § Acceptance Criteria, "BR records any non-trivial findings: missing `vi.mock` stubs that blocked a removal") applies to 26 specs. The root cause is **uniform across the non-cleanable set**: the spec uses `findComponent(ImportedClass)` as the wrapper-find selector AND does not have a corresponding `vi.mock(...)` factory with a `name: 'X'` field. Removing the static import would either:

1. Break `findComponent(X)` (the spec passes the imported class as the selector argument), OR
2. Break the `shallowMount({global: {stubs: {X}}})` stub-object reference (the spec passes the real component as a stub override), OR
3. Cause the spec to lose access to the component's props/template (in cases where Vue's default auto-stub doesn't render the assertions' expected text).

Adding the missing `vi.mock` factories AND converting class selectors to name selectors AND converting `stubs: {X}` literal stubs to mock-driven stubs constitutes new test infrastructure — explicitly out of scope per WO 1's "Do not invent `vi.mock` stubs — that's a separate WO."

### Non-cleanable inventory by category

**Category A — `stubs: {X}` pattern (showcase specs).** The component is passed to `shallowMount({global: {stubs: {X}}})` as a *real* override stub so its template renders the props for text assertions like `expect(wrapper.text()).toContain('05')`. Removing the import breaks the stubs object literal. Adding a `vi.mock(...)` with a custom template would replicate the existing stub but at the module-mock layer — a separate WO.

- `apps/showcase/components/AntiPatterns.spec.ts` (SectionHeading)
- `apps/showcase/components/BrandVoice.spec.ts` (SectionHeading)
- `apps/showcase/components/BrickDimensions.spec.ts` (SectionHeading)
- `apps/showcase/components/BrickShapes.spec.ts` (SectionHeading)
- `apps/showcase/components/ColorPalette.spec.ts` (SectionHeading)
- `apps/showcase/components/SnapDemo.spec.ts` (SectionHeading)
- `apps/showcase/components/TypographySpecimen.spec.ts` (SectionHeading)
- `apps/showcase/components/ComponentHealthMocked.spec.ts` (SectionHeading)
- `apps/showcase/components/DialogServiceDemo.spec.ts` (PrimaryButton, SectionHeading)
- `apps/showcase/components/FormValidationWorkbench.spec.ts` (DateInput, NumberInput, PrimaryButton, SectionHeading, SelectInput, TextInput, TextareaInput)
- `apps/showcase/components/ResourceAdapterPlayground.spec.ts` (DangerButton, NumberInput, PrimaryButton, TextInput — has `vi.mock` factories but **without** `name:` fields; the mocks would need `name` added before name-selectors work)
- `apps/families/App.spec.ts` (NavHeader, NavMobileLink — already has `vi.mock` with `name`, but ALSO uses `stubs: {NavHeader, NavMobileLink}` for nested rendering; the stubs object would need refactoring)

**Category B — `findComponent(X)` class selector without `vi.mock`.** The component is used as the wrapper-find selector but no module mock exists for it. Removing the import breaks the selector; adding the mock is new infrastructure.

- `shared/components/ConfirmDialog.spec.ts` (ModalDialog)
- `shared/components/EmptyState.spec.ts` (LegoBrick)
- `apps/admin/App.spec.ts` (NavLink)
- `apps/families/domains/auth/pages/LoginPage.spec.ts` (PrimaryButton, TextInput)
- `apps/families/domains/auth/pages/RegisterPage.spec.ts` (PrimaryButton, TextInput)
- `apps/families/domains/home/pages/HomePage.spec.ts` (CardContainer, LegoBrick, NavLink, PageHeader, StatCard, YearDistributionChart)
- `apps/families/domains/sets/pages/AddSetPage.spec.ts` (DateInput, NumberInput, PrimaryButton, SelectInput, TextInput, TextareaInput)
- `apps/families/domains/sets/pages/EditSetPage.spec.ts` (ConfirmDialog, DangerButton, LoadingState, NumberInput, PrimaryButton, SelectInput)
- `apps/families/domains/sets/pages/IdentifyBrickPage.spec.ts` (BackButton, CameraCapture, PageHeader, PrimaryButton)
- `apps/families/domains/sets/pages/SetDetailPage.spec.ts` (BackButton, LoadingState, PartListItem, PrimaryButton — **the 4 residual entries; PlacePartModal was cleanable and removed**)
- `apps/families/domains/storage/pages/AddStoragePage.spec.ts` (NumberInput, PrimaryButton, TextInput, TextareaInput)
- `apps/families/domains/storage/pages/EditStoragePage.spec.ts` (ConfirmDialog, DangerButton, LoadingState, NumberInput, PrimaryButton, TextInput, TextareaInput)
- `apps/families/domains/storage/pages/StorageDetailPage.spec.ts` (BackButton, DetailRow, EmptyState, LoadingState, PartListItem, PrimaryButton)
- `apps/families/modals/PlacePartModal.spec.ts` (ModalDialog, NumberInput, PrimaryButton, SelectInput)
- `apps/families/domains/parts/modals/PartUsageModal.spec.ts` (EmptyState, ListItemButton, ModalDialog)

### Recommended follow-up

A precursor WO is needed before WO 1, 2, 3, plus residual entries from WO 4, 5: **"Add `vi.mock` infrastructure with `name:` fields to N specs and convert their `findComponent(X)` class selectors to `findComponent({name: 'X'})` name selectors."** That WO would unblock the second pass of the arch-cleanup sweep, after which the remaining 26 allowlist entries can be removed.

This precursor WO is itself well-scoped (no SUT changes, no behavior changes, only test-mocking infrastructure addition), but it's distinctly a separate work batch from "delete unused imports" — different mental model, different review surface.

## Decisions Made

### 1. WO escape-valve interpretation: leave non-cleanable specs untouched

The umbrella WO § Acceptance Criteria includes the escape valve "BR records any non-trivial findings: missing `vi.mock` stubs that blocked a removal, unexpected `findComponent({name: 'X'})` failures, transitive import chains worth flagging." The per-WO mechanics also state: "If a spec turns out to be **non-cleanable** (e.g., the `vi.mock` is missing and `findComponent({name: 'X'})` would fail without the real import), leave that spec's import AND its allowlist entry intact and **document the finding in the Build Record**. Do not invent `vi.mock` stubs — that's a separate WO."

The audit (Python script across all 33 spec files) found that **only 7 specs satisfied the "vi.mock with name field exists for the component" precondition**. Per the escape valve I left the remaining 26 specs untouched and documented them above.

**Alternative considered:** unilaterally expand scope to add `vi.mock` infrastructure where missing. **Rejected** because (a) the WO explicitly fences this out, (b) it would turn a mechanical-deletion bundle into a test-architecture redesign affecting ~25 specs and likely 100+ new lines of `vi.mock` factory code, (c) those mocks have non-trivial choices to make (which props to expose, which templates to render, how `slot` content propagates) that need design review — not a Brickwright unilateral call.

### 2. Selector conversion treated as in-scope mechanical work, not "inventing mocks"

For each of the 7 cleanable specs, the existing `vi.mock(...)` factories already carried `name: 'X'` fields. The spec body, however, used `findComponent(X)` class selectors (passing the imported component class). Converting to `findComponent({name: 'X'})` was mechanical — same runtime semantics, no behavior change, no new infrastructure. I treated this conversion as part of "remove the unused import" rather than a separate WO. Without the conversion, the imports remain load-bearing (they're the selector arguments) even though the module is mock-stubbed.

This matches the pattern already established in PR #119 (PartsPage.spec.ts) which is referenced by WO 6 as the canonical "already cleaned" example.

### 3. Three commits, one per affected sibling WO — not six

The brief offered "6 commits (one per sibling WO) OR 1 combined commit." I chose **three** because WOs 1, 2, 3 had zero cleanable specs — they produce no diff and there's nothing to commit under their slug. Filing 3 empty commits for paper-trail symmetry seemed worse than 3 substantive commits + clear BR documentation of which WOs produced no diff.

Commit structure:
- `6e6a56c` — WO 4 work (ScanSet + SetDetail partial + arch allowlist trims)
- `96a0289` — WO 5 work (StorageOverview + arch allowlist trim)
- `69dcc3e` — WO 6 work (About + BrickDna + PartsMissing + PartsUnsorted + arch allowlist trims)

Each commit's footer cites the specific sibling WO slug for post-merge close-out scripts.

### 4. SetDetailPage partial cleanup vs no cleanup

The spec had 5 imports in its allowlist entry. Only PlacePartModal had the `vi.mock(...) name: 'X'` precondition met. Two options:

- **Drop only PlacePartModal, trim the allowlist entry from 5 to 4** (chosen).
- Leave the spec entirely untouched, document the 1 partial item as a finding.

I chose partial cleanup because (a) the cleanup IS valid — the modal's transitive `@phosphor-icons/vue` deps are exactly the kind of collect-phase debt ADR-0012 targets — and the measured collect-delta (-3.4s Duration) confirms the value, (b) partial allowlist trimming is well-supported by the arch test's self-cleaning mechanism: the entry stays in the allowlist with a shorter list, and any remaining disallowed import keeps the entry valid.

### 5. `.props(...)` casts inside `.map()` callbacks satisfy oxlint `no-unsafe-*`

After converting class selectors to name selectors, `findAllComponents({name: 'X'})` returns `VueWrapper<any>[]` and `.props(...)` returns `any`. Inside `.map()` callbacks, `.props('color')` triggers `typescript(no-unsafe-return)`. The cleanest fix matches the existing pattern in `SetsOverviewFiltering.spec.ts` (a split-spec already on the cleaned shape): inline `as TYPE` annotation on the `.props(...)` call:

```ts
const colors = bricks.slice(0, 4).map((brick) => brick.props('color') as string);
```

Applied uniformly to all 16 Lego shape props in AboutPage plus the `quantity`/`name`/`colorName` props in PartsMissingPage and PartsUnsortedPage. No new helper required.

### 6. `vm.$emit(...)` casts via `ComponentPublicInstance`

Same problem at the `.vm.$emit(...)` site — `.vm` is typed `any`, so `.vm.$emit('click')` triggers `no-unsafe-call` + `no-unsafe-member-access`. Two patterns in use:

- **Helper function** (matches PartsPage.spec.ts canonical): `const emit = (wrapper: VueWrapper | undefined, event: string): void => (wrapper?.vm as ComponentPublicInstance | undefined)?.$emit(event)`. Used in PartsMissingPage and PartsUnsortedPage (specs with many `chip?.vm.$emit('click')` instances).
- **Inline cast** (terser, supports multi-arg emit): `(wrapper.findComponent({name: 'X'}).vm as ComponentPublicInstance).$emit('detect', '5702015357197')`. Used in ScanSetPage (many `findComponent.vm.$emit('detect', payload)` instances), SetDetailPage, StorageOverviewPage.

Both patterns coexist in the canonical PartsPage.spec.ts already — they're not in tension; each is shorter than the other in different contexts.

### 7. WO acceptance criterion "after cleanup, the 6 split-spec entries are the only remaining entries" — NOT met

Per the WO § Acceptance Criteria: "After cleanup, the 6 split-spec entries are the only remaining entries in `LEGACY_CROSS_COMPONENT_IMPORTS`." This was based on the assumption that all 33 entries could be removed mechanically. Given the false-premise finding (Decision §1), the achievable end state is 27 entries remaining: 6 split-spec + 20 legacy debt + 1 partially-cleaned (SetDetailPage with 4 imports remaining).

This is documented honestly here as a **partial fulfillment**. The umbrella WO's broader goal — drain the 47-day-old AboutPage Standing Suspicion and prove the collect-delta payoff — is fully met. The numerical end-state criterion is not.

## Verification

### Quality Gauntlet (final state on `arch-cleanup-sweep` HEAD)

| Check | Result |
|---|---|
| `npm run format:check` | All matched files use the correct format (333 files) |
| `npm run lint` (oxlint --type-aware) | 0 errors, ~5 pre-existing warnings (untouched) |
| `npm run lint:vue` | All conventions passed |
| `npm run type-check` | Pass |
| `npm run test:coverage` | 115/115 test files, 1413/1413 tests passing; coverage 100% across statements (1445/1445), branches (1118/1118), functions (422/422), lines (1344/1344) |
| `npm run knip` | 0 unused exports |
| `npm run size` | families: 129.85 kB / 350 kB; admin: 30.91 kB / 150 kB |
| `npm run build` | Built in ~7s; no errors |
| `npm run test:unit -- --run src/tests/unit/architecture.spec.ts` | 34/34 passing (including the SUT-only imports test) |

### Pre-commit gauntlet

All three commits passed the orchestrator pre-commit dispatcher cleanly (registry regeneration → format → lint-staged). No `--no-verify` used.

### Pre-push gauntlet

Not invoked yet — branch held local per instructions. Will fire on `git push`.

### Architecture test self-cleaning behavior verified

With 6 full allowlist entries removed + 1 partial trim + 7 spec changes, the arch test reports 0 stale allowlist entries (the self-cleaning assertion) AND 0 new violations. End state of `LEGACY_CROSS_COMPONENT_IMPORTS` matches the post-cleanup audit: 27 entries (33 - 6).

## Methodology Objection

None. The WO escape valve was already in the brief and worked as designed — the WO acknowledges the possibility of non-cleanable specs and prescribes the documentation path, which is exactly what was followed.

## Self-Debrief

### What went well

- **Audit-first approach saved scope creep.** Building the Python audit script before touching any spec exposed the 7-vs-33 cleanability split early. Without it I would have started edits, hit failures, and rolled back — net cost likely 2-3x.
- **Per-spec verification after each edit** caught the lint-error class (`no-unsafe-*` from `any`-typed `findComponent({name: ...})`) before it accumulated across 7 specs. Fix-once-then-apply was cleaner than fix-at-the-end-of-everything.
- **Headline collect-delta (AboutPage 3.60s → 1.18s)** validates ADR-0012's premise and closes the 47-day-old Standing Suspicion — the highest-symbolic-value outcome of the sweep.

### What I would do differently

- **Earlier audit dispatch.** I spent ~10 minutes reading WO mechanics and the first 2-3 specs before realizing the audit was needed. A faster path: audit-first as a mandatory step for any sweep WO that lists >5 affected files. (Candidate for the Brickwright graduation log.)
- **Tighter commit-vs-arch-spec choreography.** The mid-execution dance of resetting `architecture.spec.ts` to HEAD then re-applying only the WO-N hunks worked but was fiddly. For future per-WO commit splits with a shared metadata file, a better pattern is to use `git checkout -p` to stage per-hunk, or accept "one combined commit" when the metadata file is small.

### Training proposal (for Steward review)

**Proposal:** *"For any sweep WO that names >5 files in tabular form (e.g., `### In the Box | # | Spec | Imports |`), run a Python/grep audit across the full file list to verify the WO premise BEFORE editing any spec. The audit should classify each file as Cleanable / Non-Cleanable / Partial against the WO's stated preconditions. Confirm with The Steward before deviating from the WO's headline scope."*

**Confirming observation count:** 1 (this build record). Needs second confirming observation in a future sweep before graduation per the Graduation Protocol.

**Rationale:** The WO premise here (33 specs mechanically cleanable) turned out to be wrong, and the escape valve absorbed the deviation cleanly because the BR documented it. But discovering this *during* execution rather than *before* cost ~15 minutes of recoverable scope thrash. An audit-first habit would compress that loop.

---

**Status:** Filed (awaiting Steward review). Branch `arch-cleanup-sweep` held local with 3 commits + this BR; no push.
