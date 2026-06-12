# Build Record: User Feedback → Kendo Reports (full path)

**Build Record #:** 2026-06-12-kendo-report-filing
**Filed:** 2026-06-12
**Builder:** Brickwright (cross-wing: Foundry + Gallery)
**Wing:** Atrium (cross-wing)
**Work Order:** [`2026-06-09-kendo-report-filing`](../work-orders/2026-06-09-kendo-report-filing.md)
**Branch:** `feat/kendo-report-filing`
**Build commits:** `ac7fd3f` (Foundry — `feat(family): relay user feedback to the kendo board via kendo-report-tool`), `ee86c90` (Gallery — `feat: add feedback modal relaying reports to the kendo board`)

---

## Work Summary

Built the full feedback path: a `FeedbackModal` in the Gallery's families app (header affordance next to Logout) → `POST /api/feedback` in the Foundry → `KendoReports::submit()` relaying title, description, author name, and up to 5 screenshots into Kendo project **Brick Inventory (id 3)** as a multipart report. The vendor `KendoReports` class is injected **directly** into `SubmitFeedbackAction` — no wrapper interface, no adapter Service, per the WO's "the Action IS the seam" doctrine. Failures throw `ReportSubmissionException`, mapped globally to a 502 JSON error, which the Gallery surfaces as a "Couldn't send, try again" toast. The Kendo token lives server-side only (`REPORT_TOOL_TOKEN` env); nothing token-shaped reaches the browser.

`composer require script-development/kendo-report-tool` resolved **^0.1.0**; ServiceProvider auto-discovered (binds the `KendoReports` singleton, merges `report-tool` config). WO external-state claims verified against the installed vendor source, not memo text: `submit(string $title, string $description, ?string $authorName = null, array $files = []): ?array`, throws-by-default (`swallow=false`), config keys `report-tool.{kendo_url,project,token,connect_timeout,timeout,swallow}` — all confirmed in `vendor/script-development/kendo-report-tool/src/`.

## Deliverables

### Foundry (`backend/`)

| Action | File | Notes |
|---|---|---|
| Modified | `composer.json` / `composer.lock` | `script-development/kendo-report-tool` ^0.1.0 |
| Modified | `.env.example` | `REPORT_TOOL_KENDO_URL`, `REPORT_TOOL_PROJECT=3`, `REPORT_TOOL_TOKEN=` (placeholder + CEO-provisioned comment, exactly per WO) |
| Created | `app/DataTransferObjects/Input/Feedback/SubmitFeedbackData.php` | Pure leaf: `title`, `description`, `list<UploadedFile> $screenshots`. **Name deviates from WO — see Deviations #1** |
| Created | `app/Http/Requests/Feedback/SubmitFeedbackRequest.php` | title required ≤255; description required ≤65535; screenshots nullable array max:5; `screenshots.*` image + mimes:jpg,jpeg,png,bmp,gif,tiff,webp + max:3072 KB. `toDto(): SubmitFeedbackData` |
| Created | `app/Actions/Feedback/SubmitFeedbackAction.php` | `final readonly`, single `execute(SubmitFeedbackData, string $authorName): array`. Injects vendor `KendoReports` directly. No try-catch — `ReportSubmissionException` bubbles. Swallow-mode `null` normalized to `[]` (unreachable in this app's config; covered anyway) |
| Created | `app/Http/Controllers/FeedbackController.php` | `store()` — method injection only; `#[CurrentUser] User $user`; passes `$user->name` as authorName; returns `JsonResponse($report, 201)` |
| Modified | `routes/api.php` | `POST /feedback` inside the `auth:sanctum` + `family.ownership` group, `->can('submitFeedback', Family::class)` |
| Modified | `app/Policies/FamilyPolicy.php` | New `submitFeedback(User): bool => true` ability (any authenticated family member) — see Deviations #3 |
| Modified | `bootstrap/app.php` | `ReportSubmissionException` → `['error' => 'Failed to send feedback']`, 502. No other mappings touched |
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Authenticated-route drift guard **36 → 37** (baseline captured from the pre-change test file) |
| Created | `tests/Unit/Actions/Feedback/SubmitFeedbackActionTest.php` | 4 tests — see Test Coverage |
| Created | `tests/Feature/Controllers/FeedbackControllerTest.php` | 11 tests — see Test Coverage |
| Modified | `tests/Unit/Policies/FamilyPolicyTest.php` | `submitFeedback` added to the always-allow dataset |

### Gallery (`frontend/`)

| Action | File | Notes |
|---|---|---|
| Created | `src/apps/families/modals/FeedbackModal.vue` | `<script setup lang="ts">`; TextInput (title) + TextareaInput (description) + native multi-file input (≤5, image accept list) with brick-border/brick-shadow styling; `useValidationErrors` + `useFormSubmit`; posts `FormData` via `familyHttpService.postRequest('/feedback', …)`; success toast `feedback.success`, failure toast `feedback.error`; per-file `screenshots.N` 422 errors surfaced on the file input |
| Modified | `src/apps/families/App.vue` | Feedback button (PhMegaphone) in the NavHeader `#actions` slot before Logout, logged-in only; renders `<FeedbackModal :open @close>`; Logout button gained `data-testid="logout-button"` for spec disambiguation |
| Modified | `src/apps/families/services/translation.ts` | New `feedback` section, EN + NL (schema-typed, both locales) |
| Modified | `src/tests/integration/stubs/phosphorIcons.ts` | `PhMegaphone` + `PhPaperclip` stubs (file's policy: every icon used in production code) |
| Created | `src/tests/unit/apps/families/modals/FeedbackModal.spec.ts` | 17 tests, stub-by-name `vi.mock` pattern (ADR-0012) — no cross-component top-level `.vue` imports |
| Modified | `src/tests/unit/apps/families/App.spec.ts` | 4 new tests (feedback button visibility ×2, modal open/close wiring); FeedbackModal `vi.mock`-stubbed at the spec boundary to keep the collect path shallow |
| Regenerated | `src/shared/generated/component-registry.json` | Pre-commit hook regeneration (automatic) |

## API Contract (agreed cross-wing before the Gallery build, per WO Notes)

`POST /api/feedback` — multipart fields `title`, `description`, `screenshots[]`. 201 → created Kendo report body (id + fields). 422 → Laravel validation shape (parsed to field errors). 502 → `{"error": "Failed to send feedback"}` → failure toast. 401 → unauthenticated.

**ADR-0029 gotcha verified, not assumed:** `frontend/src/apps/families/services/http.ts` line 13 — the request middleware already explicitly skips `FormData` (`config.data && !(config.data instanceof FormData)`), so no snake_case conversion applies to multipart. Field names are sent literally as the FormRequest expects. Asserted in `FeedbackModal.spec.ts` ("exact field names" test).

## Deviations from the Work Order

1. **DTO named `SubmitFeedbackData`, not `SubmitFeedbackInput`.** The WO specifies `App\DataTransferObjects\Input\Feedback\SubmitFeedbackInput`, but `DtoArchitectureTest` (`arch('data transfer objects should end with Data')`) hard-fails any DTO not suffixed `Data`, and every existing Input DTO follows it (`EmailInviteCodeData`, `IdentifyBrickData`, …). The arch test is the binding house rule; namespace kept exactly as specified.
2. **Affordance placement:** NavHeader `#actions` slot, desktop header, next to Logout — the only existing precedent for an authenticated global action (Logout itself). The mobile slide-out menu does not carry it, matching the Logout precedent. **The Pattern Master owns final placement and may refine** (e.g., mobile reachability, icon choice, or a footer treatment).
3. **`FamilyPolicy::submitFeedback` ability added (not in WO scope text).** `RoutingArchitectureTest` requires every `auth:sanctum` route to carry `can:` middleware (ADR-0020) or join an exemption list with justification. A real ability matching the house always-allow pattern is cleaner than growing the exemption list. Route-count drift guard updated 36 → 37 as the test's own instructions direct.
4. **`data-testid` added to the existing Logout button.** Minimal touch: with two buttons in the actions slot, `wrapper.find('button')` in `App.spec.ts` became ambiguous.

## Test Coverage

**Foundry — unit (4 tests, `SubmitFeedbackActionTest`):** `KendoReports` is `final` (unmockable by Mockery), so the Action is exercised through a real `KendoReports` wired to an **instance-level** `Illuminate\Http\Client\Factory` fake + a plain `Illuminate\Config\Repository` — no app boot, nothing hits a live Kendo host. Covers: full submit (URL, Bearer token, multipart title/description/author_name, 2 `files[]` parts with filenames), no-screenshots submit (no `files[]` parts), `ReportSubmissionException` bubbling on non-201 (no try-catch proof), swallow-mode `null` → `[]` normalization (kills the `?? []` mutant).

**Foundry — feature (11 tests, `FeedbackControllerTest`):** 201 with screenshots (incl. `Http::assertSent` on URL/token/fields/file parts), 201 without screenshots, 422 ×5 (missing title, missing description, title >255, 6 screenshots, file >3072 KB, non-image PDF), 401 unauthenticated, 502 on Kendo non-201, 502 on transport-level `ConnectionException`. All Kendo traffic via `Http::fake()` with `Http::assertNothingSent()` on every validation/auth rejection.

**Gallery (17 modal tests + 4 App tests):** open/title render, close propagation, FormData exact field names, `screenshots[]` parts, file list render, 5-file cap, null-files clear, single remove, last-remove hides list + re-keys input, success toast + reset + close, 502 failure toast + stays open, response-less axios error, non-axios error, 422 field errors on title/description without toast, per-file `screenshots.0` error display, empty-message-list edge (no alert), submit-button disable during in-flight request. Transport fully mocked.

## Verification — exactly what ran

Baselines captured pre-change per the graduated delta rule: `composer test` **711 passed (2906 assertions)** (`/tmp/baseline-test.log`); authenticated-route guard **36**; pulse-recorded mutation baseline 79.68%.

### Foundry

| Gate | Result | Numbers |
|---|---|---|
| `composer lint:test` | ✅ GREEN | Rector + Pint clean |
| `composer phpstan` | ✅ GREEN | 0 errors (level max) |
| `composer phpstan:types` | ✅ GREEN | OK, 159 files |
| `composer deptrac` | ✅ GREEN | **0 violations**, 753 allowed, 0 warnings — vendor `KendoReports` in the Action passes cleanly: Deptrac collectors are `App\\*` classLike patterns, vendor classes are simply uncollected. No config change needed, no wrapper needed |
| `composer test:arch` | ✅ GREEN | 111 passed (1915 assertions) |
| `composer test` | ✅ GREEN | **727 passed (2968 assertions)** — +16 over the 711 baseline |
| `composer test:coverage` | ✅ GREEN | **Total 100.0%** (unit; `SubmitFeedbackAction` 100.0%) |
| `composer test:feature-coverage` | ✅ GREEN | **Total 100.0%** (`FeedbackController` 100.0%; floor is 90%) |
| `composer mutation` | ✅ GREEN | **80.40%** (719 tested, 3 timeout; 76% floor; up from the 79.68% pulse baseline) — exit 0 |

### Gallery

| Gate | Result | Numbers |
|---|---|---|
| `npm run format:check` | ✅ GREEN | All matched files use the correct format |
| `npm run lint` | ✅ GREEN | 0 errors (pre-existing warnings only: `architecture.spec.ts` ×2, `lint-vue-conventions.spec.ts`, `FilterChip.spec.ts` — untouched files) |
| `npm run lint:vue` | ✅ GREEN | All conventions passed |
| `npm run type-check` | ✅ GREEN | vue-tsc clean |
| `npm run test:coverage` | ✅ GREEN | **1449 tests / 118 files**; statements **100%** (1502/1502), branches **100%** (1141/1141), functions **100%** (439/439), lines **100%** (1395/1395) |
| `npm run knip` | ✅ GREEN | 0 findings |
| `npm run build` | ✅ GREEN | All 3 apps built |
| `npm run size` | ✅ GREEN | families **132.58 kB** / 350 kB; admin **30.49 kB** / 150 kB (brotli) |
| `npm run test:integration:run` | ✅ GREEN | **143/143 passed, exit 0** — see flake note below |
| SUT-only Vue-import arch test | ✅ GREEN | Both new/touched specs use stub-by-name `vi.mock`; legacy allowlist **not** grown |
| Collect guard | ✅ quiet | The interim 974ms `App.spec.ts` delta (from a top-level `FeedbackModal` import) was eliminated by `vi.mock`-stubbing the modal at the spec boundary before commit |

### Hooks

Pre-commit fired for real on both commits (backend CaptainHook gauntlet on `ac7fd3f`; registry regen + lint-staged on `ee86c90` — lint-staged **rejected the first Gallery commit attempt** on a missing `vi.fn` type parameter, fixed and re-committed). No `--no-verify` anywhere. Pre-push fires on push (below).

**Integration-suite flake (pre-existing pattern, not this WO):** one of three runs reported an unhandled `EnvironmentTeardownError` — `LoginPage.spec.ts`'s lazy route-import chain (`services/index → router → home domain → stores`) racing environment teardown. 143/143 passed and exit code was 0 in all runs; two subsequent runs were clean. The traversal chain contains no file this WO created; flagging for the Warden's awareness rather than claiming a fix.

## Outstanding CEO Prerequisites — live smoke test BLOCKED on these

The end-to-end smoke test (real report visible on the Kendo board, `source = Api`, correct `author_name` + attachment) **cannot run** until the CEO provisions:

1. **Activate the `report-tool` feature** on Kendo project Brick Inventory (id 3) — hard precondition; `EnsureFeatureActive:report-tool` rejects every submission without it.
2. **Mint a project token** under project 3 with the **`report:create`** ability.
3. **Set `REPORT_TOOL_TOKEN`** in the Railway **web** service env (synchronous send — the worker is not involved). Confirm `REPORT_TOOL_KENDO_URL=https://goosterhof.kendo.dev` and `REPORT_TOOL_PROJECT=3` there too.

Until then, the forced-failure path is the guaranteed behavior in production: a submission returns 502 and the Gallery shows the failure toast — surfaced, not silent, per the acceptance criterion.

## Candidate Learnings (observations, not settled rules)

1. **[Gallery] shallowMount auto-stubs override `vi.mock` stub templates and don't render named slots.** When a spec needs slot content from a `vi.mock`'d child (e.g. ModalDialog's `title`/default slots), unstub by name in mount options: `global: {stubs: {ModalDialog: false, …}}`. Plain `mount` is barred by the mount-boundary arch test; the explicit-stub-object workaround (PlacePartModal.spec) predates the SUT-only rule. Two house patterns now coexist — worth one canonical idiom.
2. **[Foundry] Final vendor classes are testable without the app container:** instance-level `new HttpFactory()` + static `Factory::response()` fakes + a literal `Illuminate\Config\Repository` give a fully assertable real-object path in unit tests (`assertSent` works on the instance). Avoids both Mockery-on-final failures and `Http::` facade dependence in the Unit suite.
3. **WO-specified class names can collide with arch-test naming rules** (here: `SubmitFeedbackInput` vs the `*Data` suffix test). Verifying naming conventions against `tests/Architecture/` before creating WO-named classes avoids a rename mid-build. Possibly a WO-template note rather than agent training.

---

**Status:** Completed — code shipped on `ac7fd3f` + `ee86c90`; live smoke test awaiting CEO-provisioned prerequisites (see above)
