# Shipping Order: Response Caching with ETags

**Order #:** 2026-03-28-response-caching
**Filed:** 2026-03-28
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Add HTTP-level response caching to read endpoints that serve data which changes infrequently. Set catalog data, part databases, and color palettes from Rebrickable don't change between requests — yet we rebuild the response from scratch every time. ETags and cache headers let clients skip redundant transfers and let us skip redundant computation.

## Scope

### In the Crate

1. **ETag middleware** that generates ETags from response content and returns `304 Not Modified` when the client's `If-None-Match` header matches
2. **Cache-Control headers** on read endpoints with appropriate max-age values:
   - Catalog data (set parts, EAN lookups): aggressive caching (e.g., `max-age=3600`, 1 hour)
   - Family-scoped data (family sets, storage options, parts): short caching (e.g., `max-age=60`, 1 minute) with `private` directive
   - Mutable/auth endpoints: `no-cache, no-store`
3. **Application-level caching** of Rebrickable API responses — set data, part data, and color data cached with a TTL (e.g., 24 hours) to reduce external API calls
4. **Cache invalidation** when family-scoped data changes (create/update/delete operations should not serve stale data)
5. Tests covering: ETag generation, 304 responses, Cache-Control header correctness, cache invalidation after mutations, Rebrickable response caching

### Not on This Pallet

- CDN or reverse proxy caching (infrastructure concern, not application)
- Caching of paginated responses beyond standard ETag behavior (the cursor + ETag combination works naturally)
- Redis as cache backend (database cache is fine; the implementation should be driver-agnostic via Laravel's cache contracts)
- Cache warming or preloading strategies
- Caching of write endpoint responses

## Acceptance Criteria

- [ ] Read endpoints return `ETag` and `Cache-Control` headers appropriate to their data volatility
- [ ] Requests with matching `If-None-Match` receive `304 Not Modified` with no body
- [ ] Family-scoped responses include `Cache-Control: private` to prevent shared cache leakage
- [ ] Rebrickable API responses (sets, parts, colors) are cached at the application level with configurable TTL
- [ ] Mutations (POST/PUT/PATCH/DELETE) on family-scoped resources invalidate relevant cached data
- [ ] `composer test` passes — no regressions
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no boundary violations
- [ ] Feature tests verify ETag and 304 behavior
- [ ] Unit tests verify Rebrickable response caching (cache hit avoids HTTP call)

## References

- Related Order: 2026-03-28-cursor-pagination (paginated responses must work correctly with ETags)
- Related Order: 2026-03-28-queue-rebrickable-imports (imports populate the data that gets cached)

## Notes from the Issuer

Two distinct caching layers here — keep them separate:

**Layer 1: HTTP response caching (ETag + Cache-Control)**
A middleware is the natural home for this. Laravel doesn't ship an ETag middleware out of the box, but it's straightforward: hash the response content, compare against `If-None-Match`, return 304 or the full response. This is transparent to the rest of the application.

Key decision: ETag generation should hash the response body, not the query. This means the middleware sits at the very end of the response pipeline, after serialization. Keep it simple — `md5($response->getContent())` is sufficient for ETag generation; cryptographic strength isn't required here.

**Layer 2: Application-level Rebrickable caching**
The `RebrickableService` currently hits the API on every call. Wrap the HTTP calls with `Cache::remember()` using the request URL as the cache key. This belongs inside the Service — it's an optimization of the supply line, not business logic.

Cache key strategy for Rebrickable data:
- `rebrickable:set:{setNum}` → set data
- `rebrickable:set:{setNum}:parts:page:{page}` → parts pages
- `rebrickable:user:{token}:sets:page:{page}` → user collection pages (shorter TTL — this changes when users add sets on Rebrickable)

Deptrac note: The Service layer caching uses Laravel's Cache contract, which is framework infrastructure, not a dependency violation. But verify this doesn't trip the boundary fences.

Multi-tenancy consideration: Family-scoped cache entries must include the family_id in the cache key to prevent cross-tenant data leakage. The `private` Cache-Control directive handles the HTTP layer, but application-level caching needs explicit tenant scoping.

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
