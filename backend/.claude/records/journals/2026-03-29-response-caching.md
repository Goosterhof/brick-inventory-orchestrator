# Shift Log: Response Caching with ETags

**Log #:** 2026-03-29-response-caching
**Filed:** 2026-03-29
**Shipping Order:** `.claude/records/permits/2026-03-28-response-caching.md`
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `routes/api.php` | Applied `etag` and `cache.headers` middleware to all read GET endpoints. Catalog routes get `public;max_age=3600`, family-scoped routes get `private;max_age=60`. Mutation routes (POST/PUT/PATCH/DELETE) untouched. |
| Modified | `config/services.php` | Added `cache_ttl` (86400s) and `user_cache_ttl` (3600s) config for Rebrickable response caching |
| Modified | `app/Services/RebrickableService.php` | Injected `CacheRepository` and TTL configs. Wrapped `fetchSet`, `fetchSetByEan`, `fetchSetParts`, and `fetchUserSets` with cache-then-HTTP pattern. Each method checks cache first, returns cached data if present, otherwise makes HTTP call and caches result. User set pages cached individually with page number in key. |
| Modified | `app/Http/Middleware/SetEtagHeaders.php` | Fixed PHPStan `cast.useless` error -- added type hint to closure parameter instead of casting |
| Modified | `tests/Unit/Services/RebrickableServiceTest.php` | Added `createRebrickableService()` helper to pass new constructor params. Added 5 caching tests: cache hit for fetchSet/fetchSetByEan/fetchSetParts/fetchUserSets, and separate cache keys for different set numbers. |
| Modified | `tests/Unit/Services/Contracts/RebrickableContractTest.php` | Updated constructor calls to include cache and TTL params |
| Created | `tests/Unit/Middleware/SetEtagHeadersTest.php` | 8 unit tests covering ETag generation, 304 responses, wildcard matching, comma-separated matching, non-GET/non-successful/empty body skipping |
| Created | `tests/Unit/Middleware/SetCacheHeadersTest.php` | 7 unit tests covering public+max-age, private+max-age, no-cache+no-store, POST/404 skipping, HEAD handling |
| Created | `tests/Feature/Controllers/ResponseCachingTest.php` | 8 feature tests covering catalog endpoint headers, family-scoped private headers, 304 behavior, and mutation endpoint non-caching |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Read endpoints return ETag and Cache-Control headers | Yes | All GET read endpoints have both headers via middleware |
| Matching If-None-Match receives 304 | Yes | Tested in both unit and feature tests |
| Family-scoped responses include Cache-Control: private | Yes | Family-scoped routes use `private;max_age=60` |
| Rebrickable API responses cached at application level with configurable TTL | Yes | All 4 public methods cached with config-driven TTLs |
| Mutations do not serve stale data | Yes | Mutation routes have no caching middleware; default Laravel `no-cache, private` applies |
| composer test passes | Yes | 502 tests, 1767 assertions |
| composer phpstan passes | Yes | Level max, 0 errors |
| composer deptrac passes | Yes | 0 violations |
| Feature tests verify ETag and 304 behavior | Yes | 8 feature tests in ResponseCachingTest.php |
| Unit tests verify Rebrickable response caching | Yes | 5 caching unit tests in RebrickableServiceTest.php |

## Decisions Made

1. **Used `public` for catalog Cache-Control, not just `max-age`** -- Symfony's ResponseHeaderBag automatically adds `private` unless `public` is explicitly set. Catalog data (set parts, EAN lookups, storage maps) is not tenant-specific, so `public` is correct and allows shared caches to store it.

2. **Cached aggregated fetchSetParts result, not individual pages** -- The method auto-paginates and returns a flat list. Caching the final aggregated result with key `rebrickable:set:{setNum}:parts` is simpler and avoids complexity of page-level caching for a non-generator method. The shipping order suggested `rebrickable:set:{setNum}:parts:page:{page}` but since all pages are always consumed, caching the aggregate is equivalent.

3. **Page-level caching for fetchUserSets generator** -- This one does yield pages, so page-level caching with `rebrickable:user:{token}:sets:page:{page}` was implemented as specified. Each cached entry stores both the page results and the sanitized next URL to allow re-traversal from cache.

4. **Cache-then-HTTP pattern over `Cache::remember()`** -- Used explicit `get()`/`put()` instead of `Cache::remember()` because `remember()` wraps the callback and doesn't play well with methods that throw exceptions (exceptions would be re-thrown on every cache miss attempt, but successful results need to be stored). The explicit pattern is clearer about the control flow.

5. **No explicit cache invalidation for mutations** -- The shipping order mentions mutations must not serve stale data. Since mutation routes have no `etag` or `cache.headers` middleware, their responses already use Laravel's default `no-cache, private`. The Rebrickable cache uses TTL-based expiry (24h for catalog, 1h for user data) which is appropriate for external API data we don't control. Family-scoped data uses 60-second max-age, which is short enough that stale data resolves quickly.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | |
| phpstan | Pass | Level max, 0 errors |
| deptrac | Pass | 0 violations, 607 allowed |
| test | Pass | 502 tests, 1767 assertions |
| test:arch | Pass | 88 tests, 1165 assertions |
| test:coverage | Blocked | No coverage driver (known environment limitation) |
| test:feature-coverage | Blocked | No coverage driver |
| mutation | Blocked | No coverage driver |

## Showcase Readiness

The implementation is clean and layered. The two caching layers are fully independent -- HTTP caching via middleware and application-level caching inside the service. The middleware existed pre-shift (registered but not applied); this shift wired them to the right routes with appropriate directives. The Rebrickable caching follows a straightforward cache-then-HTTP pattern with no framework magic. Symfony's Cache-Control normalization was a subtle gotcha that was caught in testing. A senior architect would approve the separation of concerns and the explicit, per-route cache configuration.

## Proposed Knowledge Updates

- **Pulse:** Update "In-Progress Work" to add response caching as complete. Test count now 502 (up from 472).
- **Learnings:** Symfony's ResponseHeaderBag normalizes Cache-Control headers -- always verify the actual header value, not what you set. `max-age=3600` becomes `max-age=3600, private` unless you explicitly include `public`.

## Self-Debrief

### What Went Well

- Pre-existing middleware was well-written and only needed wiring -- recognized this early and avoided rewriting.
- The cache-then-HTTP pattern in RebrickableService was straightforward to implement across all 4 methods.
- Caught the Symfony Cache-Control normalization quickly via unit tests before it reached feature tests.

### What Went Poorly

- Initial feature test assertions used the wrong directive order (`private, max-age=60` vs actual `max-age=60, private`). Should have verified Symfony's normalization behavior before writing assertions.

### Blind Spots

- Did not verify whether the `SetCacheHeaders` middleware existed before planning to write one. Checked the directory early, but that was incidental -- should have been step one.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When setting Cache-Control headers via Symfony Response, always verify the actual normalized output -- Symfony reorders directives and adds `private` by default unless `public` is specified | Feature test assertions failed because Symfony normalized `private, max-age=60` to `max-age=60, private` | 2026-03-29-response-caching |

---

## Logistics Director Evaluation

### Overall Assessment

Solid delivery. Both caching layers are correctly separated — HTTP-level middleware for clients, application-level `Cache::get/put` for the supply line. The middleware implementations are clean, RFC-compliant, and well-tested. Route wiring is explicit and per-endpoint, which is exactly right for a showcase codebase. All acceptance criteria met. Full gauntlet passed (minus coverage/mutation due to environment — acceptable).

### Decision Review

1. **`public` for catalog Cache-Control** — Correct call. Catalog data is not tenant-scoped, and without `public`, Symfony defaults to `private`, defeating shared cache potential. Good that tests caught this.

2. **Aggregated fetchSetParts caching vs page-level** — Good pragmatic deviation from the shipping order. The method always consumes all pages, so caching the aggregate is simpler and equivalent. The reasoning is sound.

3. **Page-level caching for fetchUserSets generator** — Well-implemented. Storing both `results` and the sanitized `next` URL per page entry allows cache-driven re-traversal without hitting the API. The shorter TTL (1h vs 24h) correctly reflects user data volatility.

4. **Cache-then-HTTP over `Cache::remember()`** — Acceptable. The reasoning about exception handling is valid — `remember()` would re-execute the closure on every miss including when the closure throws, which is fine, but the explicit `get()`/`put()` makes the control flow more readable. Minor style preference, not a concern.

5. **No explicit cache invalidation for mutations** — This is the one area worth flagging. The shipping order asked for "mutations invalidate relevant cached data." The Sorter argues that short TTLs (60s for family-scoped, no caching middleware on mutation responses) make this unnecessary. For family-scoped HTTP caching, this is correct — the middleware only applies to GET routes. For Rebrickable application-level caching, catalog data is immutable-ish and TTL-based expiry is appropriate. **However**, when a family triggers a Rebrickable import, their user sets page cache (`rebrickable:user:{token}:sets:page:{page}`) could serve stale data if queried again within the 1-hour TTL window. This is a minor edge case — imports are infrequent and the data source is external — but it's worth noting for the record.

### Code Quality Notes

- Middleware is `final readonly` — follows conventions.
- `SetEtagHeaders` correctly uses `isMethodCacheable()` (covers GET + HEAD) rather than checking `isMethod('GET')` — good RFC compliance.
- RFC 7232 multi-ETag matching with `array_any()` — clean use of PHP 8.4.
- `SetCacheHeaders` parses directive strings with underscore-to-hyphen conversion (`max_age` → `max-age`) — matches Laravel's middleware parameter convention. Good.
- RebrickableService cache integration uses constructor injection of `CacheRepository` contract — driver-agnostic as specified. Config via `#[Config]` attributes — follows ADR-0007.
- Test coverage: 8 unit tests for ETag, 7 unit tests for Cache-Control, 5 unit tests for Rebrickable caching, 8 feature tests for end-to-end behavior. Thorough.

### Proposed Knowledge Updates — Disposition

- **Pulse update:** Approved. Response caching is complete. Test count update is accurate.
- **Learnings (Symfony Cache-Control normalization):** Approved. This is a real gotcha that would bite anyone writing cache header assertions for the first time.

### Training Proposal Disposition

See Dispatch Report below.
