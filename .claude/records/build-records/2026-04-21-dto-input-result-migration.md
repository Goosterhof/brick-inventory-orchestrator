# Build Record: DTO Input/Result Migration — PR #160

**Build Record #:** 2026-04-21-dto-input-result-migration
**Filed:** 2026-05-26 (filed retroactively — work originally shipped 2026-04-21)
**Work Order:** [`2026-05-05-audit-remediation-5-paper-trail`](../work-orders/2026-05-05-audit-remediation-5-paper-trail.md) (the order that funded this archaeology)
**Builder:** Brickwright (Foundry)
**Wing:** Foundry

---

## Filed Retroactively

This Build Record was reconstructed on 2026-05-26 from the surviving on-disk artifacts and the audit record. The original work shipped on 2026-04-21 via PR #160 of the **standalone backend repo** (merge commit `56cd7e9`), spanning seven constituent commits:

- `6dd9145` — refactor: move DataTransferObjects into Input/ namespace
- `8e9cf1d` — refactor: move Action-return shapes from `Data/` to `Result/`
- `2cb1dff` — refactor: retire `ResourceDataSourceInterface` and relax `ComputedResourceData`
- `c16b5eb` — fix: restore `validateCsrfTokens()` after Laravel 13 upgrade inverted rename
- `8ed25c3` — chore: rewrite Deptrac layers for Input/Result split + retire Data layer
- `20316b6` — test: enforce Input/Result DTO placement by Action usage direction
- `f2adae1` — style: apply Pint + Rector canonical formatting after DTO migration

Plus a CLAUDE.md companion commit:
- `6a0cd39` — docs(claude.md): reframe DTO namespaces as Input/Result by usage direction

None of these commit SHAs is reachable from the orchestrator's history. The 2026-05-17 subtree absorption (`83c2f28`) was a content collapse, not a history merge — the entire pre-merger backend timeline was flattened into one snapshot commit. The reconstruction therefore depends on the surviving on-disk artifacts:

- `backend/app/DataTransferObjects/Input/` (current namespace, 7 domain subfolders) and `backend/app/DataTransferObjects/Result/` (5 domain subfolders) — the result of the move.
- `backend/tests/Architecture/DataTransferObjectPlacementTest.php` — the architecture test the migration introduced.
- `backend/deptrac.yaml` — current layer definitions with `InputDTO` and `ResultDTO` as sibling leaf layers.
- `backend/app/Http/Resources/ComputedResourceData.php` — current state, post-relaxation (no `ResourceDataSource` constraint on the generic, just `@template TSource of object`).
- `backend/CLAUDE.md` — current "DTOs — Input vs Result" section.
- The audit record's verbatim characterization of PR #160 ([`2026-05-05-full-sweep.md`](../audits/2026-05-05-full-sweep.md) Finding 7, Delivery B): "91 files changed, 774 insertions, 367 deletions … among the largest deliveries in the codebase's history."

A `git grep` for `ResourceDataSourceInterface` returns zero hits in `backend/app/` and `backend/tests/` — the marker interface retirement is confirmed by the absence of any current reference.

---

## Work Summary

A cross-cutting refactor that reshaped how the Foundry's typed value objects communicate across the Action boundary. The migration touched seven structural concerns in a single PR because they form a single coherent change: you cannot move the namespace, retire the marker, rewrite the boundary fences, and add the architecture test independently — each depends on the next.

The aggregate audit metric ("91 files changed, 774 insertions, 367 deletions") is captured here for the record; per-file reconstruction is not possible from the post-collapse state.

| Concern | Representative Surfaces (current paths) | What Changed |
|---|---|---|
| **Move 1: rename `App\Data\` → `App\DataTransferObjects\Input\`** | `backend/app/DataTransferObjects/Input/Auth/`, `…/BrickIdentification/`, `…/Brickognize/`, `…/Family/`, `…/FamilySet/`, `…/Lego/`, `…/StorageOption/` (7 domain subfolders) | All FormRequest-sourced and Service-sourced DTOs — every value object an Action **receives** — relocated under the `Input/<Domain>/` namespace. The domain subfolders were introduced as part of the move (the prior `App\Data\` was flat). |
| **Move 2: rename Action return shapes from `App\Data\` (or ad-hoc) → `App\DataTransferObjects\Result\`** | `backend/app/DataTransferObjects/Result/Family/`, `…/FamilyPart/`, `…/FamilySet/`, `…/Set/`, `…/Sync/` (5 domain subfolders) | Every value object an Action **returns** relocated under the `Result/<Domain>/` namespace. This is the move that gave the migration its name. |
| **Retire `ResourceDataSourceInterface`** | `backend/app/Http/Resources/ComputedResourceData.php` (current generic constraint is `@template TSource of object`); no `App\Contracts\ResourceDataSourceInterface` in current code | The marker interface from ADR-0010 (then 0010, now ADR-0025) was deleted along with its `implements` declarations on the Data DTOs that fed `ComputedResourceData`. The generic was widened to `object` because eligibility is now structural — only Result-namespace DTOs can be returned by Actions, and only Action returns feed ComputedResourceData subclasses in practice. |
| **Restore `validateCsrfTokens()` after Laravel 13 upgrade inverted rename** | `backend/bootstrap/app.php` (current state) | A drive-by fix bundled into the migration because the Laravel 12 → 13 upgrade renamed `validateCsrfTokens()` to `preventRequestForgery()` and inverted the semantics; the original commit message records that the migration carried the restore. |
| **Rewrite Deptrac layers** | `backend/deptrac.yaml` | The old single `Data` layer was retired. Two sibling leaf layers replaced it: `InputDTO` (rule: `→ Enum` only — pure leaf, no Models) and `ResultDTO` (rule: `→ Enum, Model` — Actions hand back collections of Models). Every other layer's allowed-deps row was rewritten to reference `InputDTO` and `ResultDTO` independently. The `Action → InputDTO, ResultDTO` edge is what enforces the Action-boundary directionality structurally. |
| **Add architecture test enforcing the placement rule** | `backend/tests/Architecture/DataTransferObjectPlacementTest.php` | Three Pest `test()` blocks, each scanning a directory via the shared `ArchTestHelper`:<br>1. `action return types that are DTOs live in the Result namespace` — reflects every `App\Actions\*::execute()` and asserts return types starting with `App\DataTransferObjects\` are in `…\Result\`.<br>2. `action parameter types that are DTOs live in the Input namespace` — reflects every `execute()` parameter and asserts DTO parameters are in `…\Input\`.<br>3. `form request toDto() return types that are DTOs live in the Input namespace` — also enforces `toDto()` carries an explicit return type. The three angles are what the audit's wording "enforces from three angles" refers to. |
| **Pint + Rector canonical pass** | `backend/composer.json` scripts: `composer lint` runs the same suite | After 91 files moved, namespaces shifted, and use-statements updated, the Pint + Rector pass ensured the canonical formatting was uniform across all touched files. |
| **CLAUDE.md update** | `backend/CLAUDE.md` "DTOs — Input vs Result" section, "Boundary Fences (Deptrac)" section, "Actions" section bullet referencing `App\DataTransferObjects\Input\*` for `toDto()` return type | Documented the new rule for future readers — the migration's prose half. |

## Work Order Fulfillment

Against the acceptance criteria of the funding Work Order (`2026-05-05-audit-remediation-5-paper-trail`):

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Retroactive build record reconstructs the seven-commit migration | Yes | Constituent commits enumerated above with their concerns mapped to current on-disk surfaces. |
| Decisions Made section captures the Input/Result naming rule | Yes | See below — the rule is stated first, the dependency-content consequence second, per the WO's framing. |
| Marker interface retirement covered | Yes | Documented above and in Decisions Made #2. |
| Architecture test (`DataTransferObjectPlacementTest`) covered | Yes | Documented above with all three test angles. |
| Deptrac layer rewrite covered | Yes | Documented above (`InputDTO`/`ResultDTO` sibling leaf layers replacing the old `Data` layer). |
| CLAUDE.md update covered | Yes | Documented above. |
| "Filed Retroactively" preamble noting original-work date vs. log-filing date | Yes | Top of file. |

## Decisions Made

### 1. The Input/Result naming rule — by Action usage direction at the boundary

**The rule, stated as the architecture intends to be read:** DTOs are split by usage direction at the Action boundary. `App\DataTransferObjects\Input` is what the Action receives; `App\DataTransferObjects\Result` is what the Action returns.

The rule is **about direction**, not content. A DTO's name and contents are domain-driven; its namespace is dictated by which side of the Action boundary it crosses. A FormRequest's `toDto()` produces an Input DTO because the next consumer is an Action's `execute()` parameter. A Service that builds a DTO for an Action consumes its own input internally, then hands the DTO into the Action — still Input. An Action's `execute()` return type is Result. A Controller calls `Action::execute()` and receives Result; the Controller's job is to wrap that Result for HTTP transport (`ResourceData` or `ComputedResourceData`), not to pass it onward to another Action.

**The consequence — which the original ADR's wording risked promoting to the rule:** Input DTOs structurally cannot reference Models, because they pre-date the Action's database work (they encode HTTP intent, validated by FormRequest, before any record exists). Result DTOs **may** carry `Collection<Model>`, a single `Model`, an `Enum`, or plain scalars — because they post-date the Action's database work and exist to hand domain entities back to the Controller for shaping. The consequence falls out of the rule; the rule does not fall out of the consequence.

**Why this framing matters:** the rejected framing was "DTOs that touch Models live in one namespace; DTOs that don't live in the other." That framing centers the dependency, not the direction. It would have been ambiguous for the FormRequest-sourced DTOs that happen to carry a `User` reference for ownership context, and for the Service-sourced DTOs that pre-resolve a Model the Action will then update. The direction framing has no such ambiguity: if the Action receives it, it is Input; if the Action returns it, it is Result. Deptrac then enforces the **consequence** as a separate fence (`InputDTO → Enum` only; `ResultDTO → Enum, Model`), but the rule a developer reasons about is the direction.

### 2. Retire `ResourceDataSourceInterface` because the namespace split makes the marker redundant

ADR-0010 (now ADR-0025) introduced `ResourceDataSourceInterface` as a marker on Data DTOs eligible to feed `ComputedResourceData`. The marker constrained the `ComputedResourceData<TSource of ResourceDataSource>` generic, preventing arbitrary objects from being passed.

After the Input/Result split, the marker became redundant: every DTO eligible to feed `ComputedResourceData` lives in `App\DataTransferObjects\Result\*` because the only thing that builds one is an Action returning it. The namespace itself is now the eligibility signal — an IDE search for "what can I pass into `from()`?" answers itself by scanning the `Result/` tree. The marker added no further constraint; it only added a second place to forget to update when a new computed-resource source class was introduced.

`ComputedResourceData`'s generic was therefore widened from `<TSource of ResourceDataSource>` to `<TSource of object>`. The structural eligibility is enforced by `DataTransferObjectPlacementTest` (Actions return Result-namespaced DTOs) plus Deptrac (`Controller → ResultDTO` is allowed; `Controller → InputDTO` makes no sense at the entry-point layer and would be a separate concern). The original ADR's "discoverability via IDE" justification for the marker is preserved — but discoverability is now by namespace, not by `implements` keyword.

### 3. Three architecture-test angles, not one, because the rule has three faces in the codebase

The migration could have shipped with a single architecture test (e.g., "every class in `App\DataTransferObjects\Result\*` is returned by at least one Action"). That framing would have been fragile — it asserts a property of the namespace contents, not a property of the Action boundary, and it would catch nothing if a developer added a DTO under `Input/` that the Action actually returns.

Three angles were chosen instead, all anchored at the Action and FormRequest declarations:

1. **Action return types** must be in `Result\*` — catches the most common drift (developer adds a new Action, declares its return type in the wrong namespace).
2. **Action `execute()` parameter types** must be in `Input\*` — catches the inverse (developer reuses a Result DTO as an Action input, which would smuggle a Model reference into a place that should be Model-free).
3. **FormRequest `toDto()` return types** must be in `Input\*` — catches the bridge between HTTP and Action; if a FormRequest produces a Result DTO, the boundary has been crossed at the wrong layer. The test additionally enforces that `toDto()` declares an explicit return type at all (a return-type-less `toDto()` is flagged as its own violation).

Each angle catches a class of drift the others would miss. Together they make the rule structurally enforceable: a developer cannot accidentally place a DTO in the wrong namespace without one of the three tests flagging it.

### 4. Retire the single `Data` Deptrac layer, replace with two siblings

The old `Data` layer had a single allowed-deps row. After the split, `InputDTO` and `ResultDTO` need divergent allowed-deps:

- `InputDTO → Enum` only. Anything more is a leak into HTTP-boundary purity.
- `ResultDTO → Enum, Model`. Actions hand back domain entities; the Result DTO is the courier.

A single layer with a union allowed-deps row would have permitted `Input → Model`, which is the exact leak the split exists to prevent. Two sibling layers is the only structurally honest representation.

The downstream cost is the rewrite of every layer's allowed-deps row that previously referenced `Data` — `Contract`, `Service`, `FormRequest`, `Action`, `Job`, `Controller`, `ResourceData` all needed updating to reference `InputDTO` and `ResultDTO` independently. That rewrite happened in `8ed25c3`.

### 5. Bundle the Laravel 13 `validateCsrfTokens()` restore into this PR

Commit `c16b5eb` is a drive-by — the Laravel 12 → 13 upgrade (PR #155, two days before this PR) inverted the rename `validateCsrfTokens()` → `preventRequestForgery()` and broke the CSRF exclusion for `api/*` in `bootstrap/app.php`. The restore was bundled here because the migration's gauntlet run surfaced the regression. Bundling vs. separate PR was a judgment call — bundling kept the CI run honest (one green gauntlet covers both changes), but it muddied the migration's commit graph. In retrospect a separate hotfix PR would have been cleaner; the bundling is a small ding on this delivery's hygiene.

## Quality Gauntlet

The original PR passed the standalone-backend CI before merging. The retroactive log adds no PHP code; gauntlet results that protect the in-tree state today are captured in the funding Build Record (`2026-05-26-audit-remediation-5-paper-trail.md`). Specifically, `composer phpstan` and `composer test:arch` were run from `backend/` as part of closing this archaeology — see that record for the verbatim output. Both passed.

## Showcase Readiness

This is the most showcase-relevant work in the warehouse's history below ADR-tier. A senior architect reviewing the repo sees:

1. **A real Action-boundary discipline expressed in the type system, not just the prose.** The `Input/` vs `Result/` namespaces communicate intent at every `use` statement. A junior reading an Action knows from the import which way the data flows.
2. **Three independent enforcement mechanisms.** Architecture tests at the reflection layer, Deptrac at the dependency layer, and PHPStan at the type layer all coalesce on the same rule. No single mechanism is load-bearing alone.
3. **A retired abstraction that earned its retirement.** `ResourceDataSourceInterface` did real work for two weeks; the migration replaced it with a structural property (namespace location) that subsumes its function. Removing a marker interface is harder than adding one — the codebase is more conservative with deletions than additions, which is what makes the retirement notable.

The unflattering corner is exactly what this Build Record exists to acknowledge: a 91-file delivery shipped without a Work Order or a Build Record. The audit's "third consecutive cycle the same pattern has appeared" wording is the structural finding. The Brickworks' response (ADR-0028 pre-push permit gate, plus the consolidated paper-trail vocabulary) is the right shape of fix — making "ship without paper trail" cost a `--no-verify` and a Steward sign-off.

## Proposed Knowledge Updates

These are candidates only; the Steward dispositions.

- **Decisions ledger:** the existing row `[0025] ComputedResourceData for DTO-sourced API responses | 2026-03-28 | Foundry | Accepted` in `.claude/docs/decisions.md` is now back-referenced by the ADR-0025 amendment landing in this same paper-trail closure. The Ledger row itself does not need re-wording — the ADR file carries the amendment.
- **Pulse — Pattern Maturity:** if the next pulse refresh re-states the DTO Input/Result split as "established (since 2026-04-21)", that wording matches the migration's actual shipping date. Currently the pulse has rolled forward without that callout because it predates this Build Record.
- **Learnings — none new.** The lessons (Input/Result by direction, marker interface retirement after namespace split makes it redundant, three-angle architecture test for boundary rules) are domain-shaped; promoting them to repo-wide Brickwright learnings risks generalizing them past their honest scope.

## Self-Debrief

Not applicable to the original work — that builder's debrief is lost. The retroactive reconstructor's debrief lives in the funding Build Record (`2026-05-26-audit-remediation-5-paper-trail.md`). The one observation worth noting here: reconstructing this Build Record from the post-collapse state was tractable because the **codebase itself carried the rule clearly** — the `DataTransferObjectPlacementTest`'s docblock states the Input/Result rule in prose, the deptrac layer comments distinguish leaf-purity vs Model-carrying, and the CLAUDE.md section frames the rule as direction-first. Architecture decisions that survive into the test docstrings and the dependency configuration are recoverable; architecture decisions that live only in commit messages and PR descriptions die when the history collapses. That is the structural lesson behind why ADR files matter more than commits.

---

**Status:** Closed (filed retroactively)
**Original Merge:** `56cd7e9` (standalone backend repo, PR #160) — not reachable in orchestrator history post-subtree collapse
**Constituent Commits:** `6dd9145`, `8e9cf1d`, `2cb1dff`, `c16b5eb`, `8ed25c3`, `20316b6`, `f2adae1`, plus the CLAUDE.md companion `6a0cd39` — none reachable
**Funding Work Order:** [`2026-05-05-audit-remediation-5-paper-trail`](../work-orders/2026-05-05-audit-remediation-5-paper-trail.md)
**Related ADR:** [`ADR-0025 — ComputedResourceData for DTO-Sourced API Responses`](../../docs/adr/0025-computed-resource-data.md) (amended 2026-04-21 to incorporate the rule changes this migration introduced; amendment filed retroactively in the same archaeology session as this log)
