# Decision Log — _Why We Built It That Way_

Before reading any decision, start with **[ADR-000: Why This Project Exists and How Decisions Are Made](./ADR-000.md)**. It explains the audience, purpose, and evaluation criteria behind every decision in this log.

Architectural decisions made during development. Not what was built — the domain map covers that. This is **why** it was built that way, and what alternatives were rejected.

Each decision lives in its own file under `decisions/`.

**When to add an entry**: After any non-trivial choice — component structure, API design, pattern selection, library decisions, domain boundaries. If a future architect might ask "why did we do it this way?" — write it down.

**Format**: Use the [decision record template](./.decision-record-template.md). One file per decision. Keep entries brief — a decision record is a snapshot, not an essay.

**Naming**: `decisions/DDD-short-title.md` where DDD is a zero-padded sequence number.

**Ownership**: Three-tier review process:

1. The **architect** proposes decision records in the report-back step — with honest reasoning, not post-hoc justification
2. The **CFO** (main conversation agent) critically reviews: challenges shallow reasoning, asks "what did you actually consider?", flags gaps
3. The **CEO** (human) gives final approval on what gets committed

No decision record lands here without passing through all three.

**Lifecycle**:

- `accepted` — current and active
- `superseded` — replaced by a newer decision (link to the replacement)
- `deprecated` — no longer relevant (explain why)

---

## Index

| #   | Decision                                                                                                                                | Date       | Status            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------- |
| 001 | [Custom RouterService over Vue Router plugin](./decisions/001-custom-routerservice.md)                                                  | 2026-03-17 | accepted          |
| 002 | [Factory pattern for services, no singletons](./decisions/002-factory-services.md)                                                      | 2026-03-17 | accepted          |
| 003 | [UnoCSS attributify over CSS files](./decisions/003-unocss-attributify.md)                                                              | 2026-03-17 | accepted          |
| 004 | [Snake/camel case conversion at HTTP boundary](./decisions/004-case-conversion-boundary.md)                                             | 2026-03-17 | superseded by 016 |
| 005 | [Istanbul coverage with zero ignore comments](./decisions/005-istanbul-coverage-no-ignores.md)                                          | 2026-03-17 | accepted          |
| 006 | [Resource adapter with frozen base and mutable ref](./decisions/006-resource-adapter-frozen-mutable.md)                                 | 2026-03-18 | accepted          |
| 007 | [Adapter store module over Pinia/Vuex](./decisions/007-adapter-store-no-pinia.md)                                                       | 2026-03-18 | accepted          |
| 008 | [Domain isolation via lint rules and architecture tests](./decisions/008-domain-isolation.md)                                           | 2026-03-18 | accepted          |
| 009 | [Component health registry — five metrics powering the Showcase app](./decisions/009-brick-catalog-health-metrics.md)                   | 2026-03-19 | accepted          |
| 010 | [Test isolation via execution-time guard, collect-duration guard, and factory mocking](./decisions/010-test-isolation-collect-guard.md) | 2026-03-20 | accepted          |
| 011 | [Domain-based Vitest project split with factory configuration](./decisions/011-domain-based-vitest-projects.md)                         | 2026-03-22 | accepted          |
| 012 | [Typed mock helpers with MockedService mapped type](./decisions/012-typed-mock-helpers.md)                                              | 2026-03-22 | accepted          |
| 013 | [Page integration tests with real component composition](./decisions/013-page-integration-tests.md)                                     | 2026-03-27 | accepted          |
| 014 | [Domain-driven vertical slices over technical layers](./decisions/014-domain-driven-vertical-slices.md)                                 | 2026-03-08 | accepted          |
| 015 | [Creative Engine agent — dedicated design & animation role](./decisions/015-creative-engine-agent.md)                                   | 2026-04-09 | accepted          |
| 016 | [Case conversion via HTTP middleware](./decisions/016-case-conversion-via-http-middleware.md)                                           | 2026-05-05 | accepted          |
