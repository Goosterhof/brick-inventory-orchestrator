# Building Permit: Brick Character Deployment

**Permit #:** 2026-03-29-brick-character-deployment
**Filed:** 2026-03-29
**Issued By:** General (via War Room — Chaos Monkey autopsy #00060)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

The Chaos Monkey audited the full Brick & Mortar frontend and scored it 7/10. The design system is a 9. The application of it is a 6. The gap: components and services that were built for character (`LegoBrick.vue`, sound service, Brand Voice specification) are deployed in the Showcase but absent from the Families app. This permit covers deploying what already exists into the daily-use application — not building new infrastructure, but wiring existing character into the product users actually touch.

## Scope

### In the Box

1. **Voice overhaul (10 highest-visibility translation keys)** — Rewrite the 10 most-seen translation strings in both EN and NL to speak the Brick & Mortar voice. Target these keys specifically:
    - `common.loading` — "Loading..." → something like "Stacking bricks..." / "Laden... steentjes stapelen..."
    - `sets.noSets` — "No sets yet. Add your first set!" → voiced empty state
    - `storage.noStorage` — "No storage locations yet..." → voiced empty state
    - `parts.noParts` — "No parts stored yet..." → voiced empty state
    - `brickDna.empty` — "No collection data available yet..." → voiced empty state
    - `home.dashboardTitle` — "Dashboard" → something with domain identity
    - `home.loadingStats` — "Loading your collection..." → voiced variant
    - `errors.generic` — "An error occurred" → voiced error
    - `parts.noResults` — "No parts match your search or filters." → voiced empty search
    - `home.tagline` / `home.brandDescription` — landing page copy (already decent, sharpen if possible)

2. **Validation error personality** — Rewrite all `errors.*` translation keys in both EN and NL to be warmer and more human. Keep them clear and helpful, add character.

3. **Deploy LegoBrick into Families app** — Add the `LegoBrick.vue` component to:
    - The logged-out landing page as a visual hero element
    - At least one empty state (e.g., the "no sets" state)
    - **See wireframe:** `.claude/docs/wireframe-brick-character-deployment.md` — contains ASCII wireframes, template stubs, component breakdowns, design rationale, and copy-paste starting points for both placements

4. **Wire sound service into key interactions** — Add `play()` calls to these moments:
    - `snap` on PrimaryButton click (add a `silent` prop to opt out for rapid-fire contexts like form submits)
    - `pull` on ModalDialog open
    - `thud` on destructive confirmation (ConfirmDialog confirm button)
    - `cascade` on successful Rebrickable import

5. **100% test coverage on all changes** — as always

### Not in This Set

- No new shared components — use what exists
- No Showcase changes — the Showcase is already ahead of the app
- No architectural changes to services, routing, or stores
- No new sound types or sound service modifications beyond wiring `play()` calls
- No dashboard stat card contextual flavor text (deferred — the CFO raised valid maintenance concerns)
- No full landing page transformation (bounded to LegoBrick addition + copy sharpening, not a redesign)
- No Admin app changes

## Acceptance Criteria

- [ ] 10 high-visibility translation keys rewritten in both EN and NL with domain voice
- [ ] All `errors.*` translation keys rewritten in both EN and NL with warmer, human tone
- [ ] `LegoBrick.vue` renders on the logged-out landing page
- [ ] `LegoBrick.vue` renders in at least one empty state in the Families app
- [ ] PrimaryButton plays `snap` sound on click (when sound enabled), with `silent` prop to suppress
- [ ] ModalDialog plays `pull` sound on open (when sound enabled)
- [ ] ConfirmDialog confirm button plays `thud` sound (when sound enabled)
- [ ] Successful Rebrickable import plays `cascade` sound (when sound enabled)
- [ ] Sound effects respect `prefers-reduced-motion` and opt-in setting (existing behavior — just verify)
- [ ] All quality gates pass: type-check, knip, lint, test:coverage, build
- [ ] 100% test coverage maintained

## References

- **Wireframe:** `.claude/docs/wireframe-brick-character-deployment.md` — full visual spec for LegoBrick placements with template stubs
- Sound service: `src/shared/services/sound.ts`
- LegoBrick component: `src/shared/components/LegoBrick.vue`
- EmptyState component: `src/shared/components/EmptyState.vue`
- Translation file: `src/apps/families/services/translation.ts`
- Showcase Brand Voice: `src/apps/showcase/components/BrandVoice.vue`
- Showcase Hero (reference for brick composition): `src/apps/showcase/components/ShowcaseHero.vue`

## Notes from the Issuer

This permit comes from a Chaos Monkey autopsy run by a sovereign sister territory. The CFO's rebuttal shaped the scope — the voice overhaul is phased (10 keys now, full sweep later if the pattern proves maintainable in two languages), the sound wiring includes a `silent` prop escape hatch, and the landing page scope is bounded to component addition rather than redesign.

The core thesis: the infrastructure for character already exists in this codebase. `LegoBrick.vue` is built and tested. The sound service synthesizes four distinct sounds. The Brand Voice specification in the Showcase demonstrates what voiced copy looks like. This permit is about _deploying_ what was built, not building new things. That makes it low-risk and high-impact.

The CFO should evaluate whether the 10-key voice overhaul creates acceptable maintenance overhead in the NL translations. If the Dutch voiced strings feel forced or unnatural, that's a signal to adjust the approach — not every English quip translates well.

---

**Status:** Closed
**Journal:** `.claude/records/journals/2026-03-30-brick-character-deployment.md`
