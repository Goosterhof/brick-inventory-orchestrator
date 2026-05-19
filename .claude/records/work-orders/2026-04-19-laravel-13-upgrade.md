# Shipping Order: Laravel 13 Upgrade

**Order #:** 2026-04-19-laravel-13-upgrade
**Filed:** 2026-04-19
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Upgrade the warehouse from Laravel 12 to Laravel 13 (released 2026-03-17). Zero advertised breaking changes and PHP 8.4 already satisfies the new 8.3 minimum, so this is primarily a constraint bump, a sweep for removed APIs, and a selective adoption of new attributes and helpers that fit our existing architecture.

## Scope

### In the Crate

1. **Framework bump** — `laravel/framework: ^12.0` → `^13.0` in `composer.json`; run `composer update` and resolve any transitive dependency friction (Octane, Sanctum, Larastan, Pest plugins).
2. **Removed-API sweep** — grep for and eliminate any usage of methods removed in L13:
   - `Route::controller()`
   - `$request->has()` with array syntax (use `hasAny`/`hasAll`)
   - `Model::unguard()` / `Model::reguard()`
   - `Str::slug()` with custom separator as second positional arg (use named arg)
3. **Pagination audit** — L13 changes `Model::paginate()` default from 15 to 25. Audit every `paginate()` call; pass an explicit page size wherever the previous default was load-bearing.
4. **Queue-attribute evaluation for `ImportOwnedSetsJob`** — decide whether we want to declare any of `#[Tries]`, `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]`, `#[MaxExceptions]`, `#[UniqueFor]`. If the current bare `ShouldQueue` is the correct operational policy, document that decision in the shift log and make no change.
5. **`Cache::touch()` evaluation for `RebrickableService`** — review the four cache sites (keyed by `services.rebrickable.cache_ttl` / `user_cache_ttl`); where we fetch-and-restore solely to extend TTL, swap to `Cache::touch()`.
6. **Deploy runbook update** — add a "drain queue workers before deploying the L13 image" step to the deploy checklist (L12-serialized jobs fail on L13 workers).
7. **Full quality gauntlet** — lint, phpstan max, deptrac, arch tests, unit + feature coverage, mutation ≥ 76%.
8. **Boost MCP reconnaissance (optional)** — if the `/upgrade-laravel-v13` slash command is available to the sorter, use it for the rote edits; human verification is still mandatory.

### Not on This Pallet

- **`#[Middleware]` and `#[Authorize]` on controllers.** ADR-0008 mandates explicit routes owning their middleware and `->can()` declarations. Moving these into controller attributes fragments the dock manifest. If we ever want to revisit, file a superseding ADR first — do not quietly adopt.
- **Semantic search / pgvector / Laravel AI SDK.** Not on the roadmap.
- **PHP version bump.** Already on 8.4.
- **Speculative attribute refactors** elsewhere in the codebase (Eloquent, validation, notifications). If you spot a clean win during the upgrade, flag it in the shift log as a proposed follow-up order — do not bundle it here.
- **Behavior changes.** This is a version bump, not a feature push.

## Acceptance Criteria

- [ ] `composer.json` requires `laravel/framework: ^13.0`; `composer update` succeeds on a clean vendor install.
- [ ] `composer test` passes in full (unit, feature, architecture).
- [ ] `composer phpstan` passes at level max with 0 errors.
- [ ] `composer deptrac` passes with 0 violations.
- [ ] `composer mutation` reports ≥ 76% on Actions & Services.
- [ ] No usage of the four removed APIs listed above remains in `app/`, `routes/`, `database/`, or `tests/`.
- [ ] Every `paginate()` call has been reviewed; page sizes are either explicit or the new default (25) is confirmed correct for that endpoint.
- [ ] `ImportOwnedSetsJob` queue-attribute decision is recorded in the shift log (adopted or explicitly declined with rationale).
- [ ] `RebrickableService` `Cache::touch()` decision is recorded per cache site.
- [ ] Deploy runbook contains a "drain queues" step ahead of the L13 rollout.
- [ ] `docker compose` / local dev environment boots cleanly on the upgraded framework.

## References

- Official release notes: https://laravel.com/docs/13.x/releases
- Official upgrade guide: https://laravel.com/docs/13.x/upgrade
- Laravel News announcement: https://laravel-news.com/laravel-13-released
- ADR-0003: `docs/adr/0003-actions-services-separation.md` (Action/Service boundaries)
- ADR-0007: `docs/adr/0007-config-attributes.md` (attribute-first config)
- ADR-0008: `docs/adr/0008-explicit-routes.md` (explicit routes own their middleware — **do not touch**)
- Branch: `claude/laravel-13-upgrade-exploration-W5nU8`

## Notes from the Issuer

**Sequence matters.** Do the version bump as its own commit — no refactors, no attribute adoptions. Land green. Then do any queue-attribute or `Cache::touch()` changes in follow-up commits with their own scoped messages. This keeps the bisect story clean if something surfaces in production.

**ADR-0008 is not up for negotiation in this order.** Laravel 13 is actively marketing `#[Middleware]` and `#[Authorize]` on controllers, and they are genuinely ergonomic. But our dock manifest stays in `routes/api.php` — one file, one place to read the security posture of the warehouse. If you believe the ADR should be revisited, the path is a superseding ADR proposal, not a silent adoption.

**`ImportOwnedSetsJob` is a judgment call.** We currently have no retry/timeout configuration on the only queued job in the system. That may be correct (the action is transactional and has internal save-what-you-can resilience per ADR-0011) or it may be a gap. Look at the failure modes: Rebrickable 429s, network timeouts, serialization on the worker. Decide deliberately. Either outcome is acceptable as long as it is documented.

**`Cache::touch()` is a small but real win.** The Rebrickable cache is our hottest external-data surface. If we can extend TTL on a cache hit without round-tripping the payload, do it — but only where the semantic is genuinely "extend, don't refresh". Do not use it as a shortcut around stale data.

**Boost MCP.** If the tooling is available, it is welcome to do the mechanical work. Your job is to verify each change, not to delegate judgment.

Run the full gauntlet before filing the shift log. Include a short "gotchas encountered" section — this upgrade will be someone's reference material in 12 months.

---

**Status:** Complete (pending CI verification of MSI ≥ 76%)

**Qualifier history:**
- Filed as `Complete (pending mutation-drill follow-up)` on 2026-04-19.
- Rewritten on 2026-04-19 after the isolated mutation-drill shift (`2026-04-19-laravel-13-mutation-drill`) aborted on a missing coverage driver. Director ruled Option C: accept CI-only MSI enforcement as the formal L13 gate, with the 76.83% baseline from `2026-03-26-enforce-code-quality` as the pre-upgrade reference. Local mutation drills remain infeasible in this container until pcov/xdebug is baked in — a platform decision outside warehouse scope.

**Shift Log:** `.claude/records/journals/2026-04-19-laravel-13-upgrade.md`
**Follow-up Shift Log:** `.claude/records/journals/2026-04-19-laravel-13-mutation-drill.md`
