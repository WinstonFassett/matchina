# Design

## Overview

Editorial direction. Serif display type paired with Geist sans for UI and Geist Mono for code and meta. Warm off-white light mode, near-black dark mode. Sharp corners everywhere. 1px hairlines as the only structural element. Zero shadows.

Source of truth for visual values: [`/Users/winston/Downloads/matchina-starlight-redesign-ui26/`](../../../Downloads/matchina-starlight-redesign-ui26/). The handoff README, `tokens.css`, `colors_and_type.css`, and `starlight-overrides.css` are the authoritative reference. When the handoff and this file conflict, the handoff wins.

---

## Color

### Strategy

**Restrained** in light. **Committed** in dark. Light mode uses near-black as its accent — functional, not decorative. Dark mode elevates electric lime (`#d4ff4f`) as a high-contrast accent that carries CTAs and active states without being decorative.

### Palettes

**Light** (default):

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f6f5f1` | Page background (warm off-white) |
| `--color-bg-panel` | `#ffffff` | Cards, panels |
| `--color-bg-panel2` | `#faf9f6` | Inline code, secondary panels |
| `--color-bg-panel3` | `#ecebe4` | Hover fills, tertiary surfaces |
| `--color-border` | `#e3e0d8` | 1px rules and borders |
| `--color-border-soft` | `#ecebe4` | Softer dividers |
| `--color-border-strong` | `#c7c2b7` | Emphasized borders |
| `--color-text` | `#15130f` | Body text |
| `--color-text-dim` | `#6a665d` | Dimmed / lead paragraph text |
| `--color-text-mute` | `#a09b91` | Muted meta, placeholders |
| `--accent` | `#15130f` | CTA background (near-black) |
| `--accent-ink` | `#eaff74` | Text on accent (lime) |
| `--color-accent-fog` | `#8ab4d8` | Fog blue — links, info, secondary accent |
| `--color-accent-soft` | `rgba(138,180,216,0.2)` | Fog blue tint backgrounds |

**Dark** (`[data-theme="dark"]`):

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0e0e0f` | Page background |
| `--color-bg-panel` | `#141416` | Cards, panels |
| `--color-bg-panel2` | `#1a1a1c` | Inline code, secondary panels |
| `--color-bg-panel3` | `#212124` | Tertiary surfaces |
| `--color-border` | `#262628` | 1px rules |
| `--color-border-soft` | `#1e1e20` | Soft dividers |
| `--color-border-strong` | `#36363a` | Emphasized borders |
| `--color-text` | `#ececec` | Body text |
| `--color-text-dim` | `#8a8a90` | Dimmed text |
| `--color-text-mute` | `#56565c` | Muted meta |
| `--accent` | `#d4ff4f` | Electric lime — CTA, active state |
| `--accent-ink` | `#0e0e0f` | Text on accent |
| `--color-accent-fog` | `#8ab4d8` | Fog blue — links, info |
| `--color-accent-soft` | `rgba(138,180,216,0.14)` | Fog blue tint backgrounds |

**Semantic** (light / dark):

| Role | Light | Dark |
|---|---|---|
| Success | `#2f7a3a` | `#8fd1a3` |
| Warn | `#a35a00` | `#e6b86a` |
| Danger | `#b3332e` | `#e68a8a` |
| Info | `#1f5ab8` | `#8fb9d6` |
| Purple | `#6a3fb5` | `#b89dd8` |

### Alternate accents (available, not default)

Swap into `--accent` when exploring palette variants. These are documented in `colors_and_type.css` as commented-out properties.

| Name | Value | Character |
|---|---|---|
| Soft gold | `#e6d089` | Warm, refined |
| Lavender | `#b89dd8` | Dusty, unexpected |
| Apricot | `#e0a876` | Warm, friendly |

### Syntax highlighting

| Token | Light | Dark |
|---|---|---|
| Keyword | `#6a3fb5` | `#c8a6ff` |
| Identifier | `#0a6fb3` | `#8fd1ff` |
| String | `#a35a00` | `#ffd48a` |
| Comment | `#a09b91` | `#56565c` |
| Tag | `#b54a78` | `#ffa8c2` |
| Punctuation | `#6a665d` | `#8a8a90` |
| Highlight line bg | `#fff6b3` | `#2a2a15` |

---

## Typography

Three families. Never more.

| Family | Variable | Use |
|---|---|---|
| Newsreader | `--font-serif` | Display headlines, stat numerals |
| Geist | `--font-sans` | All UI text, body, headings H1–H3, buttons, sidebar |
| Geist Mono | `--font-mono` | Code, eyebrows, breadcrumbs, badges, meta, shortcuts |

### Type scale

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Display XL | serif | 64px | 500 | 1.02 | −0.025em |
| Display LG / H1 hero | serif | 48–60px | 500 | 1.02 | −0.022em |
| H1 | sans | 28px | 600 | 1.2 | −0.015em |
| H2 | sans | 20–24px | 600 | 1.25 | −0.015em |
| H3 | sans | 15–16px | 600 | 1.3 | — |
| Body LG | sans | 15px | 400 | 1.55 | — |
| Body | sans | 13px | 400 | 1.55 | — |
| Caption | sans | 11px | 400 | 1.4 | — |
| Eyebrow | mono | 10px | 500 | 1.4 | 0.12em |
| Code | mono | 12px | 400 | 1.6 | — |
| Mono SM | mono | 11px | 400 | 1.65 | — |
| Nav / sidebar | sans | 12px | 400 | — | — |

### Rules

- Hero headline (Newsreader 500, 60px): mix italic 400 secondary phrase within the same `<h1>` using `<em class="dim">` for the soft phrase and `<em>` for the keyword.
- Eyebrows: ALL-CAPS mono, `letter-spacing: 0.12em`, `color: --color-text-mute`. Used for section labels (`DOCS / CORE`), figure labels (`fig.01 — fetcher machine`), badge labels (`ACTIVE`).
- Stat numerals: Newsreader italic, 18px, paired with mono 11px labels.
- Body copy in docs: max-width 65–75ch; lead paragraphs use `--color-text-dim`.
- No gradient text, ever. No `background-clip: text`.

---

## Spacing

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 14px |
| `--space-lg` | 20px |
| `--space-xl` | 28px |
| `--space-2xl` | 48px |

Content padding: `48px 56px` in the main column. Sidebar section header padding: `16px 16px 6px` (first section: `2px 16px 6px`). Sidebar items: `3px 16px` vertical/horizontal.

---

## Layout

```
240px | 1fr | 260px
sidebar · main content · TOC
```

**Index / landing pages** (site root, section landing pages): no sidebar. Full-width layout. The sidebar is for docs/guides/reference only — it should not appear on pages where the content IS the pitch.

| Token | Value |
|---|---|
| `--sl-content-width` | `56rem` |
| `--sl-nav-height` | `44px` |
| `--sl-sidebar-width` | `240px` |

Top bar: 44px height, 1px bottom hairline, same 3-column grid as page layout. No floating, no sticky (Starlight handles scroll behavior).

Hero card: 2-column split at `1fr 1fr`, 1px border on all sides, 1px internal divider. Left: diagram pane. Right: code pane. Each pane has a mono-uppercase header row (eyebrow label + status indicator).

Stat row: flex `gap: 48px`, aligned baseline.

---

## Radii & Shadows

**Radii:** 0 everywhere. Two exceptions only:
- User avatars: `border-radius: 50%`
- Code-block copy button: `border-radius: 2px`

**Shadows:** none. Elevation is expressed via background steps (`--color-bg` → `--color-bg-panel` → `--color-bg-panel2`) and 1px hairline borders. No `box-shadow` anywhere.

---

## Components

### Top bar

- Logo SVG (20×20, `currentColor`) + wordmark "Matchina" in Newsreader italic 22px + version pill (mono 10px, muted, 1px border).
- Center: search pill. 1px border, padding `4px 10px`, mono 11px placeholder, `⌘K` shortcut on right. Min-width 360px.
- Right: nav links `docs / examples / github ↗`, theme toggle `[● dark|○ light]`. All mono 11px.

### Sidebar

- Section headers: mono 10px ALL-CAPS, `letter-spacing: 0.12em`, `--color-text-mute`.
- Items: Geist 12px, `padding: 3px 16px`. Active item: `border-left: 2px solid var(--accent)`, background `--color-bg-panel2`, `font-weight: 500`.
- No icons. No expand/collapse chevrons.

### Buttons

- **Primary:** background `--accent`, color `--accent-ink`, padding `10px 16px`, mono 12px, weight 600, `letter-spacing: 0.02em`, 0px border-radius. Label + arrow (`→`).
- **Secondary:** 1px border `--color-border`, same padding and mono sizing, no background. Install command format: `$ npm i matchina ⎘`.

### Badges / pills

- 1px bordered capsule, mono 10px ALL-CAPS, `padding: 2px 6px`.
- Version pills: `v2.1` in `--color-text-mute`.
- Status badges: colored text matching semantic tokens.
- Middot separator in compound labels: `P1 · HIGH`.

### Code blocks

- Background: `--color-bg-panel2`. 1px border. No rounded corners.
- Line numbers: mono 10px, `--color-text-mute`.
- Copy button: 2px radius (the one exception), top-right corner.
- Header row when present: mono 10px eyebrow with tool/file label and optional timing (`142ms`).

### Callout / Note

- Background tint using semantic color at low opacity. 1px border in matching semantic color. No side-stripe border (banned).
- Leading icon is functional, not decorative.

### Hero card diagram pane

- Background: `--color-bg-panel2`. Dotted grid: 0.7px circles at 60×50px spacing in `--color-border-soft`.
- State nodes: 32px tall, sharp rectangles (`border-radius: 0`). Active node: `--accent` bg, `--accent-ink` text.
- Edges: 1.5px lines, small arrow triangles. Edge labels: mono 9px.
- Live indicator: `● live` in accent color, mono 10px.

---

## Motion

- Ease out only: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) or `cubic-bezier(0.25, 1, 0.5, 1)` (quart-out).
- No bounce, no elastic, no spring presets.
- **Visualizer transitions** — layout animation is intentional and welcome on the diagram/visualization surfaces. When switching between visualization modes (Mermaid → ReactFlow → SVG etc.), animating the transition is preferred. Keep it smooth and purposeful; not decorative for its own sake.
- **Active state changes** — the primary interaction pattern: state nodes change active/inactive. This is a fade (opacity transition), not a layout animation. Duration ~150ms.
- Respect `prefers-reduced-motion`: suppress all decorative and layout animation, keep functional transitions (sidebar collapse, search open) at `duration: 0`. Visualizer viz-picker transitions should also reduce to instant swap.

---

## Copy conventions

- Eyebrows / section labels: ALL-CAPS mono (`DOCS / CORE / PATTERN MATCHING`)
- Sidebar items: Sentence case (`State machines`, `createMachine()`)
- Headlines: Sentence case, never Title Case
- Buttons: Sentence case (`Get started`, `Save changes`)
- Badges/labels: ALL-CAPS mono (`ACTIVE`, `P1 · HIGH`)
- Em dash spacing: ` — ` (spaces on both sides) for inline narrative use
- Middot `·` as separator in badges and stat rows
- Slashes in breadcrumbs: ` / `
- Keyboard shortcuts: bordered mono pills (`⌘K`, `↵`)
- No emoji anywhere. Functional Unicode glyphs only: `→ ↗ ⎘ ✕ ⌘ ⌕ ✦ ⤓ ⧉`

---

## Starlight integration

Overrides are applied via:
- `src/styles/custom.css` — token definitions (see `design_handoff_matchina_editorial/tokens.css`)
- `docs/src/styles/starlight-overrides.css` — patches on Starlight defaults (nav, sidebar, hero, TOC, code blocks)
- `astro.config.mjs` → `starlight({ customCss: [...], components: { ... } })`

Starlight's own `--sl-*` variables are remapped to the Editorial tokens. Key remaps:
- `--sl-font` → `var(--font-sans)`
- `--sl-color-bg` → `#f6f5f1` / `#0e0e0f`
- `--sl-color-text-accent` → `#15130f` / `#d4ff4f`
- `--sl-nav-height` → `44px`
- `--sl-sidebar-width` → `240px`
- `--sl-content-width` → `56rem`
