# Building Permit: Middleware Pipeline Visualizer

**Permit #:** 2026-03-28-middleware-pipeline-visualizer
**Filed:** 2026-03-28
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build an interactive showcase page that visualizes how HTTP requests flow through our middleware pipeline step by step. Visitors should see a request travel through each middleware layer (auth token injection, loading state, request/response transforms, error handling) with clear before/after state at each stage.

## Scope

### In the Box

- New showcase section/page: Middleware Pipeline Visualizer
- Step-by-step visualization of request lifecycle through middleware layers
- Stages to visualize: auth token injection -> loading state start -> request transform (camelCase -> snake_case) -> simulated network call -> response transform (snake_case -> camelCase) -> loading state stop -> error handling
- Interactive controls: trigger different scenarios (success, 401 auth failure, 422 validation error, network error)
- Visual state display at each pipeline stage (what the request/response looks like before and after)
- Animate or step through the pipeline so the ordering is clear
- Integrate into existing showcase navigation
- 100% test coverage on all new code

### Not in This Set

- No real API calls — all responses are simulated
- No modifications to existing shared services or middleware
- No full API contract simulation (request builder, header inspection, etc.)
- No changes to the Families app
- No new shared components unless strictly necessary

## Acceptance Criteria

- [ ] Showcase includes a Middleware Pipeline Visualizer section
- [ ] Users can see a request flow through each middleware stage with visible state at each step
- [ ] At least 3 scenarios are available: success, 401 auth error, 422 validation error
- [ ] Middleware ordering is unambiguous — a viewer understands which layer runs when
- [ ] The auth middleware's token injection is visible
- [ ] The loading state middleware's start/stop lifecycle is visible
- [ ] The snake_case/camelCase transform is visible at the request and response boundaries
- [ ] All quality gates pass: type-check, knip, lint, test:coverage, build
- [ ] 100% test coverage on new code

## References

- Service: `src/shared/services/http.ts`
- Service: `src/shared/services/loading-middleware.ts`
- Service: `src/shared/services/auth/index.ts`
- Existing showcase: `src/apps/showcase/`

## Notes from the Issuer

This is the architectural story the other two permits don't tell. The adapter playground shows data patterns, the form workbench shows composable patterns — this one shows service composition and middleware design. Together, the three cover our full infrastructure stack. Keep the visualization clear and sequential — a senior engineer should grok the middleware ordering in under 30 seconds.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
