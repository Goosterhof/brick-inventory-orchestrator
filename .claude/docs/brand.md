# Brand & Design Document

## Brand Identity

**Name**: Brick Inventory
**Tagline**: Every brick has a place.
**Voice**: Confident, playful, direct. Like the bold text on a Lego box — no fluff, all fun.

## Design Philosophy: Brick Brutalism

Brick Brutalism takes the raw honesty of brutalist architecture and the tactile joy of Lego bricks, and smashes them together. The result is an interface that feels like snapping real bricks into place: chunky, satisfying, impossible to misunderstand.

> **Implementation note**: This design system is built with **UnoCSS** (utility-first CSS, similar to Tailwind but with attributify syntax). All class examples in this document use UnoCSS conventions. See UnoCSS docs for syntax differences from Tailwind.

### Core Principles

1. **Weight** — Every element has physical presence. Borders are thick. Shadows are solid. Nothing floats in ambiguous whitespace. If you can see it, you can almost feel it.

2. **Contrast** — Black on white. Bold on plain. Big on small. The interface communicates through stark differences, not subtle gradients. Information hierarchy is obvious at a glance.

3. **Honesty** — No fake depth, no decorative blur, no rounded-corner softness pretending things are gentler than they are. Shadows are hard offsets — they show exactly where the light is and where it isn't. Corners are sharp because bricks have edges.

4. **Playfulness** — Brutalism doesn't mean joyless. The interface is bold because it's excited to be used, not because it's trying to intimidate. Playfulness shows up in specific, tangible ways:
    - **Snap transitions** — Shadow changes on hover/press are fast (150ms) and use `transition-timing-function: cubic-bezier(0.2, 0, 0, 1)` for a physical snap feel. Elements don't drift; they click.
    - **Stud highlights** — `--brick-yellow` floods the background of focused and hovered elements instantly, like pressing down on a Lego stud and seeing it light up.
    - **Uppercase labels** — Headings and button text shout in caps with wide tracking. The typography is loud on purpose, like embossed text on a brick.
    - **Personality in empty states** — When there's nothing to show, the UI doesn't just say "No results." It says something with character (see Brand Voice below).
    - **Satisfying feedback** — Destructive actions require confirmation with a bold, honest prompt. Successful actions get a brief, encouraging acknowledgment. The app reacts to you.

## Color Palette — The Brick Brutalism Palette

The palette is intentionally constrained. Like a monochrome Lego set with a few accent bricks, every color has a specific job. But these are not generic utility colors — they are **domain-researched values** inspired by the actual pigments of injection-molded ABS plastic. Real Lego colors are warmer and more saturated than digital color pickers produce. They look like physical objects under warehouse lighting, not like pixels on a Dribbble shot. That warmth is the difference between "an app about Lego" and "an app that feels like Lego."

> **Why not just use Lego's exact Pantone values?** Lego's brand colors are trademarked. We don't copy — we study. Each Brick Brutalism token is inspired by the warmth and saturation of ABS plastic but tuned to our own values. Close enough to evoke the material. Distinct enough to be ours.

### Primary

| Token                 | Hex       | Inspiration                                                     | WCAG vs White | WCAG vs Black | Role                                    |
| --------------------- | --------- | --------------------------------------------------------------- | ------------- | ------------- | --------------------------------------- |
| **`--brick-ink`**     | `#000000` | The black bricks in every set — absolute, no warmth, no apology | N/A           | N/A           | Text, borders, shadows, primary buttons |
| **`--brick-surface`** | `#FFFFFF` | The white baseplate — clean, infinite building space            | N/A           | N/A           | Backgrounds, cards, input fields        |

### Accent Bricks

| Token                       | Hex       | Inspiration                                                                                                                                                                                                                          | WCAG vs White            | WCAG vs Black | Role                                                                                                                                                                                                                             |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--brick-yellow`**        | `#F5C518` | Inspired by Lego Bright Yellow (Pantone 116C ~#F5CD2F). Shifted slightly toward orange for screen vibrancy — real ABS yellow reads warmer than print yellow. This is the yellow of a fresh 2x4 brick under daylight.                 | 1.55:1 (decorative only) | 13.52:1       | Focus states, hover feedback, active indicators — the stud you are about to press                                                                                                                                                |
| **`--brick-yellow-subtle`** | `#FDF0C4` | Pale warm cream — the echo of `--brick-yellow` at low volume. Derived by desaturating and lightening the primary yellow, not by picking a random Tailwind tint.                                                                      | 1.17:1 (decorative only) | 17.89:1       | Active/pressed states where full yellow is too loud (e.g., inline link active state). **Never use on non-interactive elements** — yellow is reserved for interactive feedback. Use `gray-200` for neutral background highlights. |
| **`--brick-red`**           | `#C41A16` | Inspired by Lego Bright Red (Pantone 21C ~#C91A09). A touch cooler to improve screen legibility — real ABS red is warm but can muddy on backlit displays. Honest, plastic-red energy. The color of every fire truck brick ever made. | 4.72:1 (AA large text)   | 4.45:1        | Error borders, error shadows, destructive action accents                                                                                                                                                                         |
| **`--brick-red-light`**     | `#F8D0CF` | Warm blush derived from `--brick-red`, not from a generic red scale. Sits in the same color family.                                                                                                                                  | 1.30:1 (background only) | 16.10:1       | Error backgrounds, destructive action hints                                                                                                                                                                                      |
| **`--brick-red-dark`**      | `#9B1510` | Deep kiln red — `--brick-red` pushed darker for maximum text legibility on white surfaces.                                                                                                                                           | 7.08:1 (AA)              | 2.97:1        | Error messages, validation text                                                                                                                                                                                                  |
| **`--brick-blue`**          | `#0055BF` | Inspired by Lego Bright Blue (Pantone Reflex Blue ~#0055BF). Matched nearly exactly — this blue is already bold enough for screens. The deep, confident blue of classic space sets.                                                  | 4.87:1 (AA large text)   | 4.31:1        | Reserved for future use: link color, informational states. Not currently active — held in reserve so the palette can grow without reaching for generic Tailwind.                                                                 |
| **`--baseplate-green`**     | `#237841` | Inspired by Lego Bright Green (~#237841). The baseplate green every builder remembers — the grid you snap your first brick onto. Earthy, saturated, unmistakable.                                                                    | 4.22:1 (AA large text)   | 4.97:1        | Reserved for future use: success states, confirmation feedback. Not currently active.                                                                                                                                            |

### UnoCSS Configuration

Define these as custom theme colors in `uno.config.ts` so they are available as utilities (`bg-brick-yellow`, `text-brick-red-dark`, `border-brick-red`, etc.):

```ts
// uno.config.ts
import {defineConfig} from 'unocss';

export default defineConfig({
    theme: {
        colors: {
            brick: {
                ink: '#000000',
                surface: '#FFFFFF',
                yellow: {DEFAULT: '#F5C518', subtle: '#FDF0C4'},
                red: {DEFAULT: '#C41A16', light: '#F8D0CF', dark: '#9B1510'},
                blue: '#0055BF',
            },
            baseplate: {green: '#237841'},
        },
    },
});
```

Usage examples: `bg-brick-yellow`, `text-brick-red-dark`, `border-brick-red`, `bg-brick-red-light`, `bg-brick-yellow-subtle`, `text-baseplate-green`.

### Error Color Hierarchy

Error states use three tiers of brick-red, each with a clear role:

- **`--brick-red-light`** (`#F8D0CF`) — Background fill. Warm but not overwhelming. Applied to the container.
- **`--brick-red`** (`#C41A16`) — Border and shadow. The structural indicator that something is wrong.
- **`--brick-red-dark`** (`#9B1510`) — Text. The message itself. 7.08:1 contrast on white — exceeds AA.

### Neutrals

| Role               | Color    | Value                  | Usage                           |
| ------------------ | -------- | ---------------------- | ------------------------------- |
| **Muted**          | Gray 200 | `gray-200` / `#E5E7EB` | Disabled backgrounds            |
| **Disabled**       | Gray 300 | `gray-300` / `#D1D5DB` | Disabled borders                |
| **Secondary Text** | Gray 600 | `gray-600` / `#4B5563` | Placeholder text, subtle labels |

Neutrals stay as generic grays — they are structural, not branded. Graying out a disabled input is the same in every domain. The Brick Brutalism palette applies to elements with _meaning_, not to elements that have surrendered it.

### Color Rules

- **Never use gradients.** Flat fills only. Bricks are solid plastic, not watercolor.
- **Never use opacity for emphasis.** Change the color, not the transparency.
- **Accent colors are rewards.** `--brick-yellow` appears when you interact. It's feedback, not decoration.
- **Yellow is strictly interactive.** Both `--brick-yellow` and `--brick-yellow-subtle` are reserved for interactive feedback states (hover, focus, active). Never apply yellow to non-interactive, informational, or decorative contexts (callouts, badges, annotations). Use `gray-200` for neutral background highlights.
- **Red means something is wrong.** Don't use `--brick-red` for branding or decoration.
- **Use token names, not hex values.** Write `bg-brick-yellow`, not `bg-[#F5C518]`. The tokens are the API. If a value changes, it changes in one place.
- **Reserved colors earn their place.** `--brick-blue` and `--baseplate-green` exist in the palette but are not yet assigned to UI roles. When a feature needs a new semantic color, it draws from reserves — it does not invent a new one.

## Typography

### Style

- **Labels and headings**: `font-heading uppercase font-900 tracking-wide` — like the text stamped into the underside of a Lego brick. Loud, clear, unapologetic. The heading typeface (Space Grotesk) makes this treatment unmistakable.
- **Body text**: `font-medium text-brick-ink` — system font stack, readable, no-nonsense.
- **Error text**: `text-sm text-brick-red-dark` — small but impossible to ignore.

### Font Choice

**Headings: Space Grotesk (weight 700)**

The original version of this document defended system fonts everywhere as a deliberate trade-off — performance over brand consistency. That defense was honest at the time but incomplete. The problem: system fonts (San Francisco, Segoe UI, Roboto) are designed to disappear. They are invisible on purpose. In a design system built on physicality and bold presence, invisible typography is a contradiction. Headings are the loudest elements in the interface — uppercase, bold, wide-tracked — and they were being rendered in fonts specifically engineered to not be noticed.

Space Grotesk fixes this. It descends from Space Mono (a monospace font with retro-technical energy) but is proportional, making it readable at heading sizes without the awkward spacing of a true monospace. Its letterforms are geometric and slightly quirky — the kind of precision that evokes engineered parts, stamped molds, technical lettering on injection-molded plastic. When rendered in uppercase at heavy weight with wide tracking, it looks like the text embossed into the underside of a Lego brick: mechanical, deliberate, and physically _there_.

**Why Space Grotesk over the other candidates:**

- **Epilogue** — excellent weight range but too polished; reads "modern startup," not "injection mold."
- **Archivo Black** — ultra-bold but only one weight; no flexibility for subheadings.
- **Darker Grotesque** — beautiful but too tight and edgy; competes with the border system for visual attention.
- **Syne** — too art-adjacent; this is a tool app, not a gallery.

**What we gained:** Typographic identity that is physically recognizable. A user will remember these headings.
**What we sacrificed:** Zero font-loading latency for headings. Space Grotesk 700 is ~22KB (woff2). First-time visitors see a brief FOUT (flash of unstyled text) on headings before the font loads. Body text is unaffected — it remains system font with zero latency. We mitigate with `font-display: swap` and preloading.

**Body: System font stack (UnoCSS default)**

Body text stays on system fonts. The original defense still holds for running text: performance matters more than brand consistency for the 95% of text that users actually _read_. The brand's body text identity comes from weight and color, not from the typeface.

### Heading Specifications

| Element    | Size               | Weight | Tracking        | Transform   | Font          |
| ---------- | ------------------ | ------ | --------------- | ----------- | ------------- |
| **h1**     | `text-3xl` (30px)  | 700    | `tracking-wide` | `uppercase` | Space Grotesk |
| **h2**     | `text-2xl` (24px)  | 700    | `tracking-wide` | `uppercase` | Space Grotesk |
| **h3**     | `text-xl` (20px)   | 700    | `tracking-wide` | `uppercase` | Space Grotesk |
| **Labels** | `text-sm` (14px)   | 700    | `tracking-wide` | `uppercase` | Space Grotesk |
| **Body**   | `text-base` (16px) | 500    | normal          | none        | System stack  |

### UnoCSS Font Configuration

```ts
// uno.config.ts (extend the theme)
export default defineConfig({
    theme: {fontFamily: {heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif']}},
    preflights: [
        {
            getCSS: () => `
        @font-face {
          font-family: 'Space Grotesk';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url('/fonts/SpaceGrotesk-Bold.woff2') format('woff2');
        }
      `,
        },
    ],
});
```

Load a single weight (700). No italic — headings are uppercase and don't use italics. Total cost: ~22KB woff2. Add a `<link rel="preload">` in the HTML head for the font file to minimize FOUT.

### Rules

- Never center long text. Left-align for readability.
- Use size to create hierarchy, not color. Black text at different sizes beats colored text at the same size.
- **Headings always use `font-heading`**. Body text never does. The separation is the point — headings shout, body text speaks.

## Borders & Edges

Borders are the most defining feature of Brick Brutalism. They are the studs on top of the brick — the part that makes it snap together.

### Specifications

| Property   | Value | UnoCSS                     |
| ---------- | ----- | -------------------------- |
| **Width**  | 3px   | `border="3 black"`         |
| **Color**  | Black | (included above)           |
| **Radius** | 0     | None — never add `rounded` |
| **Style**  | Solid | Default                    |

### Rules

- **Every interactive element gets a border.** Buttons, inputs, links, cards — if you can click it or type in it, it has a 3px black border.
- **Never use border-radius.** Sharp corners are the brand. Rounding an edge is like filing down a Lego stud. **Sole exception**: Lego stud elements use `rounded-full` — studs are cylinders in real life (see Lego Brick Dimensions below).
- **Never use hairline borders** (1px). If a border exists, it must be 3px. Thin borders look indecisive.

## Shadows

Shadows in Brick Brutalism are not about realism — they're about physicality. A hard offset shadow says "this element is a brick sitting on a surface."

### Specifications

| State                | Shadow         | CSS                                      |
| -------------------- | -------------- | ---------------------------------------- |
| **Default**          | 4px offset     | `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| **Hover / Focus**    | 6px offset     | `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]` |
| **Active / Pressed** | 2px offset     | `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` |
| **Error**            | 4px red offset | `shadow-[4px_4px_0px_0px_#C41A16]`       |

### Rules

- **No blur. Ever.** Blur radius is always 0. Blurred shadows are for flat design. We build with bricks.
- **No spread.** Spread radius is always 0.
- **Offset direction is always down-right** (positive X, positive Y). Consistent lighting.
- **Shadow grows on hover/focus.** The brick lifts off the surface — it's about to be picked up and placed.
- **Shadow shrinks on active/press.** The brick is being pushed down into position. Click. Snap.

## Transitions

All state changes use a single, system-wide timing token. This is the "snap" — fast enough to feel physical, eased to feel like a brick clicking into place.

### Transition Token

| Property     | Value      | CSS                                                      |
| ------------ | ---------- | -------------------------------------------------------- |
| **Duration** | 150ms      | `transition-duration: 150ms`                             |
| **Easing**   | Snap curve | `transition-timing-function: cubic-bezier(0.2, 0, 0, 1)` |

### UnoCSS Shorthand

```
transition="shadow 150ms ease-[cubic-bezier(0.2,0,0,1)], background-color 150ms ease-[cubic-bezier(0.2,0,0,1)]"
```

### Rules

- **Always transition specific properties** — never use `transition-all`. Transition `shadow`, `background-color`, and `transform` as needed.
- **Disabled states don't transition.** The change is immediate — a disabled element isn't playing along.
- **150ms is the only duration.** Don't slow down transitions for "smoothness" or speed them up for "snappiness." One timing, everywhere.
- **No transitions on page load.** Elements should appear in their final state, not animate in. This also applies to SPA route transitions — no fade, slide, or crossfade between views. The new page appears instantly. Route changes are navigation, not animation.

## Interactive States

Every interactive element must communicate its state clearly. No ambiguity.

| State                | Visual Treatment                                                                                   | Transition        |
| -------------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| **Default**          | 3px black border, 4px offset shadow                                                                | —                 |
| **Hover**            | Shadow grows to 6px, background may shift (e.g., yellow highlight)                                 | 150ms snap easing |
| **Focus**            | Shadow grows to 6px, `bg-brick-yellow` highlight, `outline="none"` (see Focus Accessibility below) | 150ms snap easing |
| **Active / Pressed** | Shadow shrinks to 2px (brick snaps into place)                                                     | 150ms snap easing |
| **Disabled**         | `bg-gray-200`, `border-gray-300`, `text-gray-600`, no shadow, `cursor-not-allowed`                 | None (immediate)  |
| **Error**            | `bg-brick-red-light`, red shadow (`brick-red`), `border-brick-red`                                 | 150ms snap easing |

### Focus Accessibility (WCAG 2.4.11)

The `outline: none` in our focus state is only safe because **both** treatments — `bg-brick-yellow` and the 6px shadow — are present together. Neither is sufficient alone:

- **`--brick-yellow` (`#F5C518`) on white has a contrast ratio of ~1.55:1** — it fails as a standalone focus indicator.
- **The 6px hard shadow provides the structural, high-contrast indicator** (black on white, well above the minimum area requirement).
- **The yellow background provides the color-fill reinforcement** that makes focus unmistakable at a glance.

**Rule: `outline: none` must never be applied to a focusable element unless both `bg-brick-yellow` and the 6px shadow are present.** If either treatment is missing, keep the browser's default outline or provide an equivalent indicator. Violating this fails WCAG 2.2 Focus Appearance (2.4.11).

**Small element caveat:** WCAG 2.4.11 requires the focus indicator to have a minimum area (at least as large as a 2px-thick perimeter around the element). For very small focusable elements — icon-only buttons, compact links, or small toggle controls — verify that the 6px shadow encloses enough area to meet this requirement. If the element is smaller than ~24x24px, consider increasing its padding or minimum size so the shadow indicator is large enough to pass.

### The Snap Principle

Interactions should feel like connecting Lego bricks:

- **Hover** = picking up the brick (it lifts — shadow grows)
- **Press** = pushing it down (it snaps — shadow shrinks)
- **Focus** = highlighting the stud you're about to connect (yellow glow)

### Inline Link States

Inline body links (links within paragraphs or running text) follow different rules from navigation links and buttons:

| State       | Treatment                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default** | `text-black underline` with 3px `border-b-black` (underline via border-bottom, not text-decoration, for consistent weight)                                                                |
| **Hover**   | `bg-brick-yellow` highlight floods behind the text. The underline remains. Yellow here is consistent with its role as interactive feedback — the user is hovering on something clickable. |
| **Focus**   | Same as hover: `bg-brick-yellow` + underline. Focus and hover are visually identical for inline links.                                                                                    |
| **Active**  | `bg-brick-yellow-subtle` — the highlight softens momentarily on press, then the navigation fires.                                                                                         |

**Why yellow works here**: Yellow is reserved for interactive feedback across the system. An inline link turning yellow on hover is consistent — it signals "this is responding to you," not "this is a warning." The 3px underline on the default state already identifies it as a link before any interaction occurs.

## Layout

### Spacing

Use a consistent spacing scale. Like the grid on a Lego baseplate, spacing should be uniform and predictable.

- Use multiples of `4` for spacing (`gap-2`, `p-4`, `m-6`, etc.)
- Minimum touch target: 44x44px on mobile

Spacing hierarchy (from tightest to loosest):

| Context                                             | Gap                    | Example                         |
| --------------------------------------------------- | ---------------------- | ------------------------------- |
| **Within a component** (label + input, icon + text) | `gap-2` (8px)          | Form field with its label       |
| **Between siblings in a grid** (cards, list items)  | `gap-4` (16px)         | Card grid, inventory list       |
| **Between sections** (form groups, page zones)      | `gap-6` (24px) or more | Filter bar above a results grid |

The rule: `gap-2` for elements that belong together inside a component, `gap-4` for repeated items that tile alongside each other, `gap-6`+ for separating distinct sections of a page.

### Containers

- Max content width for readability — don't stretch text edge-to-edge
- Use `flex="~ col"` for vertical stacking (the default building direction)
- Cards and panels get the full treatment: 3px border, offset shadow, sharp corners

### Page Structure

Pages follow a predictable structure: a top navigation bar, then content. The navigation bar is full-width with a 3px bottom border — it's the baseplate everything else sits on.

- **Navigation**: Horizontal top bar. Logo left, nav links center or right. Links use uppercase text with the Snap Principle on hover/focus. Active route gets a `brick-yellow` underline (3px thick, hard).
- **Content area**: Centered with `max-w-6xl mx-auto` for readability. Full-width on mobile.
- **Sidebars** (if needed): Same 3px border treatment. Separated from main content by a thick border, not whitespace alone.

### Form Layout

Forms are central to a Lego inventory app. They follow the same brutalist principles — heavy borders, clear hierarchy, no ambiguity about what to fill in next.

**Label positioning:**

- Labels go **above** their fields, not inline. `flex="~ col" gap-2` for label + input pairs.
- Labels are `text-sm uppercase font-bold tracking-wide` — the same loud treatment as headings, scaled down.
- Required fields get no asterisk. Instead, mark optional fields with `(optional)` in `text-gray-600` after the label. Most fields in an inventory app are required — marking the minority is cleaner.

**Field grouping:**

- Related fields (e.g., "First name" + "Last name") sit side-by-side on desktop: `grid grid-cols-2 gap-4`. They stack to single-column on mobile.
- Field groups are separated from each other with `gap-6`. A group is 2–4 related fields that answer one question (e.g., "Who are you?" = name + email).
- Use a `border-b="3 black"` between major form sections (not between individual field groups). This is a structural separator, not a decorative one.

**Inputs:**

- All inputs get the full treatment: 3px black border, 4px offset shadow, `p-3` padding.
- Inputs follow all interactive states from the states table. Focus = shadow grows + yellow highlight.
- Placeholder text uses `text-gray-600`. Never use placeholder as a substitute for a label.

**Submit button placement:**

- Submit button sits at the bottom-left of the form, aligned with the fields above it. Not centered, not right-aligned.
- On mobile, submit buttons are full-width.
- Use `mt-6` to separate the submit area from the last field group — same spacing as between sections.

**Multi-column forms:**

- Maximum two columns on desktop. Three-column forms are too dense for bordered, shadowed inputs.
- On tablet (640–1024px), collapse to single column if the form has more than 4 fields.

### Grid

Use CSS Grid for data-heavy views (tables, inventory lists, card grids):

- **Card grids**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` — cards are bricks; they tile neatly.
- **Data tables**: Full-width with 3px outer border. Internal `<tr>` separator borders within a `<table>` element are 1px `gray-200` — this is the **only** exception to the 3px border rule. It applies strictly to horizontal row dividers inside tables, not to any other element or context. If something isn't a `<tr>` inside a `<table>`, it gets 3px or nothing.
- **Filter bars**: Horizontal row above content. Filters are chunky bordered elements, not floating pills.

### Breakpoints

The brand must hold at all sizes. Brutalism doesn't get soft on small screens.

| Breakpoint  | Width        | Behavior                                                                                                                                                                             |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mobile**  | < 640px      | Single column. Full-width cards. Stacked navigation (hamburger menu — see Mobile Navigation below). Shadows stay at 4px — they don't affect layout flow, so there's nothing to save. |
| **Tablet**  | 640px–1024px | Two-column grids. Side-by-side filters.                                                                                                                                              |
| **Desktop** | > 1024px     | Full layout. Three-column grids. Inline navigation.                                                                                                                                  |

### Mobile Navigation

The hamburger menu is one of the most-used components. It follows the Snap Principle fully.

**Trigger button:**

- 44x44px minimum. 3px black border, 4px offset shadow. Contains a three-line hamburger icon (2px stroke, square caps).
- Follows all standard interactive states: shadow grows to 6px on hover/focus (with `bg-brick-yellow`), shrinks to 2px on press.
- When menu is open, the trigger shows an X icon. The button stays in its pressed position (2px shadow) while the menu is open.

**Menu panel:**

- Opens as a full-width panel below the nav bar. It **pushes content down** — no overlays, no modals, no backdrop. Brutalism is honest about what it displaces.
- 3px black border on the bottom edge (the top edge shares the nav bar's bottom border — no doubled borders).
- `bg-white` background. No shadow on the panel itself — the nav bar's shadow is enough.
- Nav links inside are full-width, stacked vertically, with `p-4` padding and 3px `border-b-black` separating each item.
- Each nav link follows the Snap Principle: `bg-brick-yellow` on hover/focus, standard shadow behavior is not applicable (no shadows on items inside the panel — shadows are for elements with spatial depth, and these are flat list items).
- Active route gets a persistent `bg-brick-yellow` with `font-bold`.
- Open/close uses the system transition: 150ms, snap easing, transitioning `max-height` or `grid-template-rows` (not `height`, which triggers layout thrash).

Key rules across breakpoints:

- Borders stay 3px everywhere. Do not thin them on mobile.
- Shadows stay 4px everywhere. Box shadows don't affect layout flow — there's no space to save by shrinking them. Brutalism doesn't get soft on small screens.
- Touch targets stay 44px minimum. Brutalist buttons are already chunky — this is a strength on mobile.

## Iconography

Icons must match the weight and sharpness of the rest of the system. A thin, rounded icon next to a 3px bordered button looks broken.

### Specifications

| Property         | Value                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stroke width** | 2px — consistent with the system's heavy visual weight                                                                                                                                                                                  |
| **Line caps**    | Square (butt), not rounded — sharp corners apply to icons too                                                                                                                                                                           |
| **Line joins**   | Miter (sharp), not rounded                                                                                                                                                                                                              |
| **Fill**         | None — stroke-only icons. Fill creates a solid mass that competes visually with bordered elements, which should be the only "solid" shapes in the system. Stroke-only icons maintain consistent optical weight with the surrounding UI. |
| **Size**         | 20px (inline with text), 24px (standalone buttons)                                                                                                                                                                                      |
| **Color**        | `currentColor` — icons inherit text color. No decorative icon colors                                                                                                                                                                    |

### Recommended Library

**Phosphor Icons** (`@phosphor-icons/vue`) — use the **Bold** weight. Phosphor Bold uses 2px strokes with square-ish geometry that aligns well with the system. However, it defaults to `stroke-linecap: round` and `stroke-linejoin: round`, so apply these overrides globally:

```css
/* Phosphor Vue wraps each icon in an <i> with a class like "ph-bold ph-house".
   Target the inner SVG via the shared "ph-bold" class. Verify the actual class
   structure against the installed version of @phosphor-icons/vue — it may vary. */
.ph-bold svg {
    stroke-linecap: butt;
    stroke-linejoin: miter;
}
```

Why Phosphor over alternatives:

- **Lucide** — rounded caps by default, and its overall aesthetic is lighter/friendlier than what Brick Brutalism needs.
- **Heroicons** — also rounds by default, and the Outline variant uses thinner strokes.
- **Material Symbols** — configurable but introduces Google's design language, which clashes with the brand.

If another library is chosen, it must meet the specifications above. The stroke overrides are non-negotiable.

### Rules

- **Keep icons simple.** Prefer geometric, recognizable shapes. Avoid detailed illustrations or flourishes.
- **No rounded endcaps.** If the icon library defaults to `stroke-linecap: round`, override it to `butt`. This is not optional.
- **Icons are not decoration.** Every icon must serve a functional purpose (navigation, action indicator, status). Don't add icons for visual flair.
- **Pair with text.** Standalone icons should have an `aria-label` or adjacent text. A brick without a label is just a bump.

## Accessibility

Brick Brutalism is inherently accessible by design — high contrast and bold visual cues help everyone.

### Requirements

- **Color contrast**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Black on white exceeds this.
- **Focus indicators**: Every focusable element has a visible focus state (yellow highlight + shadow growth). The `outline: none` declaration requires **both** `bg-brick-yellow` and the 6px shadow to be present — see Focus Accessibility above. Never remove focus outlines without both replacements active.
- **Error identification**: Errors use color (red), position (below the field), and text (descriptive message) — never color alone.
- **Touch targets**: Minimum 44x44px on mobile. Chunky buttons are a feature, not a compromise.
- **Keyboard navigation**: All interactions work with keyboard. Tab order follows visual order.
- **ARIA**: Use semantic HTML first. Add ARIA only when semantics alone aren't enough.

## Lego Brick Dimensions — _Playable_

When rendering Lego bricks in the UI (e.g., decorative elements, visual indicators), use proportions based on real Lego geometry. This keeps every brick visually consistent and recognizable.

### Real Dimensions

| Part                                         | Real Size | Ratio to Unit |
| -------------------------------------------- | --------- | ------------- |
| **1 unit**                                   | 8mm       | 1.0           |
| **Stud diameter**                            | 4.8mm     | 0.6           |
| **Stud pitch** (center-to-center)            | 8mm       | 1.0           |
| **Wall thickness** (brick edge to stud edge) | 1.6mm     | 0.2           |
| **Plate height**                             | 3.2mm     | 0.4           |
| **Brick height**                             | 9.6mm     | 1.2           |

### Recommended Scale: 1mm = 5px

| Part              | Real  | Pixels | UnoCSS      |
| ----------------- | ----- | ------ | ----------- |
| **1 unit**        | 8mm   | 40px   | `w-10 h-10` |
| **Stud diameter** | 4.8mm | 24px   | `w-6 h-6`   |
| **Stud margin**   | 1.6mm | 8px    | `m-2`       |
| **Wall padding**  | 1.6mm | 8px    | `p-2`       |
| **Plate height**  | 3.2mm | 16px   | `h-4`       |
| **Brick height**  | 9.6mm | 48px   | `h-12`      |

### Brick Sizes (top-view, at 1mm = 5px)

| Brick | Grid          | Outer Size (approx) |
| ----- | ------------- | ------------------- |
| 1×1   | 1 col × 1 row | 56px × 56px         |
| 2×1   | 2 col × 1 row | 96px × 56px         |
| 4×2   | 4 col × 2 row | 176px × 96px        |
| 2×2   | 2 col × 2 row | 96px × 96px         |

### Rules

- **Always use the 0.6 ratio** for stud diameter relative to unit size. This is the single most recognizable Lego proportion.
- **Studs are round.** This is the one exception to the no-border-radius rule. Lego studs are cylinders — `rounded-full` is correct here.
- **Studs get 3px black borders and hard offset shadows** — they follow Brick Brutalism like everything else.
- **Pick a scale and stick to it.** The recommended scale is 1mm = 5px. If a different scale is needed (e.g., for small icons), maintain the ratios.

## Anti-Patterns

Things that violate the Brick Brutalism identity. If you see these in a PR, flag them.

| Don't                              | Why                                                                 | Do Instead                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `rounded`, `rounded-lg`, etc.      | Bricks have sharp edges                                             | Remove border-radius entirely (exception: `rounded-full` on Lego stud elements)                            |
| `shadow-md`, `shadow-lg` (blurred) | Fake depth, not physical                                            | Use hard offset shadows                                                                                    |
| Gradients                          | Bricks are solid-colored                                            | Use flat color fills                                                                                       |
| Opacity for emphasis               | Muddy and ambiguous                                                 | Use a different color                                                                                      |
| 1px borders                        | Too subtle, not confident                                           | Use 3px borders (sole exception: `<tr>` separators inside `<table>` elements)                              |
| Decorative color                   | Color must have meaning                                             | Reserve accent colors for states                                                                           |
| Centered paragraph text            | Hard to read                                                        | Left-align body text                                                                                       |
| Custom fonts for body text         | Performance cost outweighs typographic consistency for running text | Use system font stack for body; `font-heading` (Space Grotesk 700) is allowed for headings and labels only |
| `transition-all`                   | Overreaching, can cause jank                                        | Transition specific properties: `transition-shadow`, `transition-background-color`, `transition-transform` |

## Brand Voice in UI

### Microcopy Guidelines

- **Be direct.** "Log in" not "Sign in to your account to get started."
- **Be human.** "Something went wrong" not "Error code 500: Internal server exception."
- **Be encouraging.** "Almost there!" not "Form incomplete."
- **Use active voice.** "Save changes" not "Changes will be saved."
- **Match the visual boldness.** If the UI is loud and confident, the words should be too.

### State-Specific Copy

Every app state is a moment to reinforce the brand. Here's how the voice sounds in each:

| State                        | Tone                | Examples                                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty states**             | Inviting, playful   | "No bricks here yet. Start building!" / "Your collection is wide open. Add your first set."                                                                                                                                                                                  |
| **Loading**                  | Brief, confident    | "Loading your bricks..." / "Pulling this together..."                                                                                                                                                                                                                        |
| **Success**                  | Celebratory, short  | "Saved." / "You're all set." — Use Lego metaphors only when the action relates to physical inventory (e.g., "Brick placed!" when adding a piece to a storage location, not when saving a user preference).                                                                   |
| **Error**                    | Honest, helpful     | "That didn't work. Try again?" / "We lost the connection. Check your network."                                                                                                                                                                                               |
| **Destructive confirmation** | Clear, no drama     | "Delete this set? This can't be undone." (for single-item deletion) / "Remove all items? Gone means gone." (for bulk/irreversible wipes). Use "This can't be undone" when the user might expect an undo option; use "Gone means gone" when the finality itself is the point. |
| **Onboarding**               | Welcoming, oriented | "Welcome to Brick Inventory. Let's get your collection sorted." / "First, let's add a storage location."                                                                                                                                                                     |

### The Copy Doctrine — Building With Words

The brand voice isn't just tone — it's vocabulary. Every user-facing string should speak the language of LEGO construction. This is not decoration. If you removed the construction metaphors, the copy should feel _broken_ — like instructions for a set with the diagrams ripped out.

#### The Construction Vocabulary

These are the domain words. Use them instead of their generic equivalents.

| Generic          | Construction Equivalent                  | When to Use                                                                 |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Add / Create     | **Build**, **Place**, **Snap**           | Adding items to collections, storage, inventory                             |
| Delete / Remove  | **Disassemble**, **Pull apart**          | Removing items. "Disassemble this set?" not "Delete this set?"              |
| Save             | **Lock in**, **Set**                     | Confirming changes. "Changes locked in." not "Changes saved."               |
| Load / Fetch     | **Assemble**, **Pull together**          | Data loading. "Assembling your collection..." not "Loading..."              |
| Search           | **Dig through**                          | Searching inventory. "Dig through your bricks" not "Search your items"      |
| Filter           | **Sort by**                              | Filtering views. Sorting bricks is what you do on the floor before building |
| Empty / None     | **The bin is empty**, **No bricks here** | Empty states always reference the physical absence of bricks                |
| Error            | **Doesn't fit**, **Won't snap**          | Errors are misaligned bricks, not system failures                           |
| Collection       | **Collection** (this one stays)          | Collections of sets are already LEGO vocabulary                             |
| Storage location | **Bin**, **Shelf**, **Drawer**           | Physical storage — use the words people actually use for their LEGO storage |
| User account     | **Builder profile**                      | The person using the app is a builder                                       |

#### Construction Voice by Context

| Context                       | Voice                                 | Example                                                                                                                |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Page headings**             | Commands from the build instructions  | "YOUR SETS", "ADD A SET", "STORAGE BINS"                                                                               |
| **Button labels**             | Actions a builder takes               | "Place this brick", "Start building", "Disassemble"                                                                    |
| **Empty states**              | The builder looking at an empty table | "No bricks in this bin yet. Time to sort." / "Your collection is wide open. Snap in your first set."                   |
| **Loading states**            | The build is in progress              | "Assembling your collection..." / "Pulling bricks together..." / "Sorting the pile..."                                 |
| **Success feedback**          | The satisfying snap                   | "Locked in." / "Set placed." / "Brick snapped into place."                                                             |
| **Validation errors**         | The brick doesn't fit                 | "This piece doesn't fit here." / "Missing a piece — [field] is required." / "That brick's already placed." (duplicate) |
| **Network errors**            | The instructions blew away            | "Lost the connection. The instructions blew off the table." / "Can't reach the warehouse. Try again?"                  |
| **Destructive confirmations** | Pulling apart is permanent            | "Disassemble this set? You'll need to rebuild from scratch." / "Pull apart all storage bins? Gone means gone."         |
| **Onboarding**                | Unboxing a new set                    | "Welcome to Brick Inventory. Let's unbox your collection." / "First step: where do you keep your bricks?"              |

#### The Constraint

**LEGO metaphors must be earned.** Use construction vocabulary when the action genuinely maps to a physical building activity. Don't force it where it creates confusion:

- **Good**: "Snap in your first set" (adding = placing a brick) — the metaphor maps
- **Good**: "Assembling your collection..." (loading = building something) — the metaphor maps
- **Bad**: "Brick your password" (resetting password has no construction equivalent) — the metaphor doesn't map
- **Bad**: "Disassemble your session" (logging out is not pulling apart bricks) — just say "Log out"

When the metaphor doesn't map, fall back to the base voice: direct, confident, human. Don't stretch.

### Tagline Variants

The primary tagline is **"Every brick has a place."** Here are contextual variations:

- **Login page**: "Every brick has a place. Let's find yours."
- **Empty collection**: "Every brick has a place. This is where it starts."
- **Error page**: "This brick doesn't fit here."
- **About / Footer**: "Every brick has a place. We help you find it."

## Sound Design — Micro-Sound Specification

Brick Brutalism is a physical metaphor. Bricks have weight, edges, and — when they connect — _sound_. A design system built on the tactile joy of snapping bricks together is incomplete without an audio dimension. But sound in a web app is a minefield of annoyance. This specification defines the narrow band where sound adds delight without becoming noise.

### Philosophy

Sound is the finishing touch, not the foundation. The interface must be fully usable, fully delightful, and fully accessible with sound completely off. Sound is a layer of polish for users who opt into it — a reward for those who want the full sensory experience.

### Sound On/Off

- **Default: OFF.** Sound is opt-in. Users must explicitly enable it via a toggle in the UI (e.g., a speaker icon in the navigation bar).
- **Respect `prefers-reduced-motion`.** If the user's OS reports reduced motion preference, sound is disabled regardless of the in-app toggle. Motion and sound are both sensory stimuli — users who reduce one often want to reduce both.
- **Persist the preference** via `localStorage` (through the app storage service, per architecture rules). Once a user enables sound, it stays enabled across sessions until they turn it off.

### Signature Moments (Sounds ON)

Only five interactions get sound. These are the "signature moments" — the actions that map directly to the physical metaphor of connecting Lego bricks.

| Interaction                   | Sound Evokes                                                                                                                                                     | Duration | Notes                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Successful save/create**    | A single stud snap — the satisfying click of pressing a brick onto a baseplate. Short, crisp, slightly hollow (ABS plastic, not metal).                          | ~80ms    | The most important sound. This is the moment the user "places a brick."                                                        |
| **Delete confirmation**       | A brick being pulled apart — a brief, lower-pitched release sound. Not dramatic, not alarming. The honest sound of disconnection.                                | ~120ms   | Plays after the user confirms deletion, not on the initial click. Accompanies the action, does not warn about it.              |
| **Bulk import complete**      | A rapid cascade of snaps — multiple bricks clicking into place in sequence. The sound of a handful of bricks being pressed onto a baseplate in quick succession. | ~300ms   | Only on import completion, not on each individual item. The sound celebrates the result, not the process.                      |
| **Error/validation failure**  | A brick that doesn't fit — a dull thud of a misaligned stud. Not a buzzer, not a beep. A physical miss.                                                          | ~60ms    | Subtle. The visual error treatment (red border, red shadow, red text) does the heavy lifting. The sound is a tactile footnote. |
| **Navigation (route change)** | Silent.                                                                                                                                                          | —        | See "Silent Interactions" below.                                                                                               |

### Silent Interactions (No Sound, Ever)

| Interaction                     | Why Silent                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Hover**                       | Hover is exploratory. Sound on hover punishes browsing.                                                              |
| **Focus (keyboard navigation)** | Keyboard users tab through many elements per second. Sound on focus is auditory assault.                             |
| **Route changes**               | Navigation is not a physical action in the Lego metaphor. You don't make a sound when you walk to a different table. |
| **Loading states**              | Loading is waiting, not acting. Sound during loading creates anxiety, not delight.                                   |
| **Typing in inputs**            | The user's own keyboard provides the tactile feedback. Doubling it is redundant.                                     |
| **Toggling/expanding**          | Accordion opens, dropdown menus, filter toggles — these are UI affordances, not domain actions. They stay silent.    |

### Technical Approach

- **Web Audio API** — not `<audio>` elements. Web Audio API gives precise timing control (critical for 60–120ms samples), volume control, and avoids the latency and loading overhead of HTML audio elements.
- **Sample format**: WAV or MP3, mono, 22kHz. Each sample under 2KB. Total sound budget: **under 10KB for all five samples**.
- **Load strategy**: Lazy-load the `AudioContext` and samples on first user interaction after enabling sound. Do not load audio resources if sound is disabled.
- **Volume**: Fixed at ~30% of system volume. Sound should be _noticed_, not _heard across the room_. No user-adjustable volume — the toggle is on/off, not a mixer.
- **Concurrency**: If a sound is already playing when the same trigger fires again (e.g., rapid successive saves), interrupt and restart. Do not queue or overlap.

### Accessibility Summary

| Concern                   | Mitigation                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sound conveys information | No. All information is conveyed visually. Sound is redundant reinforcement only.                                 |
| Hearing-impaired users    | Fully functional experience without sound. Sound is cosmetic.                                                    |
| Sensory overload          | Default OFF. Respects `prefers-reduced-motion`. Only 5 triggers, all brief.                                      |
| Screen readers            | Sound does not interfere with screen reader output. Web Audio API plays independently of the accessibility tree. |

## Bold Choices Ledger

| Bold Choice                  | The Safe Default                                                 | What We're Doing Instead                                                                                                     | Why                                                                                                                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ABS-plastic color research   | Tailwind's `yellow-300` / `red-500` (generic, used by every app) | Domain-researched `--brick-yellow` (#F5C518), `--brick-red` (#C41A16) tuned from actual Lego Pantone references              | Generic utility colors make the app look like every other Tailwind project. Domain-specific values make it look like it _cares_ about Lego. The warmth and saturation of real ABS plastic is visibly different from digital color picker defaults.      |
| Heading-only custom typeface | System font stack everywhere (zero latency, zero identity)       | Space Grotesk 700 for headings only (~22KB), system fonts for body                                                           | Headings are the brand's loudest voice and they were being rendered in fonts designed to disappear. One weight, one font, heading-only — the smallest possible payload for the largest possible identity gain.                                          |
| Micro-sound design layer     | No audio (the industry default for web apps)                     | Five opt-in signature sounds evoking ABS plastic: stud snap, brick pull, cascade, misalign thud, silence for everything else | The entire design system is built on a physical metaphor (bricks snapping together) but was missing the one sense that makes physical connection _satisfying_. Sound completes the metaphor for users who want it, without imposing on those who don't. |
| Reserved palette slots       | Add colors when you need them (ad-hoc, often mismatched)         | `--brick-blue` and `--baseplate-green` defined but not yet assigned to UI roles                                              | The palette grows by drawing from curated reserves, not by inventing new colors under deadline pressure. Every future color has already been researched and contrast-checked.                                                                           |

## Performance Notes for The Illusionist

Three detonations, three performance profiles. Read before implementing.

### Detonation #1: Brick Brutalism Palette

**Impact: Zero runtime cost.** The palette is CSS custom properties and UnoCSS theme configuration. No additional assets, no runtime computation. The only change is which hex values ship in the stylesheet — the file size difference is negligible.

**Migration note:** Every reference to `yellow-300`, `yellow-100`, `red-200`, `red-500`, `red-600` in existing components must be updated to the new `brick-*` token names. This is a find-and-replace operation, but verify each replacement visually — the new values are warmer and more saturated than the Tailwind defaults they replace.

### Detonation #2: Space Grotesk Heading Font

**Impact: ~22KB woff2, one-time download.**

- Host the font file locally at `/fonts/SpaceGrotesk-Bold.woff2` — do not use Google Fonts CDN (third-party dependency, privacy concerns, extra DNS lookup).
- Add `<link rel="preload" href="/fonts/SpaceGrotesk-Bold.woff2" as="font" type="font/woff2" crossorigin>` to the HTML `<head>`.
- Use `font-display: swap` in the `@font-face` declaration (already specified in the UnoCSS config above). This means headings render in the system font immediately, then swap to Space Grotesk once loaded. The FOUT is brief and only affects headings.
- **Only load weight 700.** Do not load additional weights. If subheadings need lighter treatment, use size and tracking — not font weight.
- **Bundle budget check:** 22KB added to initial load. Current budget is 150KB per app. Verify this stays within budget after adding the font.

### Detonation #3: Micro-Sound System

**Impact: ~10KB total samples, lazy-loaded after opt-in.**

- Do not load any audio resources until the user enables sound. The `AudioContext` and sample buffers are created on first interaction after toggle.
- Samples should be committed to the repository as static assets (e.g., `/public/sounds/`). Do not fetch from external CDNs.
- The Web Audio API `AudioContext` must be created in response to a user gesture (browser policy). The sound toggle click itself is the gesture — create the context there.
- Test with browser autoplay policies. Chrome, Firefox, and Safari all require user gesture before audio. The opt-in toggle satisfies this naturally.
- **No sound on mobile unless explicitly enabled.** Mobile users have different audio expectations. The toggle applies universally, but consider defaulting the toggle to hidden on mobile breakpoints (< 640px) and only showing it in settings.

## Summary

Brick Brutalism is an interface that builds with conviction. Every pixel is a brick placed with purpose — thick borders, hard shadows, sharp corners, domain-researched colors that smell like ABS plastic. Space Grotesk stamps the headings with injection-molded authority. Five optional micro-sounds complete the physical metaphor for those who want to hear the snap. It's an experience that respects the user enough to be clear, bold enough to be memorable, and playful enough to make organizing your brick collection feel like building something great.
