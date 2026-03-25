# The Muse's Ideas Ledger — Brick Inventory Orchestrator

**Allied Agent:** The Muse (from the-laboratory)
**First Session:** 2026-03-25
**Investor:** The Commander

> The Muse was deployed as an allied agent from the-laboratory into BIO territory under war-room protocol. Ideas generated through the Muse's Spark Chamber (7 Expansion Vectors, Collision Engine) and cross-examined through the full gauntlet with Named Attack Patterns.

---

## Session Stats

| Metric | Count |
|--------|-------|
| Total Generated | 13 |
| Approved | 4 |
| Mutated | 6 |
| Shelved | 3 |
| Killed | 0 |
| Merged | 0 |

**Strongest Survivor:** #06 The Brick DNA Lab — survived identity crisis attack clean.
**Most Valuable Shelving:** #13 The MOC Forge — crystallized what BIO *is* vs what it isn't.
**Sleeper to Watch:** #11 Frankenbuild Lite — practical mutation, but the original dream could define BIO if technical barriers fall.

---

## Approved Ideas

### #01 — The Brick Census

- **Session:** 2026-03-25
- **Tier:** 1 — Solid Ground
- **Vector:** Ghost Worker
- **Fuel Cost:** Spark
- **Blast Radius:** Local
- **Tag:** Workhorse
- **Verdict:** APPROVED

**Pitch:** Search/filter/sort on the Parts page — the last major view without it. Follows the exact pattern from Sets and Storage pages.

**Gift:** Surfaces "orphan parts" — parts in storage that don't belong to any owned set. Your loose brick bin, made visible.

**Speaks to:** "I know I have red 2x4 bricks somewhere but I can't find them in this list."

---

### #03 — The Theme Atlas

- **Session:** 2026-03-25
- **Tier:** 1 — Solid Ground
- **Collision:** Oracle x Furnace
- **Fuel Cost:** Spark
- **Blast Radius:** Local
- **Tag:** Bold
- **Verdict:** APPROVED

**Pitch:** Group the sets overview by LEGO theme — collapsible sections with filter chips at the top. Data already exists in `Set.theme`, just never surfaced.

**Gift:** Reveals collection identity. "Oh, I'm actually a Technic collector with a Star Wars habit."

**Speaks to:** "What kind of LEGO collector am I?"

**Gauntlet note:** The filter is the utility, the grouping is the gift.

---

### #04 — The Decade Dial

- **Session:** 2026-03-25
- **Tier:** 1 — Solid Ground
- **Collision:** Oracle x Furnace
- **Fuel Cost:** Spark
- **Blast Radius:** Local
- **Tag:** Bold
- **Verdict:** APPROVED

**Pitch:** Release-year distribution visualization on the dashboard — bar chart or heat map from `Set.year`. Zero backend work.

**Gift:** The nostalgia factor. Seeing your LEGO history mapped to your life timeline turns a database into a memoir.

**Speaks to:** "Show me the shape of my collection."

**Gauntlet note:** Closer to Vanity than Workhorse, but cheap enough that one-time delight earns its keep.

---

### #06 — The Brick DNA Lab

- **Session:** 2026-03-25
- **Tier:** 2 — Bold Bet
- **Collision:** Oracle x Embassy
- **Fuel Cost:** Burn
- **Blast Radius:** District
- **Tag:** Bold
- **Verdict:** APPROVED

**Pitch:** Collection analytics dashboard computing your "Brick DNA": top 10 most-owned colors, top 10 most-owned part types, rarest parts, and a collection diversity score. All from existing storage_option_parts joined with parts and colors.

**Gift:** Portfolio differentiator. Turns BIO from "I track what I have" to "I understand what I have." The analytics page becomes the most screenshot-worthy feature.

**Speaks to:** "Surprise me with something I didn't know about my own collection."

**Gauntlet note:** Survived the identity crisis attack clean — BIO already interprets data (build planner, storage map, smart sorter). The DNA Lab makes that identity official.

---

## Mutated Ideas

### #05 — The Cross-Build Index

- **Session:** 2026-03-25
- **Tier:** 1 — Solid Ground
- **Collision:** Oracle x Ghost Worker
- **Fuel Cost:** Burn
- **Blast Radius:** District
- **Tag:** Bold
- **Verdict:** MUTATED

**Original pitch:** "Sets that share parts with this one" — ranked by overlap across all owned sets. Full cross-join on set_parts by part+color.

**Attack:** Weight Test — combinatorial explosion for large collections. O(n²) query.

**Mutation:** Scope to current set's parts only. "Given Set X's parts, which other owned sets contain the same part+color?" WHERE IN query, not cross-join. O(n) instead of O(n²).

**Speaks to:** "I want to build a MOC — which sets give me the most useful parts?"

---

### #08 — The Storage Cartographer

- **Session:** 2026-03-25
- **Tier:** 2 — Bold Bet
- **Collision:** Furnace x Saboteur
- **Fuel Cost:** Furnace
- **Blast Radius:** City-Wide
- **Tag:** Bold
- **Verdict:** MUTATED

**Original pitch:** Visual grid of storage locations using existing row/column fields, color-coded by fill level.

**Attack:** Weight Test — if row/column fields are mostly null, the grid renders empty. Prerequisite tax: users must edit every location to add coordinates first.

**Mutation:** Grid as both input method AND display. Click an empty cell to create a storage location there. Build the map by using the map. Eliminates the prerequisite tax.

**Speaks to:** "I want to see my storage the way I see it in real life — as a grid of drawers, not a list of names."

---

### #09 — The Disassembly Guide

- **Session:** 2026-03-25
- **Tier:** 2 — Bold Bet
- **Collision:** Ghost Worker x Oracle
- **Fuel Cost:** Burn
- **Blast Radius:** District
- **Tag:** Bold
- **Verdict:** MUTATED

**Original pitch:** One-click action to bulk-assign all set parts to their previously-known storage locations and reset status.

**Attack:** Desert Mirage — real disassembly is messy, not precise. Most people don't meticulously return every part.

**Mutation:** Guided workflow with suggestions. Show parts with last-known storage locations, let the user confirm or redirect per batch. A reverse sorting station, not a magic button.

**Speaks to:** "I'm taking apart this set — help me put everything back where it belongs."

---

### #10 — The Collection Pulse

- **Session:** 2026-03-25
- **Tier:** 2 — Bold Bet
- **Collision:** Furnace x Oracle
- **Fuel Cost:** Spark (down from Burn)
- **Blast Radius:** District
- **Tag:** Workhorse
- **Verdict:** MUTATED

**Original pitch:** Activity feed with a new event log table populated by Actions. "Last 30 days: 3 sets added, 127 parts sorted."

**Attack:** Identity Crisis + Weight Test — scope creep toward audit logging. New table, event dispatching from every Action.

**Mutation:** Derive from existing timestamps. `family_sets.created_at` for sets added, `storage_option_parts.updated_at` for parts sorted. No new model, no event system. Computed, not stored.

**Speaks to:** "When did I last touch my collection?"

---

### #11 — The Frankenbuild Engine

- **Session:** 2026-03-25
- **Tier:** 3 — Beautiful Chaos
- **Collision:** Saboteur x Oracle x Embassy
- **Fuel Cost:** Furnace (down from Expedition)
- **Blast Radius:** City-Wide
- **Tag:** Whacky
- **Verdict:** MUTATED

**Original pitch:** Reverse-build-planner scanning ALL Rebrickable sets to rank what your inventory can build. The killer feature no LEGO app has nailed.

**Attack:** Weight Test — 20,000+ sets, data pipeline problem, not a feature.

**Mutation:** "Frankenbuild Lite" — user browses/searches Rebrickable sets and checks buildability on demand. Each check is one API call + one comparison. No pre-computation, no catalog scan.

**Resurrection condition:** If Rebrickable adds a part-match API, or BIO gains a background job system, revisit the full-catalog vision.

**Speaks to:** "Surprise me with what's possible."

---

### #12 — The Brick Whisperer

- **Session:** 2026-03-25
- **Tier:** 3 — Beautiful Chaos (mutated to Bold Bet)
- **Collision:** Saboteur x Embassy x Ghost Worker
- **Fuel Cost:** Burn (down from Furnace)
- **Blast Radius:** City-Wide
- **Tag:** Bold (down from Whacky)
- **Verdict:** MUTATED

**Original pitch:** One photo of a pile of bricks, multiple parts identified at once. Batch identification.

**Attack:** Graveyard Shift — multi-brick detection is unsolved at consumer quality. Brickognize can barely handle single bricks.

**Mutation:** Rapid-fire single-brick workflow. Camera stays open, snap → identify → assign → snap next. Sustained session, no multi-detect dependency.

**Resurrection condition:** When Brickognize (or any accessible API) supports reliable multi-object detection from a single image, revisit the original multi-brick vision.

**Speaks to:** "I have 500 loose bricks and no idea what they are."

---

## Shelved Ideas

### #02 — The Storage Census

- **Session:** 2026-03-25
- **Tier:** 1 — Solid Ground
- **Vector:** Furnace
- **Fuel Cost:** Burn
- **Tag:** Workhorse
- **Verdict:** SHELVED

**Pitch:** Part count badges on the storage overview tree showing capacity per location.

**Reason shelved:** Not painful enough at current scale. Clicking into a drawer isn't that costly when you have a manageable number of storage locations.

**Resurrection condition:** When the Commander's storage layout grows large enough that the tree becomes unwieldy without at-a-glance capacity information.

---

### #07 — The Retirement Radar

- **Session:** 2026-03-25
- **Tier:** 2 — Bold Bet
- **Collision:** Embassy x Ghost Worker
- **Fuel Cost:** Burn
- **Tag:** Bold
- **Verdict:** SHELVED

**Pitch:** Retirement status from Rebrickable surfaced on sets and wishlist.

**Reason shelved:** API uncertainty (Rebrickable may not expose retirement data cleanly) and thin value for a household app.

**Resurrection condition:** Confirmation that Rebrickable's API provides reliable retirement/availability data, AND the Commander's wishlist grows large enough for urgency signaling to matter.

---

### #13 — The MOC Forge

- **Session:** 2026-03-25
- **Tier:** 3 — Beautiful Chaos
- **Collision:** Annexation x Oracle
- **Fuel Cost:** Expedition
- **Tag:** Whacky
- **Verdict:** SHELVED

**Pitch:** "My Own Creations" as a first-class domain with build planner, storage map, and parts list.

**Reason shelved:** Identity question too strong. BIO is a set tracker that understands your collection, not a creation manager. The MOC Forge is effectively a second product.

**Resurrection condition:** When the Commander's own MOC-building habits create enough personal pain that tracking custom builds becomes a daily need, not a hypothetical.
