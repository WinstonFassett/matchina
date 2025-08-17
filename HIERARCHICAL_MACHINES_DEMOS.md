# Hierarchical Machines Demos

This document defines concrete, usage-first demo plans for hierarchical state machines (HSMs) using FactoryMachine only (no StoreMachine). Demos are designed to map directly into the docs examples system (code under `docs/src/code/examples/`, MDX page under `docs/src/content/docs/examples/`, and sidebar wiring in `docs/astro.config.mjs`).

Goals:
- Show practical, real-world HSMs with clear problem framing and outcomes.
- Prefer brand-first with duck-typed fallback for ergonomics.
- Explore multiple ergonomics: raw child calls, parent-only `send` with child-first routing, and note an optional facade (future).
- Keep in design mode here; utilities can be added later as needed.

## How examples are wired in docs (quick reference)
- Code lives under `docs/src/code/examples/<slug>/` with at least:
  - `machine.ts` (FactoryMachine-only)
  - `index.tsx` (usage entry shown in code tabs)
  - `example.tsx` (rendered by MDX page; typically wraps `index.tsx` or composes view + machine)
  - Optional: `states.ts`, `hooks.ts`, `*View.tsx`
- Content page under `docs/src/content/docs/examples/<slug>.mdx`:
  - Imports React demo component via `@code/examples/<slug>/example` and embeds with `<Component client:only="react" />`
  - Imports code tabs via `?raw` from `@code/examples/<slug>/*`
  - Uses `CodeTabs` component to display files
- Sidebar entry added in `docs/astro.config.mjs` under the "Examples" group.
- Path aliases configured in `docs/tsconfig.json`:
  - `@code/*` -> `src/code/*`
  - `@components/*` -> `src/components/*`

See section “Appendix: Docs Examples Pipeline” at end for a deeper walkthrough.

---

## Demo 1: Powered Traffic Light (Working/Broken) — Hierarchical
A classic traffic light with power and malfunction layers to show nested (hierarchical) states. This builds on existing traffic-light examples but demonstrates proper nesting and child-first routing.

Narrative:
- Top-level modes:
  - `Powered` (normal operations)
  - `Unpowered` (power failure)
- Within `Powered`, normal cycle:
  - `Green` → `Yellow` → `Red` → loops
- Malfunction submode under `Powered`:
  - `FlashingYellow` (caution)
  - `FlashingRed` (4-way stop)
- Transitions:
  - `tick` steps the normal cycle when in `Green|Yellow|Red`.
  - `powerFailed` → `Unpowered` from anywhere.
  - `powerRestored` → `Powered.Red` (safe return) or remembered last normal.
  - `malfunction` → `Powered.FlashingYellow` (enter malfunction)
  - `repair` → return to last normal sequence state.

Design focus:
- Parent (`Powered|Unpowered`) owns child region (normal vs malfunction). Parent-only `send` routes events child-first, then bubbles to parent if unhandled.
- Keep “brand-first with duck-typed fallback” on event naming and state factories.
- No StoreMachine—only FactoryMachine.

Proposed files: `docs/src/code/examples/hsm-traffic-light/`
- `states.ts` — keyed state factories (Powered, Unpowered, and Powered’s children)
- `machine.ts` — FactoryMachine definition and child-first routing
- `TrafficLightView.tsx` — visual UI (colors, flashing indicators)
- `index.tsx` — usage entry (create machine, render view)
- `example.tsx` — small wrapper for MDX to mount demo

MDX page: `docs/src/content/docs/examples/hsm-traffic-light.mdx`
- Renders the demo and shows `states.ts`, `machine.ts`, `TrafficLightView.tsx`, and `index.tsx` via `CodeTabs`

Sidebar entry (`docs/astro.config.mjs`):
- Under Examples → Advanced: “Hierarchical Traffic Light” → `/examples/hsm-traffic-light`

Key teaching points:
- Child-first routing: event handled at deepest active child; bubbles if unhandled.
- Exceptional modes as nested children (malfunction).
- Controlled re-entry from `Unpowered` back to a safe child state.


## Demo 2: Media Player — Mode with Nested Substates
Demonstrates parent mode controlling available submachines and child-first event handling.

Narrative:
- Top-level modes:
  - `Idle` (no track)
  - `Ready` (track loaded)
- `Ready` contains player substates:
  - `Playing`, `Paused`, `Buffering`
- Transitions:
  - `load(track)` → `Ready.Paused`
  - `play`/`pause` toggle between `Playing` and `Paused`
  - `bufferStart`/`bufferEnd` switch to/from `Buffering`
  - `unload` → `Idle`

Design focus:
- Parent `Ready` owns child region (Playing/Paused/Buffering). Parent-only `send` delegates to child first.
- Transitions like `load(track)` are on parent only.
- Clean brand-first events with duck-typed usage.

Proposed files: `docs/src/code/examples/hsm-media-player/`
- `machine.ts` — FactoryMachine with nested region under `Ready`
- `MediaPlayerView.tsx` — UI with controls and indicators
- `index.tsx` and `example.tsx`
- Optional `states.ts` if helpful for clarity

MDX page: `docs/src/content/docs/examples/hsm-media-player.mdx`
- Live demo + code tabs

Sidebar entry:
- Examples → Advanced: “Hierarchical Media Player” → `/examples/hsm-media-player`

Key teaching points:
- Mode-driven availability of child machine.
- Explicit parent-level transitions vs child-level transitions.
- Deterministic child-first bubbling.


## Demo 3 (optional/future): Door with Lock (Simple Nesting)
A minimal example to keep HSM mental model simple.

- Top-level: `Powered` vs `Unpowered` (optional)
- Nested under `Powered`: `Locked` ↔ `Unlocked`, with `Open` only possible in `Unlocked`
- Events: `lock`, `unlock`, `open`, `close`, `powerFailed`, `powerRestored`
- Shows guard patterns (e.g., `open` only allowed when `Unlocked`)


## Implementation Recipes (shared)
- Prefer `defineState` factories for each state and substate to keep inference crisp.
- Parent-only `send(ev)` with deterministic routing:
  1) Try deepest active child (if region active)
  2) If unhandled, handle at parent
- Keep snapshot(s) for returning from exceptional modes (e.g., re-enter malfunction/repair flows)
- Keep UI components focused on reading state and sending events—no hidden writes.


## Deliverables Checklist
For each demo:
- Code under `docs/src/code/examples/<slug>/`
  - `machine.ts`, `index.tsx`, `example.tsx`, view and optional helpers
- MDX page under `docs/src/content/docs/examples/<slug>.mdx`
  - Imports component via `@code/examples/<slug>/example`
  - Imports code via `?raw` and renders `CodeTabs`
- Sidebar entry in `docs/astro.config.mjs`
  - Add item under Examples (Advanced)


## Appendix: Docs Examples Pipeline (Detailed)

1) Code location and aliasing
- Place example code at `docs/src/code/examples/<slug>/...`.
- `docs/tsconfig.json` defines `@code/*` → `src/code/*`. Import code in MDX with `@code/examples/<slug>/...`.

2) MDX page shape
- Frontmatter sets `title` and `description`.
- Import demo React component and mount with client directive:
  ```mdx
  import Demo from "@code/examples/<slug>/example";
  <div className="not-content">
    <Demo client:only="react" />
  </div>
  ```
- Import files as raw text for tabs (use `?raw`):
  ```mdx
  import machineCode from "@code/examples/<slug>/machine.ts?raw";
  import indexCode from "@code/examples/<slug>/index.tsx?raw";
  ```
- Render with `CodeTabs`:
  ```mdx
  <CodeTabs files={[
    { name: "machine.ts", code: machineCode },
    { name: "index.tsx", code: indexCode },
  ]} />
  ```

3) Example React components
- `example.tsx` is the mount point used by docs. It typically creates the machine and renders a view.
- `index.tsx` is the source shown to users as the canonical usage snippet (kept free of MDX scaffolding).

4) Sidebar navigation
- `docs/astro.config.mjs` holds the entire sidebar structure. Add your entry under the appropriate section:
  ```ts
  {
    label: "Advanced",
    items: [
      { label: "Hierarchical Traffic Light", link: "/examples/hsm-traffic-light" },
    ],
  }
  ```

5) Components used in docs
- `CodeTabs` and `CodeBlock` live under `docs/src/components/`. Use them to render code nicely.

6) Build/run
- The docs site is an Astro + Starlight project. Examples are compiled as part of the site.

---

If you want me to proceed, I can implement Demo 1 end-to-end (code, MDX, and sidebar) following this plan.
