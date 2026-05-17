# Building Permit: Mobile-Friendly Playground Page

**Permit #:** 2026-04-17-playground-mobile-friendly
**Filed:** 2026-04-17
**Issued By:** CFO (on CEO directive)
**Assigned To:** Creative Engine
**Priority:** Standard

---

## The Job

The Showcase's `PlaygroundPage.vue` (Brick Dimensions comparison page) renders each brick row as a rigid 3- or 4-column grid (Reference / HTML-CSS / SVG Top / SVG Side) with no responsive breakpoints. On a phone the columns squish into unreadable slivers and the SVG artwork loses its shape. Make the page read well from ~360px up through desktop without sacrificing the neo-brutalist presentation.

## Scope

### In the Box

- Responsive layout for the per-brick comparison grid in `src/apps/showcase/pages/PlaygroundPage.vue`
    - Stack columns on small screens, re-flow to 2 columns on mid screens, full 3/4 columns on `md`+ (or `lg`+ where warranted)
    - Ensure the Reference image, HTML/CSS render, SVG Top, and SVG Side each get adequate width and vertical breathing room on mobile
- Responsive header row (line 168 in current file): title + BrickLink button should wrap gracefully on narrow viewports instead of colliding
- Hero section typography scales smoothly (current jump from `text-5xl` to `md:text-7xl` is fine if it reads well — re-tune if the mobile rendering crowds the viewport)
- Horizontal padding/gap review — current `px-4 md:px-8` is OK but verify the inner card `p-6` doesn't cramp content on ~360px widths
- Touch target check — BrickLink anchor must be at least ~44px tall on mobile
- Visual verification in a real mobile viewport (dev server + narrow browser window or device emulation), including the golden path (scroll through all 10 brick entries) and the narrowest supported width

### Not in This Set

- Other showcase pages (`ShowcaseHome`, gallery components) — out of scope unless a shared component must change to support this work, in which case flag it in the journal
- Changes to the individual `Lego*` brick components themselves (they should remain intrinsically sized; the page handles the container responsiveness)
- New animations or transitions — this is a responsiveness permit, not a Creative Engine expansion ticket
- Design-system-wide breakpoint token changes

## Acceptance Criteria

- [ ] At 360px viewport width, every brick entry is fully readable: label, part number, BrickLink link, reference image, HTML/CSS render, and SVG renders are all legible and not overlapping
- [ ] At 768px (md) and above, the original multi-column comparison layout is preserved — no visual regression on desktop
- [ ] Header row (title + BrickLink button) does not overflow or overlap on any viewport from 360px up
- [ ] BrickLink anchor touch target is ≥44px on mobile
- [ ] Pre-push gauntlet passes: `type-check`, `knip`, `test:coverage` (100%), `build`
- [ ] `lint`, `lint:vue`, and `format:check` clean
- [ ] Construction journal filed with before/after notes and the viewport widths actually tested

## References

- Affected file: `src/apps/showcase/pages/PlaygroundPage.vue`
- Related permits: `2026-04-13-brick-view-orientation.md`, `2026-04-14-brick-side-view.md`, `2026-04-16-3d-brick-techniques.md` (prior playground work)
- Decision Log: `.claude/docs/decisions.md` (check for any responsive or showcase layout ADRs before starting)

## Notes from the Issuer

- **Environment:** The session reported Node 22.22.2 (24+ required) and missing `node_modules`. Resolve with `nvm install 24 && npm install` before attempting the pre-push gauntlet.
- The showcase is our showroom — prospective clients may view it from a phone. "Desktop-only" is not acceptable for this artifact.
- Prefer UnoCSS responsive variants (`md:`, `lg:`) already used elsewhere in the file over introducing new custom breakpoints. Stay within the established design language.
- If you find a systemic mobile issue elsewhere in the showcase during this work, do not fix it inline — flag it in the journal so the CFO can decide whether to spin a follow-up permit.
- Confirm test coverage stays at 100% — if the page is already covered by an existing test, re-running it after layout changes is sufficient; no new tests required unless you add new logic.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-17-playground-mobile-friendly.md`
