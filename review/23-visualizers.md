# Matchina: Visualization & Inspection Review

This document reviews the current state of visualization and inspection capabilities, which are important for debugging, understanding, and demonstrating state machines.

---

## Current Visualization Infrastructure

### Inspector Components (docs/src/components/inspectors/)

| Component | Type | Description | Status |
|-----------|------|-------------|--------|
| `MermaidInspector` | Diagram | Mermaid stateDiagram-v2 or flowchart | Working |
| `HSMMermaidInspector` | Diagram | Mermaid for hierarchical machines | Working |
| `SketchInspector` | Tree | Nested tree view (sketch.systems style) | Working |
| `ForceGraphInspector` | Graph | D3 force-directed graph | Working |
| `ReactFlowInspector` | Graph | React Flow node-based | Partial |
| `BasicInspector` | Text | Simple text-based inspector | Working |

### Wrapper Components

| Component | Purpose |
|-----------|---------|
| `MachineExampleWithChart` | Standard example wrapper with visualizer picker |
| `HSMVisualizerDemo` | HSM-specific demo with visualizer switching |
| `DemoWithMermaid` | Simple Mermaid-only wrapper |

### Core Inspection Utilities

**Library (`src/nesting/inspect.ts`)**:
```typescript
getFullKey(machine)     // "Parent.Child.GrandChild"
getDepth(machine, state) // 0, 1, 2...
getStack(machine)       // [parentState, childState, ...]
getActiveChain(machine) // [{machine, state}, ...]
inspect(machine)        // { fullKey, depth, stack, state, machine, chain }
```

**Docs-only (`docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts`)**:
```typescript
getXStateDefinition(machine) // XState-compatible config for visualizers
```

---

## How Definition Access Works

### Current Flow

```
Machine Instance
    ↓
getXStateDefinition(machine)  ← Walks machine.states + machine.transitions
    ↓
XState-like Config { initial, states: { [key]: { on: {...} } } }
    ↓
Visualizer (Mermaid, Sketch, etc.)
```

### Definition Sources

1. **From machine instance**: `machine.states`, `machine.transitions`
2. **From submachine factory**: `stateFactory.machineFactory.def`
3. **From nested state data**: `state.data.machine` (runtime only)

### Problems

1. **Runtime-only for propagation**: Nested machines only visible when state is active
2. **Requires `.def` attachment**: `createPayment.def = paymentDef` is manual
3. **No standard definition format**: Each visualizer adapts XState format differently
4. **Flattening not visualized**: Dot-keys not parsed back to hierarchy

---

## Visualizer Comparison

### Mermaid (stateDiagram-v2)

**Pros**:
- Standard format, widely understood
- Supports nested states (subgraphs)
- Interactive (clickable transitions)
- Good for documentation

**Cons**:
- Limited layout control
- Complex diagrams can be cluttered
- Rendering can be slow for large machines

**HSM Support**: Yes, via recursive `walk()` function

### Sketch Inspector (Tree View)

**Pros**:
- Clear hierarchy visualization
- Shows all states at once
- Interactive transitions
- Good for debugging

**Cons**:
- Not a standard format
- Custom CSS required
- Less compact than diagrams

**HSM Support**: Yes, via recursive `StateItem` component

### Force Graph (D3)

**Pros**:
- Dynamic layout
- Good for complex graphs
- Interactive

**Cons**:
- Can be chaotic for hierarchical machines
- Animation can be distracting
- Not ideal for HSM

**HSM Support**: Limited

### React Flow

**Pros**:
- Highly interactive
- Draggable nodes
- Modern look

**Cons**:
- Heavy dependency
- Complex setup
- Partial implementation

**HSM Support**: Partial

---

## HSM Visualization Challenges

### Problem 1: Static vs Runtime Structure

**Flattening**: Structure known at definition time → Easy to visualize
**Propagation**: Structure only known at runtime → Must traverse active chain

### Problem 2: Definition Access

Current workaround:
```typescript
// Attach .def manually for visualization
createPayment.def = paymentDef;
```

This is error-prone and not enforced.

### Problem 3: Nested Machine Discovery

`getXStateDefinition` tries two approaches:
1. Check `stateFactory.machineFactory.def` (from `submachine` helper)
2. Check `state.data.machine` (runtime fallback)

Neither is reliable for all cases.

---

## What Visualizers Need

### Minimum Requirements

1. **State list**: All possible states (including nested)
2. **Transition map**: From → Event → To
3. **Initial state**: Starting point
4. **Current state**: For highlighting

### For HSM

5. **Hierarchy structure**: Parent-child relationships
6. **Active path**: Which states are currently active
7. **Nested transitions**: Child machine transitions

### Ideal Definition Format

```typescript
interface MachineDefinition {
  id?: string;
  initial: string;
  states: {
    [key: string]: {
      on?: { [event: string]: string };
      initial?: string;  // For nested
      states?: MachineDefinition['states'];  // Nested states
      final?: boolean;
    };
  };
}
```

This is essentially XState's format, which is why `getXStateDefinition` exists.

---

## Flattening Advantage for Visualization

If we choose flattening (per Decision 1 direction), visualization becomes simpler:

```typescript
// Flattened keys
const states = ["Working", "Working.Red", "Working.Green", "Broken"];

// Parse to hierarchy for visualization
function parseHierarchy(keys: string[]) {
  const tree = {};
  for (const key of keys) {
    const parts = key.split('.');
    let node = tree;
    for (const part of parts) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }
  return tree;
}

// Result:
// { Working: { Red: {}, Green: {}, Yellow: {} }, Broken: {} }
```

No runtime traversal needed. Structure is static and inspectable.

---

## Recommendations

### 1. Standardize Definition Format

Create a canonical `MachineDefinition` type that:
- Is attached to every machine instance
- Includes hierarchy information
- Is static (not runtime-dependent)

### 2. Attach Definition Automatically

```typescript
const machine = createMachine(states, transitions, "Off");
// machine.definition is automatically populated
```

Not:
```typescript
createPayment.def = paymentDef;  // Manual, error-prone
```

### 3. Prefer Flattening for Visualization

Flattened dot-keys can be:
- Parsed into hierarchy for tree views
- Used directly for flat diagrams
- Inspected without runtime traversal

### 4. Consolidate Visualizers

Current state: 6 different inspectors with overlapping functionality

Recommended:
- **Primary**: Sketch Inspector (tree view) — best for HSM
- **Secondary**: Mermaid — best for documentation
- **Deprecate**: Force Graph, React Flow (unless specific need)

### 5. Move Inspection to Core

Currently `getXStateDefinition` is in docs only. Consider:
- Moving core inspection utilities to `matchina/inspect`
- Standardizing definition format
- Making visualizers consume standard format

---

## Current Pain Points

| Issue | Impact | Fix |
|-------|--------|-----|
| Manual `.def` attachment | Easy to forget, breaks viz | Auto-attach on creation |
| Runtime-only nested discovery | Can't visualize inactive branches | Use static definitions |
| Multiple visualizer formats | Maintenance burden | Standardize on one format |
| No definition in core | Visualizers are docs-only | Move to library |
| Propagation requires traversal | Complex, fragile | Prefer flattening |

---

## Integration with HSM Decision

**If Flattening is chosen**:
- Visualization is straightforward
- Parse dot-keys to hierarchy
- Static structure, no runtime traversal
- Definition attached at creation time

**If Propagation is kept**:
- Need runtime traversal for full structure
- Must handle inactive branches specially
- More complex visualizer logic
- Definition may be incomplete

This reinforces the case for flattening as the primary HSM approach.

---

## Open Questions

1. **Should definition be in core or separate subpath?**
   - Core: Always available, increases bundle
   - Subpath: Opt-in, but may be forgotten

2. **What's the canonical definition format?**
   - XState-compatible?
   - Custom Matchina format?
   - Both (with adapter)?

3. **Should visualizers be part of the library?**
   - Currently docs-only
   - Could be `matchina/viz` or separate package

4. **How to handle runtime-only state data?**
   - Definition is static, but state data is dynamic
   - Visualizers need both

---

## Next Steps

1. Design canonical `MachineDefinition` type
2. Implement auto-attachment on machine creation
3. Update visualizers to consume standard format
4. Decide: keep visualizers in docs or move to library
5. Test with flattened HSM approach
