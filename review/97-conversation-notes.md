# Matchina: Conversation Notes (Ongoing)

This document captures ongoing discussion points and decisions as they emerge.

---

## API Naming & Machine Creation

### Problem: `machine` as function name

User feedback: "I don't like a function called `machine` because I tend to call the variable instance `machine`."

**Verbs are good.** 

### Problem: `matchina()` for creating machines

User feedback: "I don't love `matchina()` for creating machines."

### Alternative Approaches

**Option A: Options object**
```typescript
createMachine(states, transitions, init, { api: true })
```

**Option B: Builder pattern**
```typescript
buildMachine(states, transitions, init).extend(...)
```

**Option C: Chainable extensions**
```typescript
machine.extend(ApiFeature).extend(SubscribeFeature)
```

**Option D: Recipe/preset**
```typescript
createMachine.withApi(states, transitions, init)
// or
createMachine(states, transitions, init).withApi()
```

### User Preference

- Want a way to easily create a machine with a specific recipe
- Preference is usually to add API
- Want flexibility for other extensions too

### Direction

Explore builder/extension pattern. Keep `createMachine()` as base, add composable extensions.

---

## Replacing `matchina()` — DECIDED

**Decision**: Use `.extend()` on machine.

```typescript
const machine = createMachine(states, transitions, "init")
  .extend(withEventApi)
  .extend(withSubscribe);
```

### Why `.extend()`

| Criteria | `.extend()` |
|----------|-------------|
| Tree-shakeable | ✓ Only bundled if imported |
| TS friendly | ✓ Incremental type inference |
| Explicit deps | ✓ User imports what they use |
| Composable | ✓ Chain multiple extensions |

### Rejected Alternatives

| Approach | Why Rejected |
|----------|--------------|
| Options object `{ api: true }` | Forces bundling, type complexity |
| `.withApi()` method | Forces bundling (method must exist) |
| `compose()` | Hard to type with variadic generics |
| `createMachine.with(...ext)` | Medium TS support, extra complexity |
| Presets | Adds indirection without benefit |

### What This Replaces

| Old | New |
|-----|-----|
| `matchina(states, transitions, init)` | `createMachine(...).extend(withEventApi)` |
| `createMachine(states, transitions, init)` | Same (unchanged) |

**`matchina()` function is deprecated/removed.**

---

## Type Efficiency

### TypeSlayer

User mentioned seeing something about TypeScript type performance — **TypeSlayer**.

**What it is**: Tool for diagnosing and fixing TypeScript type performance problems.
- GitHub: https://github.com/dimitropoulos/typeslayer
- Provides interactive visualizations (treemaps, force graphs)
- Runs TypeScript tooling to produce traces and CPU profiles

### Action Items

- [ ] Run TypeSlayer on matchina to identify type bottlenecks
- [ ] Review type definitions for efficiency (per type review findings)
- [ ] Consider simplifying complex mapped types

### Type Review Findings to Address

From `04-types.md`:
- Complex template literal types in flattening
- Recursive types for HSM
- `any` in type definitions (per Decision 3: should be fixed)

---

## HSM: Both Approaches

### Revised Direction

User: "With HSM it is going to be both. Flattening is most useful, could be separate from propagate so both deps don't get pulled in."

### Updated Thinking

User: "I would probably separate hsm flatten from propagate but maybe it's enough to just import one? Maybe we don't need like separate bundles. This is for consumption by an app bundler so size check of specific exports is what matters."

**Conclusion**: `matchina/hsm` still makes sense. Tree-shaking handles the rest — if you only import flattening, propagation doesn't get bundled.

```
matchina/hsm → Both approaches, tree-shake what you don't use
```

No need for separate subpaths like `/hsm/flatten` and `/hsm/propagate`.

---

## Visualizers

### User Assessment

| Visualizer | Assessment |
|------------|------------|
| Force Graph | "First, lovely and animated but a little unwieldy" |
| React Flow | "Really nice but probably needs attention, dunno if HSM" |
| Sketch Inspector | "Great in original, our adaptation not bad, best general purpose" |
| Mermaid | "Has to be hacked for interactivity but often nicest diagrams" |

### Priorities

1. **Mermaid**: Often produces nicest diagrams for hierarchical/interactive
2. **Sketch Inspector**: Best general purpose
3. **React Flow**: Would like to get to Mermaid level
4. **Force Graph**: Keep but lower priority

### Future

- Time travel visualization (log states, replay)
- Better React Flow HSM support

### What Visualizers Need

User feedback on what to give a viz:

| Input | Description |
|-------|-------------|
| **Manifest** | States, transitions, init, final — "what the machine is" |
| **State** | Current state |
| **Dispatch** | Send function (controller) |

**Key insight**: "The thing we call a definition is more like a description/manifest of the machine. It does not say how to create one so much as what it is."

### Actions with Parameters

Unsolved problem: some actions take parameters.

Options:
1. Use schema to describe parameters
2. Don't show actions that take parameters
3. Detect actions that take parameters (requires introspection)

### Visualizer Interface

- Should NOT need full machines
- Should NOT mandate React (though current viz is React-based)
- Maybe part of inspection: `InspectorProps` or similar
- "Definition" might be too much — more like **instrumentation** or **manifest**

### Naming

| Term | Meaning |
|------|---------|
| Definition | How to create a machine (states factory, transitions) |
| Manifest | What a machine is (for viz/inspection) |
| Instrumentation | Runtime hooks for viz |

**Direction**: Separate "manifest" (static description for viz) from "definition" (creation config).

### Packaging

User: "Right now all visualizers are in docs package. Probably does make sense to externalize them."

Options:
- `matchina/viz` — All visualizers
- `@matchina/viz-mermaid`, `@matchina/viz-sketch`, etc. — Separate packages
- Keep in docs but make importable

---

## Visualizer Definition Format

### The Question

What format should machines expose for visualizers?

### User Thinking

- "We should research a bit to see if there's an existing ideal"
- "Maybe it's XState. But our machines are all matchina."
- "I only picked XState because matchina does not HAVE a declarative format"
- "XState compat could be useful for adoption"

### Proposed Approach

1. **Common interface**: Visualizers use a standard hook/interface
2. **Adapters**: `fromMatchina(machine)`, `fromXState(machine)`
3. **Primary**: Matchina format, XState as compat test

### Research Needed

- What does XState's definition format look like exactly?
- Are there other standard FSM definition formats?
- What's minimal for visualization?

---

## Inspection Packaging

### Current State

- `src/nesting/inspect.ts` — Core inspection utilities
- `docs/.../matchina-machine-to-xstate-definition.ts` — XState format adapter

### User Feedback

"Not sure where to put inspection. Ok with externalizing inspectable things I guess."

### Options

| Option | Pros | Cons |
|--------|------|------|
| In core | Always available | Increases bundle |
| `matchina/inspect` | Opt-in | Extra import |
| With visualizers | Logical grouping | Ties to viz |

---

## Updated Packaging Strategy

Based on conversation:

```
matchina                    → Core FSM, matchbox, lifecycle, extras
matchina/react              → useMachine, useMachineMaybe
matchina/hsm                → Flattening (primary HSM)
matchina/hsm-propagate      → Propagation (escape hatch)
matchina/inspect            → Definition extraction, inspection utils
matchina/zod                → Zod integration
matchina/valibot            → Valibot integration

# Separate packages (maybe)
@matchina/viz-mermaid       → Mermaid visualizer
@matchina/viz-sketch        → Sketch inspector
@matchina/viz-reactflow     → React Flow visualizer
```

---

## XState v5 Definition Format (Research)

XState v5 uses a declarative config format:

```typescript
const machine = createMachine({
  initial: 'green',
  states: {
    green: {
      on: { TIMER: 'yellow' }
    },
    yellow: {
      on: { TIMER: 'red' }
    },
    red: {
      initial: 'walk',  // Nested initial
      states: {
        walk: { on: { PED_TIMER: 'run' } },
        run: { on: { PED_TIMER: 'stop' } },
        stop: { on: { TIMER: '#green' } }  // ID target
      }
    }
  }
});
```

### Key XState Concepts

| Concept | XState Format |
|---------|---------------|
| States | `states: { [key]: { ... } }` |
| Transitions | `on: { [event]: target }` |
| Nested states | `states` within a state |
| Initial | `initial: 'stateName'` |
| Final | `type: 'final'` |
| ID targets | `#id` syntax |
| Child targets | `.child` syntax |

### Matchina vs XState

| Aspect | Matchina | XState |
|--------|----------|--------|
| State definition | `defineStates({ ... })` | Inline in config |
| Transitions | Separate object | `on` in each state |
| State data | Factory functions | Context + assign |
| Hierarchy | Flattening or propagation | Native nesting |

### Visualizer Format Proposal

For visualizers, we need a **read-only definition** format. Could be:

```typescript
interface MachineDefinition {
  id?: string;
  initial: string;
  states: {
    [key: string]: {
      on?: { [event: string]: string | { target: string } };
      initial?: string;
      states?: MachineDefinition['states'];
      final?: boolean;
    };
  };
}
```

This is essentially XState-compatible, which means:
- Existing XState visualizers could work
- Migration path for XState users
- Standard format for tooling

### Adapter Approach

```typescript
// Matchina machine → Definition
const def = toDefinition(machine);

// XState machine → Definition (for compat testing)
const def = fromXState(xstateMachine);

// Visualizers consume Definition
<MermaidViz definition={def} currentState={state} />
```

---

## Resolved Questions

- ~~Machine creation API~~: `.extend()` pattern, tree-shakeable
- ~~HSM packaging~~: Single `matchina/hsm`, tree-shaking handles the rest
- ~~Definition format~~: Use "manifest" for viz, separate from "definition"
- ~~Visualizers~~: Incubate in docs, externalize later

## Open Questions (Future Sessions)

1. **Manifest format**: What's the minimal interface for viz?
2. **Actions with params**: Allow in viz, clicks no-op if params missing
3. **Nested machine manifest**: How do flattened/propagated machines expose hierarchy?

---

## Work Organization

See `98-work-organization.md` for full pre-merge vs post-merge breakdown.

