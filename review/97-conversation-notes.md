# Matchina: Conversation Notes (Ongoing)

This document captures ongoing discussion points and decisions as they emerge.

---

## API Naming

### Problem: `machine` as function name

User feedback: "I don't like a function called `machine` because I tend to call the variable instance `machine`."

**Verbs are good.** Current options:

| Current | Issue | Alternative |
|---------|-------|-------------|
| `machine()` | Conflicts with variable naming | `createMachine()` (keep current) |
| `matchina()` | Already a verb-ish name | Keep as convenience wrapper |

**Direction**: Keep `createMachine()` as the core, `matchina()` as the convenience wrapper with event API.

---

## Convenience APIs (Event Methods)

### The Tension

```typescript
// Without convenience API
machine.send("next");
machine.send("submit", data);

// With convenience API (matchina)
machine.next();
machine.submit(data);
```

### User Concerns

- Convenience API adds type complexity
- `withApi` attaches dependency to machine namespace
- "I'm probably being too precious"
- "I personally like convenience APIs most of the time"

### Options

1. **Keep both**: `createMachine()` (bare) + `matchina()` (with API)
2. **Export `withEventApi`**: Let users opt-in to convenience
3. **Always include**: Just make it part of the machine

### Current Thinking

- Strong `send()` API is always there
- Convenience API is optional via `matchina()` or `withEventApi()`
- Export the ability to add API, don't force it

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

**New packaging idea**:
```
matchina/hsm/flatten   → Flattening approach
matchina/hsm/propagate → Propagation approach
```

Or:
```
matchina/hsm           → Flattening (primary)
matchina/hsm-propagate → Propagation (escape hatch)
```

This allows:
- Users to choose approach
- Tree-shaking to work properly
- Both to coexist without forcing one

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

## Open Questions

1. **Convenience API**: Export `withEventApi()` separately or keep bundled in `matchina()`?

2. **HSM packaging**: Single `/hsm` with both, or separate `/hsm` and `/hsm-propagate`?

3. **Visualizer packages**: Subpaths or separate npm packages?

4. **Definition format**: Use XState-compatible format for visualizers?

5. **TypeSlayer**: When to run analysis?

---

## Next Steps

1. ~~Research XState definition format~~ ✓
2. Run TypeSlayer on current types
3. Design `toDefinition()` function for Matchina
4. Decide on HSM packaging split
5. Prototype visualizer common interface

