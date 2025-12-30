# Handoff: Parallel Work on ReactFlow and ForceGraph Adapters

## Overview

Two parallel work streams are starting simultaneously:
1. **ReactFlow Adapter** (matchina-o3r8) - Phase A+B
2. **ForceGraph Adapter** (matchina-twm9) - Phase A+B

Both follow identical architecture pattern. This handoff document provides everything needed to execute independently.

---

## Context (Read These First)

### Architecture Evolution (15 min)
📄 `review/VISUALIZER_ARCHITECTURE_EVOLUTION.md`
- Why adapter pattern works
- How shape system became universal interface
- Success proof from Sketch and Mermaid visualizers

### Tech Designs (25 min)
📄 `review/REACTFLOW_TECH_DESIGN.md` - Stage 1-2 (Converter + Wrapper)
📄 `review/FORCEGRAPH_TECH_DESIGN.md` - Stage 1-2 (Converter + Wrapper)

### Sanity Check (10 min)
📄 `review/DESIGN_REVIEW_AND_SANITY_CHECK.md`
- Validation that designs are sound
- Data flow verification
- Risk assessment
- Pre-work requirements

---

## The Adapter Pattern (Universal for Both)

### Three-Layer Architecture

```
┌─ Layer 1: Shape System (Already built)
│  machine.shape.getState() → MachineShape
│  
├─ Layer 2: Converter (This work)
│  buildReactFlowGraph(shape) → { nodes, edges }
│  buildForceGraphData(shape) → { nodes, links }
│  
└─ Layer 3: Visualizer (Later work - Phase C+)
   <ReactFlowInspector nodes={nodes} edges={edges} />
   <ForceGraphInspector data={{ nodes, links }} />
```

### Key Insight: Same Pattern, Different Format

Both converters:
1. Take `MachineShape` as input
2. Extract nodes from `shape.states`
3. Extract connections from `shape.transitions`
4. Return visualizer-specific format
5. Validate state references

The ONLY difference: output format.

---

## Shared Shape System Contract

All machines have `.shape` property providing:

```typescript
interface MachineShape {
  states: Map<string, StateNode>          // All states (already flattened)
  transitions: Map<string, Map<string, string>>  // from → event → to
  hierarchy: Map<string, string | undefined>    // child → parent
  initialKey: string
}
```

### Important Notes

**State Keys Are Already Full Paths**:
- Flat machine (toggle): keys are "On", "Off"
- Hierarchical machine (checkout): keys are "Payment.Authorized", "Payment.Pending"
- **No extraction needed** - shape already has everything flattened

**No Machine Introspection Needed**:
- Don't look for `machine.states`
- Don't look for `machine.transitions`
- Don't try to walk nested structure
- **Only use**: `machine.shape.getState()`

---

## Work Item 1: ReactFlow Phase A+B (Ticket: matchina-o3r8)

### Phase A: Create Converter Function

**File**: `src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts`

**Signature**:
```typescript
export interface ReactFlowGraphData {
  nodes: Node[];
  edges: Edge[];
  nodeIds: string[];
}

export function buildReactFlowGraph(
  shape: MachineShape
): ReactFlowGraphData {
  // Implementation
}
```

**What It Does**:
1. Iterate `shape.states.entries()` → create Node[] 
   - Each node: `{ id: fullKey, data: { label, ... }, position: { x: 0, y: 0 } }`
   - `fullKey` is the state's full path (already in shape)
   - Position is placeholder (ELK layout applies it later)

2. Iterate `shape.transitions.entries()` → create Edge[]
   - For each fromState, iterate its event map
   - For each event, create edge
   - Edge: `{ source: fromState, target: toState, label: eventName }`

3. Validate all targets exist in `shape.states`

4. Return `{ nodes, edges, nodeIds }`

**Example Output** (toggle machine):
```typescript
{
  nodes: [
    { id: "On", data: { label: "On" }, position: { x: 0, y: 0 } },
    { id: "Off", data: { label: "Off" }, position: { x: 0, y: 0 } }
  ],
  edges: [
    { source: "On", target: "Off", label: "toggle", id: "On-Off-toggle" },
    { source: "Off", target: "On", label: "toggle", id: "Off-On-toggle" }
  ],
  nodeIds: ["On", "Off"]
}
```

**Unit Tests**:
```typescript
describe('buildReactFlowGraph', () => {
  it('converts toggle shape to correct nodes and edges', () => {
    const shape = getToggleShape();
    const result = buildReactFlowGraph(shape);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].id).toBe("On");
    expect(result.edges).toHaveLength(2);
  });

  it('converts checkout (HSM) shape with hierarchical keys', () => {
    const shape = getCheckoutShape();
    const result = buildReactFlowGraph(shape);
    
    expect(result.nodes.some(n => n.id === "Payment.Authorized")).toBe(true);
  });

  it('validates all edge targets exist', () => {
    // Should not throw for valid shape
  });
});
```

### Phase B: Create Adapter Wrapper

**File**: `src/viz/ReactFlowInspector/HSMReactFlowInspector.tsx`

**Signature**:
```typescript
interface HSMReactFlowInspectorProps {
  machine: any;           // Machine with .shape attached
  dispatch?: (event: { type: string }) => void;
  interactive?: boolean;
  layoutOptions?: LayoutOptions;
}

export const HSMReactFlowInspector: React.FC<HSMReactFlowInspectorProps> = ({
  machine,
  dispatch = () => {},
  interactive = true,
  layoutOptions
}) => {
  // Implementation
};
```

**What It Does**:
1. Use `useMemo` to extract shape: `machine.shape?.getState()`
2. Use `useMemo` to convert: `buildReactFlowGraph(shape)`
3. Use `useMachine(machine)` to subscribe and get current state
4. Create dispatch callback that calls `machine.send(eventName)`
5. Return `<ReactFlowInspector nodes={...} edges={...} ... />`

**Key Pattern**:
```typescript
const HSMReactFlowInspector = ({ machine, ... }) => {
  // Step 1: Extract shape
  const shape = useMemo(
    () => machine.shape?.getState(),
    [machine]
  );

  // Step 2: Convert to ReactFlow format
  const graphData = useMemo(
    () => shape ? buildReactFlowGraph(shape) : null,
    [shape]
  );

  // Step 3: Subscribe to state changes
  const currentChange = useMachine(machine);

  // Step 4: Create dispatch (if needed)
  const handleDispatch = useCallback(
    (event: { type: string }) => machine.send(event.type),
    [machine]
  );

  // Step 5: Pass to base component
  return (
    <ReactFlowInspector
      nodes={graphData?.nodes || []}
      edges={graphData?.edges || []}
      currentState={currentChange?.key}
      dispatch={handleDispatch}
      interactive={interactive}
      layoutOptions={layoutOptions}
    />
  );
};
```

### Success Criteria

- [ ] `shapeToReactFlow.ts` file created with `buildReactFlowGraph` function
- [ ] Function handles toggle example: 2 nodes, 2 edges
- [ ] Function handles checkout example: 7+ nodes, 10+ edges
- [ ] Unit tests pass for both examples
- [ ] All transition targets validated
- [ ] `HSMReactFlowInspector.tsx` created
- [ ] Wrapper compiles without errors
- [ ] Example loads (toggle) without crashing
- [ ] Data flows to ReactFlowInspector correctly
- [ ] No red console errors

---

## Work Item 2: ForceGraph Phase A+B (Ticket: matchina-twm9)

### Phase A: Create Converter Function

**File**: `src/viz/ForceGraphInspector/utils/shapeToForceGraph.ts`

**Signature**:
```typescript
export interface ForceGraphNode {
  id: string;
  name: string;
  val?: number;
  color?: string;
  fullKey: string;      // For state matching
  isInitial?: boolean;
}

export interface ForceGraphLink {
  source: string;       // ⭐ STRING ID, not object
  target: string;       // ⭐ STRING ID, not object
  event: string;        // Event name
  value?: number;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  nodeIds: Set<string>;
}

export function buildForceGraphData(
  shape: MachineShape
): ForceGraphData {
  // Implementation
}
```

**Critical**: This fixes the original bug where links had node objects instead of string IDs.

**What It Does**:
1. Iterate `shape.states.entries()` → create ForceGraphNode[]
   - `id`: full state key
   - `name`: leaf state name (for display)
   - `fullKey`: for later state matching
   - `isInitial`: true if `key === shape.initialKey`
   - `val`: 15 if initial, 10 otherwise (size)
   - `color`: different color for initial state

2. Iterate `shape.transitions` → create ForceGraphLink[]
   - `source`: string ID of from-state
   - `target`: string ID of to-state (must exist in nodes)
   - `event`: event name
   - `value`: 1 (link strength)

3. Validate all transitions:
   - All sources exist in states
   - All targets exist in states
   - Skip invalid transitions (with warning)

4. Return `{ nodes, links, nodeIds }`

**Example Output** (toggle):
```typescript
{
  nodes: [
    { id: "On", name: "On", val: 10, color: "#8b5cf6", fullKey: "On", isInitial: true },
    { id: "Off", name: "Off", val: 10, color: "#8b5cf6", fullKey: "Off", isInitial: false }
  ],
  links: [
    { source: "On", target: "Off", event: "toggle", value: 1 },
    { source: "Off", target: "On", event: "toggle", value: 1 }
  ],
  nodeIds: new Set(["On", "Off"])
}
```

**Unit Tests**:
```typescript
describe('buildForceGraphData', () => {
  it('converts toggle shape to nodes and links', () => {
    const shape = getToggleShape();
    const result = buildForceGraphData(shape);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(2);
  });

  it('uses string IDs for links, not objects', () => {
    const result = buildForceGraphData(shape);
    
    result.links.forEach(link => {
      expect(typeof link.source).toBe('string');
      expect(typeof link.target).toBe('string');
    });
  });

  it('validates all targets exist in nodes', () => {
    const result = buildForceGraphData(shape);
    
    result.links.forEach(link => {
      expect(result.nodeIds.has(link.target)).toBe(true);
    });
  });

  it('handles hierarchical machines with full paths', () => {
    const shape = getCheckoutShape();
    const result = buildForceGraphData(shape);
    
    expect(result.nodes.some(n => n.id.includes('.'))).toBe(true);
  });
});
```

### Phase B: Create Adapter Wrapper

**File**: `src/viz/ForceGraphInspector/HSMForceGraphInspector.tsx`

**Signature**:
```typescript
import type { InspectorTheme } from '../theme';
import { defaultTheme } from '../theme';

interface HSMForceGraphInspectorProps {
  machine: any;
  theme?: InspectorTheme;
  interactive?: boolean;
}

export const HSMForceGraphInspector: React.FC<HSMForceGraphInspectorProps> = ({
  machine,
  theme = defaultTheme,
  interactive = true
}) => {
  // Implementation
};
```

**What It Does**:
1. Use `useMemo` to extract shape: `machine.shape?.getState()`
2. Use `useMemo` to convert: `buildForceGraphData(shape)`
3. Use `useMachine(machine)` to subscribe and get current state
4. Create dispatch callback for event triggering
5. Return `<ForceGraphInspector data={...} currentState={...} />`

**Key Pattern** (identical to ReactFlow):
```typescript
const HSMForceGraphInspector = ({ machine, theme, interactive }) => {
  // Step 1: Extract shape
  const shape = useMemo(
    () => machine.shape?.getState(),
    [machine]
  );

  // Step 2: Convert to ForceGraph format
  const graphData = useMemo(
    () => shape ? buildForceGraphData(shape) : null,
    [shape]
  );

  // Step 3: Subscribe to state changes
  const currentState = useMachine(machine);

  // Step 4: Create dispatch
  const dispatch = useCallback(
    (event: string) => machine.send(event),
    [machine]
  );

  // Step 5: Pass to base component
  return (
    <ForceGraphInspector
      data={graphData}
      currentState={currentState?.key}
      dispatch={dispatch}
      interactive={interactive}
      theme={theme}
    />
  );
};
```

### Success Criteria

- [ ] `shapeToForceGraph.ts` file created with `buildForceGraphData` function
- [ ] Links use STRING IDs for source/target (critical fix)
- [ ] Function handles toggle: 2 nodes, 2 links
- [ ] Function handles checkout (HSM): 7+ nodes, 10+ links
- [ ] All transitions validate (targets must exist)
- [ ] Unit tests pass
- [ ] `HSMForceGraphInspector.tsx` created
- [ ] Wrapper compiles without errors
- [ ] Example loads without crashing
- [ ] Data flows to ForceGraphInspector correctly
- [ ] No red console errors about undefined nodes

---

## Testing Examples

Both should test with:

1. **Simple Example** (toggle)
   - `docs/src/code/examples/toggle/`
   - Flat machine: 2 states (On, Off)
   - Expected: 2 nodes, 2 edges/links

2. **Complex Flat** (rock-paper-scissors)
   - `docs/src/code/examples/rock-paper-scissors/`
   - Flat with many events
   - Expected: 3 nodes, 6+ edges/links

3. **Hierarchical** (checkout)
   - `docs/src/code/examples/checkout/`
   - HSM with nested states
   - Expected: 7+ nodes with full paths like "Payment.Authorized"

---

## Key Differences from Current Code

### What's Wrong Now
```typescript
// WRONG: Trying to extract from machine directly
const transitions = machine.transitions; // ❌ Not the right format
const links = machine.states.map(s => ({ ...s })); // ❌ Wrong structure
```

### What's Right Now
```typescript
// RIGHT: Extract from shape, convert to visualizer format
const shape = machine.shape.getState();
const links = buildForceGraphData(shape).links; // ✅ Correct format
// Links have: { source: "On", target: "Off" } // ✅ String IDs
```

---

## Files to Create

### ReactFlow (matchina-o3r8)
```
src/viz/ReactFlowInspector/
├── utils/
│   └── shapeToReactFlow.ts          [NEW]
└── HSMReactFlowInspector.tsx        [NEW]
```

### ForceGraph (matchina-twm9)
```
src/viz/ForceGraphInspector/
├── utils/
│   └── shapeToForceGraph.ts         [NEW]
└── HSMForceGraphInspector.tsx       [NEW]
```

### Tests
```
test/
├── shapeToReactFlow.test.ts         [NEW]
└── shapeToForceGraph.test.ts        [NEW]
```

---

## Key Import Paths

```typescript
// Shape types (already exist, use these)
import type { MachineShape, StateNode } from "src/hsm/shape-types";

// ReactFlow types
import type { Node, Edge } from "reactflow";

// Hooks
import { useMachine } from "matchina/react";

// Mermaid reference (to understand the pattern)
// src/viz/HSMMermaidInspector.tsx
// src/viz/MermaidInspector.tsx
```

---

## Parallel Work Coordination

### Independence
- ReactFlow converter is **100% independent** of ForceGraph
- ForceGraph converter is **100% independent** of ReactFlow
- **Both can be worked on simultaneously**
- No merge conflicts expected

### Shared Understanding
- Both use same MachineShape contract
- Both follow same adapter pattern
- Both need unit tests

### Sequencing (After This Phase)
- ReactFlow Phase C-E: Refactor + Debug (requires knowing what Phase A-B produces)
- ForceGraph Phase C-E: Later (can use ReactFlow learnings)

---

## Success Definition

### When Phase A+B is Complete

Both tickets can be closed when:

✅ **ReactFlow (matchina-o3r8)**
- Converter function written and unit tested
- Adapter wrapper created and integrated
- Examples load without crashing
- Data flows to base component
- No breaking errors

✅ **ForceGraph (matchina-twm9)**
- Converter function written and unit tested (STRING IDs fixed)
- Adapter wrapper created and integrated
- Examples load without crashing
- Data flows to base component
- No breaking errors

### Then Phase C+

Primary agent continues with:
- ReactFlow Phase C-E (refactor + debugging)
- ForceGraph Phase C-E (apply learnings from ReactFlow)

---

## Questions & Support

If blocked:
1. Check `REACTFLOW_TECH_DESIGN.md` or `FORCEGRAPH_TECH_DESIGN.md` for details
2. Check `review/VISUALIZER_ARCHITECTURE_EVOLUTION.md` for context
3. Check `review/DESIGN_REVIEW_AND_SANITY_CHECK.md` for validation

Reference implementation: `src/viz/HSMMermaidInspector.tsx` (same pattern works)

Good luck! 🚀
