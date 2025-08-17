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

## Demo 1: E‑commerce Checkout — Flow with Nested Payment Authentication
Relatable product flow where the parent checkout orchestrates steps and the payment step can spawn a nested authentication (3‑D Secure/MFA) subflow.

Narrative:
- Parent checkout steps (mode): `Cart` → `Shipping` → `Payment` → `Review` → `Confirmation`
- Nested under `Payment`:
  - `MethodEntry` (card/paypal/etc.)
  - `Authorizing` → either `AuthChallenge` (3DS/MFA) or `Authorized`
  - `AuthChallenge` → `Authorized` (on success) → back to parent `Review`
  - Error path: `AuthorizationError` with `retry`

Transitions:
- Parent-level: `proceed`, `back`, `cancel`, `submitOrder`
- Payment-level: `enterMethod`, `authorize`, `authRequired`, `authSucceeded`, `authFailed`, `retry`

Design focus (why HSM is needed):
- Parent controls the linear checkout; payment can temporarily capture control in a nested auth substate without losing the parent’s progress.
- Child-first routing: payment/auth events handled inside payment; parent only advances when payment resolves.
- Clear guards and side-effects at boundaries (e.g., only `submitOrder` when payment `Authorized`).

Proposed files: `docs/src/code/examples/hsm-checkout/`
- `machine.ts` — FactoryMachine with parent step flow and nested payment auth submachine
- `CheckoutView.tsx` — stepper UI, payment form, auth challenge view
- `index.tsx`, `example.tsx`
- Optional: `states.ts` for factories

MDX page: `docs/src/content/docs/examples/hsm-checkout.mdx`
- Live demo + `CodeTabs` with `machine.ts`, `CheckoutView.tsx`, `index.tsx`

Sidebar entry (`docs/astro.config.mjs`):
- Examples → Advanced: “Hierarchical Checkout” → `/examples/hsm-checkout`

Key teaching points:
- Parent-driven wizard with a real nested interruptible flow (3‑D Secure).
- Deterministic routing and resumption after child completion.


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


## Demo 3: Offline-Capable File Uploader — App Mode + Per-File Substates
Relatable product behavior where global connectivity and per-file lifecycles interact.

Narrative:
- Top-level app modes:
  - `Online` (uploads allowed)
  - `Offline` (queue only; retries disabled)
- Within `Online`, per-file nested substates (for each file):
  - `Queued` → `Uploading` → `Verifying` → `Completed`
  - Error path: `Uploading` → `Error` (retryable)
- Within `Offline`, files can be `Queued` but cannot transition to `Uploading` until back `Online`.

Transitions:
- App-level: `wentOffline` → `Offline`; `cameOnline` → `Online`
- File-level (child-first): `enqueue(file)`, `startUpload(fileId)`, `progress(fileId, pct)`, `uploadOk(fileId)`, `uploadErr(fileId)`, `retry(fileId)`
- Guard: starting upload only permitted when app is `Online`.

Design focus (why HSM is needed):
- Clear separation of global mode (connectivity) and per-file lifecycles.
- Deterministic child-first routing: file events target file-submachines; app mode gates availability.
- Persistence policy: keep per-file snapshot on offline mode; resume automatically when back online.

Proposed files: `docs/src/code/examples/hsm-file-uploader/`
- `machine.ts` — FactoryMachine for app mode + a registry of file submachines (child-first routing)
- `FileUploaderView.tsx` — list of files, progress, retry buttons, offline banner
- `index.tsx`, `example.tsx`
- Optional: `states.ts` for factories

MDX page: `docs/src/content/docs/examples/hsm-file-uploader.mdx`
- Live demo + `CodeTabs` with `machine.ts`, `FileUploaderView.tsx`, `index.tsx`

Sidebar entry:
- Examples → Advanced: “Hierarchical File Uploader” → `/examples/hsm-file-uploader`


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
