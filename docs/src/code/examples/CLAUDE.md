# Idiomatic Example Pattern

How interactive examples are wired into matchina docs. Follow this pattern for every new example. Deviating creates the same outlier mess as the old `store-counter` (hand-rolled wrapper, no nav, no viz).

## File layout

```
docs/src/code/examples/<id>/
  machine.ts              # createMachine(...) or createStoreMachine(...)
  <Id>View.tsx            # AppView — props: { machine } for factory, { store } for store
  # NOTHING ELSE.
  # Do NOT add index.tsx, example.tsx, or any hand-rolled wrapper component.
  # The visualizer chrome is provided by the registry + components/ExamplePreview.tsx.

docs/src/examples/<id>.example.ts   # registry entry (auto-discovered via import.meta.glob)
```

## Registry entry (`docs/src/examples/<id>.example.ts`)

```ts
import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/<id>/machine.ts?raw";
import viewRaw from "../code/examples/<id>/<Id>View.tsx?raw";

const meta: ExampleMeta = {
  id: "<id>",                          // must match folder name; must be unique
  title: "...",
  description: "...",
  category: "Basic" | "Stopwatch" | "Async" | "Fetcher" | "Hierarchical" | "Advanced",
  order: <number>,
  kind: "factory",                     // or "store" for createStoreMachine
  docSlug: "learn/examples/<id>",      // or "guides/<slug>" — viewer's "Article →" link
  defaultViz: "svg" | "reactflow",     // optional, factory only
  getMachine: () => import("../code/examples/<id>/machine").then(m => ({ default: m.create<Id>Machine })),
  getAppView: () => import("../code/examples/<id>/<Id>View").then(m => ({ default: m.<Id>View })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "<Id>View.tsx", code: viewRaw },
  ],
};

export default meta;
```

Registry auto-discovers files matching `docs/src/examples/*.example.ts`. Adding a file is enough — no central index to edit.

## Embedding in MDX

```mdx
import ExampleEmbed from "@components/ExampleEmbed.astro";
import ExampleCode from "@components/ExampleCode.astro";

<ExampleEmbed id="<id>" />

<ExampleCode id="<id>" file="machine.ts" />  {/* single file */}
<ExampleCode id="<id>" />                     {/* all files as tabs */}
```

`<ExampleEmbed>` gives you: tab bar (Preview/Code), skeleton, "open in viewer →" link to `/matchina/examples/<id>`, and (for factory machines) the visualizer picker.

Do **not** import `example.tsx` directly. Do **not** hand-roll a `<div className="bg-slate-800 ...">` wrapper. Do **not** call `<MachineVisualizer />` from MDX.

## How `kind` dispatches

- `kind: "factory"` (default) → `MachineVisualizer` → graph (SVG / ReactFlow / Sketch) + `AppView({ machine })`
- `kind: "store"` → `StoreVisualizer` → current value + collapsible "last change" + "history" + `AppView({ store })`

If you need a new kind (e.g. atom, signal), add it to `ExampleKind` in `docs/src/examples/types.ts`, build a `<Kind>Visualizer.tsx` in `docs/src/components/`, and add a branch in `ExamplePreview.tsx` and `ExamplePageViewer.tsx`.

## Why this matters

- Auto-appears in `/matchina/examples/<id>` standalone viewer + its sidebar nav
- Source files render via shared `<ExampleCode>` — no MDX-imported `?raw` strings or `CodeTabs` arrays
- Visualizer picker (SVG / ReactFlow / Sketch) works uniformly
- Search/index/category grouping all derive from the registry

## When NOT to register

Only skip the registry if the example is a one-off snippet purely illustrating syntax (e.g. `usage-*.ts` files at the root of `docs/src/code/examples/`). Anything mounted as an interactive React component goes through the registry.
