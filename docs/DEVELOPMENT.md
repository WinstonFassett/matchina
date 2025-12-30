# Matchina Development Patterns

**This is a reference guide, not prescriptive process.** Use what's relevant to your task. Focus on making things work.

**User manages:** git, branches, commits, staging, dev server
**You focus on:** tests passing, UI working, code quality

## Development Flow

### Core → Tests → Examples → Docs

```
/src (implement) → /test (verify) → examples (demonstrate) → docs (explain)
```

**Key Principle:** Beyond unit tests, we use realistic examples. They serve dual purposes:
- Living documentation with interactive visualizations
- Integration tests for real-world usage patterns

**Troubleshooting:** If example bugs might be in core, pivot to `/test` and write failing tests first.

---

## Directory Structure

### Library Core (`/src`)

```
src/
├── index.ts                    # Main entry point
├── matchbox-factory.ts         # Foundation: tagged unions
├── factory-machine.ts          # Full-featured state machines
├── store-machine.ts            # Simple state containers
├── promise-machine.ts          # Async operation management
├── ext/                        # Extensions (setup, funcware, methodware)
├── extras/                     # Optional utilities (emitter, effects, etc.)
└── integrations/               # Library bridges (react, zod, valibot)
```

### Documentation Site (`/docs`)

```
docs/
├── src/
│   ├── code/
│   │   └── examples/           # Raw code examples
│   │       └── example-name/
│   │           ├── machine.ts        # Exports createXyzMachine() function
│   │           ├── XyzView.tsx       # React component (takes machine prop)
│   │           ├── example.tsx       # For docs (with MachineVisualizer)
│   │           ├── index.tsx         # Clean export (no demo wrapper)
│   │           └── [optional files]  # hooks.ts, types.ts, states.ts, etc.
│   ├── content/
│   │   └── docs/
│   │       ├── examples/       # MDX pages that render examples
│   │       ├── guides/         # Conceptual documentation
│   │       └── reference/      # Auto-generated API docs
│   └── components/
│       ├── inspectors/         # Visualizers (mermaid, force-graph, etc.)
│       ├── MachineVisualizer.tsx
│       ├── CodeTabs.astro
│       └── CodeBlock.astro
├── astro.config.mjs            # Sidebar configuration (MUST UPDATE)
└── tsconfig.json               # Path aliases
```

### Test Suite (`/test`)

```
test/
├── matchbox.test.ts
├── factory-machine.test.ts
├── promise-machine.test.ts
└── [22 total test files]
```

---

## Adding Core Features

### Checklist for New Core Features

When adding a feature like hierarchical state machines:

- [ ] **1. Implement in Core** (`/src`)
  - Create new module or extend existing
  - Follow nano-sized, composable pattern
  - Export types and factory functions

- [ ] **2. Write Unit Tests** (`/test`)
  - Test type inference (compile-time safety)
  - Test runtime behavior
  - Cover edge cases
  - Aim for comprehensive coverage

- [ ] **3. Create At Least One Example** (`/docs/src/code/examples`)
  - Follow the [Example Structure Pattern](#example-structure-pattern)
  - Create realistic, understandable use case
  - Include visualizer integration

- [ ] **4. Add Example to Sidebar** (`docs/astro.config.mjs`)
  - Choose appropriate section (Basic, Async, Advanced, etc.)
  - Add entry with label and link

- [ ] **5. Create Documentation Page** (`/docs/src/content/docs/examples`)
  - Create MDX file matching example name
  - Import example component and raw source files
  - Document the pattern and use case

- [ ] **6. Update Size Limits** (`.size-limit.json`)
  - Add entry for new public API if applicable
  - Ensure bundle size stays under limits

- [ ] **7. Update Package Exports** (`package.json`)
  - If adding new integration point (like `/react`, `/zod`)
  - Update exports field

- [ ] **8. Update CLAUDE.md** (if architectural change)
  - Document new patterns
  - Update architecture overview

---

## Creating Examples

### Example Structure Pattern

Every example follows a consistent file structure:

#### 1. `machine.ts` - Machine Factory

**CRITICAL:** Always export a **factory function**, never a global instance.

```typescript
import { createMachine, defineStates } from "matchina";

export const createToggleMachine = () => {
  const states = defineStates({
    On: () => ({}),
    Off: () => ({}),
  });

  const machine = createMachine(
    states,
    {
      On: { toggle: "Off" },
      Off: { toggle: "On" },
    },
    states.Off()
  );

  return machine;
};

export type ToggleMachine = ReturnType<typeof createToggleMachine>;
```

**Why factory functions?**
- Allows multiple instances
- Works with React's useMemo
- Avoids shared state bugs

#### 2. `XyzView.tsx` - Presentation Component

React component that receives machine as a prop:

```typescript
import { useMachine } from "matchina/react";
import type { ToggleMachine } from "./machine";

export function ToggleView({ machine }: { machine: ToggleMachine }) {
  const state = useMachine(machine);

  return (
    <div>
      <div>Status: {state.key}</div>
      <button onClick={() => machine.send("toggle")}>
        Toggle
      </button>
    </div>
  );
}
```

#### 3. `example.tsx` - Documentation Demo

Wraps the example with visualizer for docs:

```typescript
import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

export default function ToggleExample() {
  const machine = useMemo(createToggleMachine, []);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={ToggleView}
      showRawState={true}
      defaultViz="auto"  // or "reactflow", "forcegraph", "sketch", "mermaid-statechart", "mermaid-flowchart"
    />
  );
}
```

**Visualizer Types:**
- `auto` - Auto-selects best visualizer based on machine complexity (default)
- `reactflow` - React Flow node-based diagram
- `forcegraph` - Interactive force-directed graph
- `sketch` - Sketch.systems style nested layout
- `mermaid-statechart` - Mermaid statechart diagram
- `mermaid-flowchart` - Mermaid flowchart diagram

#### 4. `index.tsx` - Clean Export

Component without demo wrapper (for use outside docs):

```typescript
import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

export function ToggleDemo() {
  const machine = useMemo(createToggleMachine, []);
  return <ToggleView machine={machine} />;
}
```

#### 5. Optional Files

- `hooks.ts` - Custom hooks (usually not needed)
- `types.ts` - Shared TypeScript types
- `states.ts` - State definitions (for complex examples)
- `utils.ts` - Helper functions

### Example Naming Conventions

- Use kebab-case for directory names: `rock-paper-scissors`, `traffic-light`
- Use PascalCase for component names: `ToggleView`, `StopwatchView`
- Use camelCase for function exports: `createToggleMachine`

### When to Create a Custom View vs. Using Default

**Create Custom View when:**
- Example needs specific UI/UX
- Demonstrating particular interaction patterns
- Showing integration with forms, animations, etc.

**Use Default View when:**
- Simple state visualization is sufficient
- Focus is on machine logic, not presentation

---

## Creating Documentation Pages

### MDX Page Structure

Create file in `docs/src/content/docs/examples/example-name.mdx`:

```mdx
---
title: Toggle State Machine
description: A basic on/off toggle state machine example
---

import ToggleExample from "@code/examples/toggle/example";
import machineCode from "@code/examples/toggle/machine.ts?raw";
import viewCode from "@code/examples/toggle/ToggleView.tsx?raw";
import indexCode from "@code/examples/toggle/index.tsx?raw";
import CodeBlock from "@components/CodeBlock.astro";
import CodeTabs from "@components/CodeTabs.astro";

A simple toggle state machine that switches between `On` and `Off` states.

<div className="not-content">
  <ToggleExample client:only="react" />
</div>

## Implementation Details

Key concepts demonstrated:
- Two simple states with direct transitions
- Using `addEventApi` for clean transition API
- Pattern matching with `.match()`

## Source Code

<CodeTabs
  files={[
    { name: "machine.ts", code: machineCode },
    { name: "ToggleView.tsx", code: viewCode },
    { name: "index.tsx", code: indexCode },
  ]}
/>

## Next Steps

- [Counter Example](/matchina/examples/counter)
- [Traffic Light](/matchina/examples/traffic-light)
```

**Key Points:**
- Use `?raw` import suffix for code display
- Wrap interactive example in `<div className="not-content">`
- Use `client:only="react"` for React components in Astro
- Reference other examples with full paths including `/matchina/` base

### Adding to Sidebar

Edit `docs/astro.config.mjs`:

```javascript
{
  label: "Examples",
  items: [
    {
      label: "Basic",
      items: [
        {
          label: "Toggle",
          link: "/examples/toggle",
        },
        // Add new example here
      ],
    },
  ],
}
```

**Sections:**
- **Basic** - Simple, fundamental patterns
- **Stopwatches** - Multiple approaches to same problem
- **Async** - Asynchronous operations
- **Fetchers** - Data fetching patterns
- **Advanced** - Complex, real-world scenarios

---

## Path Aliases & Imports

### Available Aliases (from `docs/tsconfig.json`)

```json
{
  "@components/*": ["docs/src/components/*"],
  "@code/*": ["docs/src/code/*"],
  "@lib/*": ["../*"],
  "matchina": ["../src/index.ts"],
  "matchina/*": ["../src/*"],
  "matchina/react": ["../src/integrations/react"]
}
```

### Usage Patterns

**In Example Code:**
```typescript
import { createMachine } from "matchina";
import { useMachine } from "matchina/react";
```

**In MDX Documentation:**
```typescript
import Example from "@code/examples/toggle/example";
import machineCode from "@code/examples/toggle/machine.ts?raw";
import { CodeTabs } from "@components/CodeTabs.astro";
```

**In Components:**
```typescript
import { MachineVisualizer } from "@components/MachineVisualizer";
```

### When to Use Relative vs. Alias

**Use Aliases:**
- Importing from matchina library: `matchina`, `matchina/react`
- Importing components: `@components/*`
- Importing examples: `@code/*`

**Use Relative Paths:**
- Within same example directory
- Sibling files in same folder

**Example:**
```typescript
// Within toggle example
import { ToggleView } from "./ToggleView";  // ✅ Relative (same dir)
import { createToggleMachine } from "./machine";  // ✅ Relative (same dir)
import { MachineVisualizer } from "@components/MachineVisualizer";  // ✅ Alias
import { useMachine } from "matchina/react";  // ✅ Alias
```

---

## Testing Strategy

### Unit Tests (Primary)

Core development starts with unit tests in `/test`:

```typescript
describe("createMachine", () => {
  it("should create machine with type-safe transitions", () => {
    const machine = createToggleMachine();
    expect(machine.getState().key).toBe("Off");

    machine.send("toggle");
    expect(machine.getState().key).toBe("On");
  });
});
```

**Run Tests:**
```bash
npm test                # Type check + Vitest with coverage
npm run dev             # Vitest watch mode
npm run test:types      # TypeScript type checking only
npm run coverage        # Coverage report
```

**Test Single File:**
```bash
npx vitest run test/matchbox.test.ts
npx vitest run test/matchbox.test.ts -t "pattern"  # Specific test
```

### Integration Tests (Examples)

Examples serve as integration tests:
- Verify real-world usage patterns
- Test TypeScript inference in realistic scenarios
- Visual validation through docs

### Build Validation

```bash
npm run build           # Build lib + docs
npm run build:lib       # Library only (includes size checks)
npm run test-build      # Validate types + docs
```

---

## Documentation Site

### Development

**USER runs dev server. Agents assume it's running.**

```bash
cd docs
npm run dev             # Astro dev server at localhost:4321 (USER RUNS)
npm run build           # Build static site
npm run preview         # Preview built site
```

### Troubleshooting Dev Server

If you encounter errors about missing matchina modules when running `npm run dev:docs`:

```bash
# Error: Cannot find module 'matchina' or its corresponding type declarations
# Error: Cannot find module 'matchina/hsm' or its corresponding type declarations
```

**Cause:** The `unbuild --stub` command cleans the dist directory, but the typedoc plugin needs the built files.

**Solution:** The dev:prepare script builds first, then stubs:

```bash
npm run dev:docs    # This runs: npm run build:lib && unbuild --stub
```

**Manual fix if needed:**
```bash
npm run build:lib    # Build the library first
npm run dev:docs     # Then run dev server
```

### Deployment

Documentation is hosted on GitHub Pages:

```bash
npm run deploy          # Build and deploy to gh-pages
```

**URL:** https://winstonfassett.github.io/matchina/

### Starlight Configuration

The docs use Astro with Starlight theme:

- **Theme:** Material Ocean
- **Auto-generated API docs:** Via starlight-typedoc plugin
- **Custom CSS:** `docs/src/styles/global.css`
- **TypeDoc Integration:** Generates reference from JSDoc comments

---

## Quick Reference: Adding a New Example

```bash
# 1. Create example directory and files
mkdir -p docs/src/code/examples/my-example
touch docs/src/code/examples/my-example/{machine.ts,MyExampleView.tsx,example.tsx,index.tsx}

# 2. Implement the files following patterns above

# 3. Create documentation page
touch docs/src/content/docs/examples/my-example.mdx

# 4. Update astro.config.mjs sidebar

# 5. Test the example
cd docs
npm run dev

# 6. Verify in browser at localhost:4321/matchina/examples/my-example
```

---

## Common Patterns

### Shared Components

For examples that share UI elements:

```
docs/src/code/examples/
├── stopwatch-common/
│   ├── StopwatchView.tsx       # Shared view
│   ├── StopwatchDevView.tsx    # Debug view
│   └── types.ts                # Shared types
├── stopwatch/
│   └── machine.ts              # Imports from ../stopwatch-common
└── stopwatch-using-hooks/
    └── machine.ts              # Also imports from ../stopwatch-common
```

### Library Utilities

Shared utilities for examples:

```
docs/src/code/examples/lib/
├── matchina-machine-to-xstate-definition.ts  # Convert for visualizers
└── other-helpers.ts
```

### Complex State Definitions

For complex machines, separate state definitions:

```typescript
// states.ts
export const checkoutStates = defineStates({
  Cart: (items: Item[]) => ({ items }),
  Shipping: (address: Address) => ({ address }),
  Payment: (card: Card) => ({ card }),
  Confirmed: (order: Order) => ({ order }),
});

// machine.ts
import { checkoutStates } from "./states";
export const createCheckoutMachine = () => {
  return createMachine(checkoutStates, transitions, initialState);
};
```

---

## Critical Patterns

### Do's

✅ Export factory functions from `machine.ts` (NO global instances!)
✅ Use `useMemo(() => createMachine(), [])` in React
✅ Write tests to verify behavior
✅ Update `astro.config.mjs` sidebar for new examples
✅ Use `?raw` suffix for code imports in MDX

### Don'ts

❌ Don't export global machine instances
❌ Don't skip adding examples to astro.config.mjs sidebar
❌ Don't waste time on builds/typechecking unless asked
❌ Don't skip tests

---

## Troubleshooting

**When bugs appear:**
1. Is it in core or just the example?
2. If core → write failing test in `/test`, fix in `/src`
3. If example → fix directly in example code
4. Evidence > assumptions

**What matters:**
- Tests pass (`npm run dev` watch mode)
- UI works in browser
- State machine behaves correctly

**What matters less** (unless requested):
- Builds (user runs when needed)
- Typechecking (unless explicitly asked)
- Linting (usually auto-fixed)

---

## Quick Reference

Check existing examples in `docs/src/code/examples/` for patterns. See `FEATURE-CHECKLIST.md` for step-by-step reference.
