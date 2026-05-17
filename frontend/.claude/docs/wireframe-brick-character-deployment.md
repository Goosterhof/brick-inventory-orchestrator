# Wireframe: LegoBrick Character Deployment

**Status:** DRAFT
**Created:** 2026-03-29
**Author:** The Artisan (via War Room dispatch from a sovereign sister territory)
**Permit:** `.claude/records/permits/2026-03-29-brick-character-deployment.md`

---

## What This Covers

This wireframe shows exactly where and how to deploy the existing `LegoBrick.vue` component into the Families app. Two placements:

1. **Landing page hero** — three staggered bricks in brand colors beside the existing copy
2. **Empty state pattern** — a reusable enhancement to `EmptyState.vue` with a "lonely brick"

Everything described here uses components and design tokens that already exist in the codebase. No new shared components. No new design system tokens. Just deployment of what's built.

---

## The `LegoBrick.vue` Component (Quick Reference)

**Location:** `src/shared/components/LegoBrick.vue`

| Prop      | Type      | Default   | Description                                  |
| --------- | --------- | --------- | -------------------------------------------- |
| `color`   | `string`  | `#DC2626` | Hex background color for the brick and studs |
| `shadow`  | `boolean` | `true`    | Whether to show the hard offset shadow       |
| `columns` | `number`  | `4`       | Number of stud columns                       |
| `rows`    | `number`  | `2`       | Number of stud rows                          |

Renders an `inline-grid` of circular studs on a colored background with `brick-border`. A 4×2 is the classic LEGO brick. A 3×1 is a flat plate. A 2×2 is a small square brick.

---

## 1. Landing Page — Brick Hero

### The Idea

The logged-out landing page currently shows a title, tagline, description, and a "Create Account" link. All text. No visual proof that this is a LEGO app.

Add three `LegoBrick` components beside the text — staggered like someone was mid-build and walked away. "Under construction" is the mood. Not a catalog photo. Not a logo.

### Desktop Layout (≥ 640px) — Side by Side

```
┌──────────────────────────────────────────────────────────────────────┐
│  [NavHeader — unchanged]                                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┬──────────────────────────────┐      │
│  │                             │                              │      │
│  │  BRICK INVENTORY            │    ┌──┬──┬──┬──┐             │      │
│  │                             │    │()│()│()│()│             │      │
│  │  Every brick has a place.   │    ├──┼──┼──┼──┤  #F5C518   │      │
│  │                             │    │()│()│()│()│  (Yellow)   │      │
│  │  Manage your LEGO           │    └──┴──┴──┴──┘             │      │
│  │  collection, track where    │          ┌──┬──┐             │      │
│  │  every part is stored,      │          │()│()│             │      │
│  │  and build with confidence. │          ├──┼──┤  #C41A16   │      │
│  │                             │          │()│()│  (Red)      │      │
│  │  ┌───────────────────┐      │          └──┴──┘             │      │
│  │  │  CREATE ACCOUNT   │      │     ┌──┬──┬──┐              │      │
│  │  └───────────────────┘      │     │()│()│()│              │      │
│  │                             │     ├──┼──┼──┤  #0055BF     │      │
│  │                             │     └──┴──┴──┘  (Blue)      │      │
│  │                             │                              │      │
│  └─────────────────────────────┴──────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 640px) — Stacked, Bricks on Top

```
┌────────────────────────────────┐
│  [NavHeader — mobile]          │
├────────────────────────────────┤
│                                │
│     ┌──┬──┬──┬──┐             │
│     │()│()│()│()│  Yellow     │
│     ├──┼──┼──┼──┤             │
│     │()│()│()│()│             │
│     └──┴──┴──┴──┘             │
│        ┌──┬──┐                │
│        │()│()│  Red           │
│        └──┴──┘                │
│                                │
│  BRICK INVENTORY               │
│                                │
│  Every brick has a place.      │
│                                │
│  Manage your LEGO collection.. │
│                                │
│  ┌──────────────────────────┐  │
│  │     CREATE ACCOUNT       │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

### The Three Bricks

| Brick   | Columns | Rows | Color                    | Shadow | Purpose                                     |
| ------- | ------- | ---- | ------------------------ | ------ | ------------------------------------------- |
| Primary | 4       | 2    | `#F5C518` (Brick Yellow) | Yes    | The hero — largest, top of the stack        |
| Accent  | 2       | 2    | `#C41A16` (Brick Red)    | Yes    | Offset right and down — smaller accent      |
| Support | 3       | 1    | `#0055BF` (Brick Blue)   | Yes    | Offset left and further down — a flat plate |

### Why Staggered, Not Aligned

Aligned bricks feel like a catalog. Staggered bricks feel like someone was building and paused. "Under construction" matches the mood of an app inviting you to start cataloging your collection. The shadows all fall in the same direction (down-right), creating a consistent light source — they look physically stacked on the page.

### Template Stub — Copy-Paste Starting Point

**File:** `src/apps/families/domains/home/pages/HomePage.vue`

Add `import LegoBrick from "@shared/components/LegoBrick.vue";` to the script imports.

Replace the current logged-out `<template>` block:

```vue
<template v-if="!familyAuthService.isLoggedIn.value">
    <div flex="~ col sm:row" items="center sm:start" gap="8 sm:12">
        <!-- Copy block — existing content, unchanged -->
        <div flex="1 ~ col">
            <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-4">
                {{ t('home.brandTitle').value }}
            </h1>
            <p text="gray-600" m="b-2">{{ t('home.tagline').value }}</p>
            <p text="gray-600" m="b-6">{{ t('home.brandDescription').value }}</p>

            <NavLink to="/register" @click="familyRouterService.goToRoute('register')">
                {{ t('auth.createAccount').value }}
            </NavLink>
        </div>

        <!-- Brick hero — three staggered LegoBricks -->
        <div flex="~ col" items="end" gap="0" shrink="0" order="-1 sm:0">
            <LegoBrick :columns="4" :rows="2" color="#F5C518" />
            <LegoBrick :columns="2" :rows="2" color="#C41A16" m="t-[-4px] r-8" />
            <LegoBrick :columns="3" :rows="1" color="#0055BF" m="t-[-4px] l-4" />
        </div>
    </div>
</template>
```

**Key details:**

- `order="-1 sm:0"` puts bricks on top on mobile, on the right on desktop
- `m="t-[-4px] r-8"` and `m="t-[-4px] l-4"` create the stagger — negative top margin overlaps vertically, left/right margin offsets horizontally
- `items="end"` right-aligns the brick stack within its container
- `shrink="0"` prevents the brick container from shrinking on flex

---

## 2. Empty State — The Lonely Brick

### The Idea

The current `EmptyState.vue` shows a text message on a `brick-stud-grid` background. That's already good. The enhancement: render a single `LegoBrick` above the message — the domain's color, with `shadow: false` (flat, lying there, waiting to be picked up).

### Wireframe

```
┌────────────────────────────────────────────────────────────────┐
│                      brick-stud-grid bg                        │
│                                                                │
│                    ┌──┬──┬──┬──┐                               │
│                    │()│()│()│()│  LONELY BRICK                 │
│                    ├──┼──┼──┼──┤  (domain color, no shadow)    │
│                    │()│()│()│()│                                │
│                    └──┴──┴──┴──┘                               │
│                                                                │
│          "The shelf is bare. Add your first set."              │
│                                                                │
│               ┌──────────────────────┐                         │
│               │    ADD FIRST SET     │                         │
│               └──────────────────────┘                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Why `shadow: false`?

A brick with shadow looks confident — stacked, placed, part of a structure. A brick without shadow looks flat — lying on a surface, waiting to be picked up. The empty state brick is _waiting for the user to start building_. The missing shadow is the visual cue that this collection hasn't begun yet.

### How to Implement — Enhance `EmptyState.vue`

Add two optional props to `EmptyState.vue`. Defaults preserve current behavior — no existing usage breaks.

**Enhanced component:**

```vue
<script setup lang="ts">
import LegoBrick from '@shared/components/LegoBrick.vue';

const {
    message,
    showBrick = false,
    brickColor = '#F5C518',
} = defineProps<{message: string; showBrick?: boolean; brickColor?: string}>();
</script>

<template>
    <div flex="~ col" items="center" gap="4" p="8" text-center class="brick-stud-grid">
        <LegoBrick v-if="showBrick" :columns="4" :rows="2" :color="brickColor" :shadow="false" />
        <p text="gray-600">{{ message }}</p>
        <slot />
    </div>
</template>
```

**Changes from current `EmptyState.vue`:**

- Layout changed from single `<p>` to flex column (to stack brick → message → optional CTA slot)
- Added `showBrick` prop (default `false` — existing usage unchanged)
- Added `brickColor` prop (default `#F5C518`)
- Added `<slot />` after the message for an optional CTA button
- Import `LegoBrick` component

### Color Mapping Per Domain

Each domain gets its own brick color — reinforcing the identity the design system already established:

| Domain    | Empty State Key     | Brick Color     | Hex       | Why                                         |
| --------- | ------------------- | --------------- | --------- | ------------------------------------------- |
| Sets      | `sets.noSets`       | Brick Yellow    | `#F5C518` | The primary brand color — sets are the core |
| Storage   | `storage.noStorage` | Brick Blue      | `#0055BF` | Blue = organization, structure, shelving    |
| Parts     | `parts.noParts`     | Brick Red       | `#C41A16` | Red = individual pieces, small and specific |
| Brick DNA | `brickDna.empty`    | Baseplate Green | `#237841` | Green = the foundation everything sits on   |

### Usage Example (Sets Domain)

```vue
<EmptyState v-if="sets.length === 0" :message="t('sets.noSets').value" show-brick brick-color="#F5C518">
    <NavLink to="/sets/add" @click="goToAddSet">
        {{ t("sets.addSet").value }}
    </NavLink>
</EmptyState>
```

### Usage Example (Storage Domain)

```vue
<EmptyState :message="t('storage.noStorage').value" show-brick brick-color="#0055BF">
    <NavLink to="/storage/add" @click="goToAddStorage">
        {{ t("storage.addStorage").value }}
    </NavLink>
</EmptyState>
```

---

## Accessibility

| Requirement        | Implementation                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Decorative bricks  | `LegoBrick` renders `div` elements with no text content — invisible to screen readers by default |
| Focus order        | Bricks are not focusable. Tab order: nav → CTA button. Unchanged.                                |
| Color independence | Bricks carry no information via color alone. They are visual decoration.                         |

---

## Design Decisions Summary

| Decision                         | Rationale                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Three bricks on landing, not one | One brick = logo. Three bricks = collection in progress. Matches the app's purpose.                         |
| Staggered, not grid              | "Under construction" mood. Someone was building and paused — inviting the visitor to continue.              |
| `shadow: false` on empty states  | No shadow = flat = waiting. Shadow = stacked = placed. Empty states should feel _unfinished_.               |
| Enhance EmptyState with props    | Centralized. One component change, every domain benefits. `showBrick` defaults to `false` — nothing breaks. |
| Domain-specific colors           | Yellow (sets), Blue (storage), Red (parts), Green (DNA). Maps to the four brand colors in `uno.config.ts`.  |

---

## Open Questions for the Architect

1. **EmptyState slot:** The stub adds a `<slot />` for CTA buttons. This means existing `<EmptyState>` calls (which pass no slot content) will simply render the message — no visual change. But if any existing callers already have adjacent CTA buttons, consider migrating them into the slot for consistency. Your call.

2. **Landing page entrance animation:** The Showcase hero has a subtle fade-in + translate on its geometric shapes. A similar `onMounted` toggle on the brick container (3 lines of code) would add polish. Within the spirit of the permit if kept minimal.
