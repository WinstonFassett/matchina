# ForceGraph Visualizer: Technical Design Doc

## Executive Summary

ForceGraph is not rendering at all. Root cause: it doesn't properly consume Matchina's shape system. This design doc specifies adaptation using the same proven adapter pattern as ReactFlow.

**Recommendation**: Create `HSMForceGraphInspector` wrapper that converts shape to ForceGraph format, leaving base ForceGraph component focused on rendering only.

---

## Current State Analysis

### What's Broken
1. **Canvas Not Rendering**: No visualization appears even when stopwatch example is loaded
2. **Data Extraction**: Likely not properly extracting from shape
3. **Format Mismatch**: ForceGraph expects different data structure than shape provides
4. **State Tracking**: Doesn't track current state changes

### Known Issues from Tickets
- `matchina-51p`: ForceGraph not rendering on stopwatch examples
- `matchina-mks`: Link structure wrong - nodes stored as strings instead of objects

### Root Cause Analysis
ForceGraph attempts to consume machine directly but:
- Doesn't use `machine.shape.getState()`
- Has format mismatch (ForceGraph expects nodes/links differently)
- No proper state subscription (useMachine)
- Edge extraction incorrect (strings instead of node references)

---

## Design Goals

1. **Render Canvas**: Get ForceGraph canvas to display with actual data
2. **Use Shape System**: Properly consume `machine.shape.getState()`
3. **HSM Support**: Work with both flat and hierarchical machines
4. **Correct Format**: Provide nodes/links in format ForceGraph expects
5. **State Tracking**: Highlight active state as it changes
6. **Interactive**: Trigger transitions on interactions

---

## Adapter Pattern Architecture

### Design

```
Machine (.shape attached)
    ↓
HSMForceGraphInspector (new wrapper)
    ├─ Extracts shape: machine.shape.getState()
    ├─ Converts to ForceGraph format via buildForceGraphData()
    └─ Passes nodes/links to ForceGraphInspector
         ↓
    ForceGraphInspector (refactored)
    ├─ No longer knows about shape
    ├─ Works with nodes/links directly
    ├─ Manages physics simulation
    ├─ Handles state highlighting
    └─ Handles interactions
```

### Why This Pattern

ForceGraph is fundamentally different from ReactFlow:
- ReactFlow: Graph layout algorithm (ELK)
- ForceGraph: Physics-based simulation

Both need same shape data, but format conversion is different.

Pattern handles this elegantly:
- Wrapper: Shape → Common format
- Base component: Format → Visualization

---

## ForceGraph Data Structures

### What ForceGraph Expects

```typescript
interface ForceGraphNode {
  id: string;              // Unique identifier
  name: string;            // Display label
  val?: number;            // Size/importance (optional)
  color?: string;          // Node color (optional)
  [key: string]: any;      // Custom properties
}

interface ForceGraphLink {
  source: string;          // Node ID (not node object!)
  target: string;          // Node ID (not node object!)
  value?: number;          // Link strength (optional)
  [key: string]: any;      // Custom properties
}

// Data passed to ForceGraph:
{
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}
```

### Current Bug
Code passes node objects instead of IDs for links:
```typescript
// WRONG (current)
links: [{
  source: nodeObject,  // ❌ Should be string ID
  target: nodeObject   // ❌ Should be string ID
}]

// CORRECT
links: [{
  source: "On",        // ✅ String ID
  target: "Off"        // ✅ String ID
}]
```

---

## Implementation Design

### Stage 1: Create Converter Function
**File**: `src/viz/ForceGraphInspector/utils/shapeToForceGraph.ts`

```typescript
export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  nodeIds: Set<string>;
}

export function buildForceGraphData(
  shape: MachineShape
): ForceGraphData {
  // Extract nodes from shape.states
  // Extract links from shape.transitions
  // Validate all transitions have valid targets
  // Return properly formatted data
}

function buildForceGraphNode(
  stateNode: StateNode,
  isInitial: boolean = false
): ForceGraphNode {
  return {
    id: stateNode.fullKey,
    name: stateNode.key,           // Display just leaf name
    val: isInitial ? 15 : 10,      // Initial slightly larger
    color: isInitial ? '#60a5fa' : '#8b5cf6',
    fullKey: stateNode.fullKey,    // For state matching later
    isInitial,
  };
}

function buildForceGraphLinks(
  shape: MachineShape
): ForceGraphLink[] {
  const links: ForceGraphLink[] = [];
  
  // Iterate transitions
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    for (const [eventName, toState] of eventMap.entries()) {
      // Validate toState exists in shape.states
      if (shape.states.has(toState)) {
        links.push({
          source: fromState,    // String ID
          target: toState,      // String ID
          event: eventName,     // Custom property for labels
          value: 1,            // Link strength
        });
      }
    }
  }
  
  return links;
}
```

**What it does**:
1. Iterates `shape.states` → ForceGraphNode[] (with IDs as strings)
2. Iterates `shape.transitions` → ForceGraphLink[] (source/target as string IDs)
3. Validates all transitions target existing states
4. Returns properly formatted data ready for ForceGraph

**Validation**:
- All nodes from states
- All links reference valid nodes
- No missing states
- No circular references (ForceGraph handles these)

### Stage 2: Create HSMForceGraphInspector Wrapper
**File**: `src/viz/ForceGraphInspector/HSMForceGraphInspector.tsx`

```typescript
const HSMForceGraphInspector = ({ 
  machine, 
  theme = defaultTheme,
  interactive = true 
}: {
  machine: any;
  theme?: InspectorTheme;
  interactive?: boolean;
}) => {
  // Get shape
  const shape = useMemo(
    () => machine.shape?.getState(),
    [machine]
  );

  // Convert to ForceGraph format
  const graphData = useMemo(
    () => shape ? buildForceGraphData(shape) : null,
    [shape]
  );

  // Track state changes for highlighting
  const currentState = useMachine(machine);

  // Dispatch events
  const dispatch = useCallback((event: string) => {
    machine.send(event);
  }, [machine]);

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

**What it does**:
1. Subscribes to machine via useMachine()
2. Gets shape from machine
3. Converts shape to ForceGraph format
4. Gets current state
5. Creates dispatch function
6. Passes everything to base ForceGraphInspector

### Stage 3: Refactor ForceGraphInspector
**File**: `src/viz/ForceGraphInspector/ForceGraphInspector.tsx`

**Current signature** (guessing based on code):
```typescript
interface ForceGraphInspectorProps {
  value: string;              // Current state
  definition: any;            // Machine (shape extraction happens here)
  lastEvent?: string;
  prevState?: string;
  dispatch: (event: { type: string }) => void;
  mode?: any;
  interactive?: boolean;
  theme?: InspectorTheme;
}
```

**New signature**:
```typescript
interface ForceGraphInspectorProps {
  // Shape already converted
  data: ForceGraphData | null;
  currentState: string;
  previousState?: string;
  
  // Interaction
  dispatch: (event: string) => void;
  interactive?: boolean;
  
  // Styling
  theme?: InspectorTheme;
}
```

**What changes**:
- No longer accepts machine
- No longer does shape extraction
- Works with pre-formatted data
- Focus on rendering and interaction

### Stage 4: Rewrite Rendering Logic
**File**: `src/viz/ForceGraphInspector/ForceGraphInspector.tsx` (main refactor)

**Current issues to fix**:
1. Link structure (nodes vs string IDs) - FIX: Use string IDs
2. Node highlighting (wrong state comparison) - FIX: Use currentState directly
3. Link labels/interaction - FIX: Use data.event field
4. Canvas not rendering - FIX: Ensure data is properly formatted

**New structure**:
```typescript
const ForceGraphInspector = ({ 
  data, 
  currentState, 
  ... 
}: ForceGraphInspectorProps) => {
  const graphRef = useRef();
  
  // Prepare graph data with state info
  const preparedData = useMemo(() => {
    if (!data) return null;
    
    return {
      nodes: data.nodes.map(node => ({
        ...node,
        isActive: node.fullKey === currentState,
        color: node.fullKey === currentState 
          ? '#60a5fa'  // Blue for active
          : node.isInitial 
            ? '#a78bfa' // Purple for initial
            : '#8b5cf6' // Default purple
      })),
      links: data.links
    };
  }, [data, currentState]);
  
  // Initialize ForceGraph library
  useEffect(() => {
    if (!graphRef.current || !preparedData) return;
    
    // Create/update ForceGraph instance
    // Set up node click handlers
    // Set up link interaction
    // Configure physics
  }, [preparedData, interactive]);
  
  return (
    <div ref={graphRef} style={{ width: '100%', height: '100%' }} />
  );
};
```

---

## Addressing Current Issues

### Issue 1: Canvas Not Rendering

**Current Problem**: No visualization appears

**Root Causes**:
1. Shape data not extracted properly
2. Format incompatible with ForceGraph library
3. Container div not properly sized
4. ForceGraph instance not initialized

**Solution**:
1. Converter validates data structure
2. Wrapper provides properly formatted data
3. Base component initializes with validated data
4. Container has explicit width/height

### Issue 2: Link Structure (Nodes vs IDs)

**Current Problem**: Links have node objects instead of string IDs

**Fix**:
```typescript
// BEFORE (wrong)
links: transitions.map(t => ({
  source: sourceNode,     // ❌ Object
  target: targetNode      // ❌ Object
}))

// AFTER (correct)
links: transitions.map(t => ({
  source: t.from,         // ✅ String ID
  target: t.to            // ✅ String ID
}))
```

Converter ensures this format is correct.

### Issue 3: State Highlighting

**Current Problem**: Doesn't highlight current state

**Solution**:
1. Accept `currentState` as prop
2. On render, compare against node IDs
3. Update node colors based on state
4. Use useMemo to avoid recalculating

### Issue 4: Interaction

**Current Problem**: Likely no transition triggering on click

**Solution**:
1. Accept `dispatch` function as prop
2. On node/link click, get event name
3. Call dispatch with event
4. Machine state updates
5. Wrapper detects change via useMachine()
6. Highlighting updates automatically

---

## Implementation Sequence

### Phase A: Build Converter (no breaking changes)
1. Create `shapeToForceGraph.ts` converter
2. Unit test converter with toggle and checkout
3. Validate nodes/links structure

### Phase B: Create Adapter Wrapper
1. Create `HSMForceGraphInspector.tsx`
2. Test with stopwatch example
3. Verify data flows correctly

### Phase C: Refactor Base Component
1. Change ForceGraphInspector signature
2. Update rendering to use data prop
3. Implement state highlighting
4. Fix link format

### Phase D: Fix Interaction
1. Implement node/link click handlers
2. Call dispatch with proper event
3. Test transition triggering

### Phase E: Polish and Test
1. Test all examples (toggle, RPS, checkout, stopwatch)
2. Verify highlighting works
3. Verify interactions work
4. Test both flat and HSM machines

---

## Success Criteria

### Phase A (Converter)
- [ ] Converter exports ForceGraphData
- [ ] Test: toggle example produces 2 nodes, 2 links
- [ ] Test: checkout example produces ~7 nodes, 10+ links
- [ ] All transitions have valid targets
- [ ] No string/object format confusion

### Phase B (Wrapper)
- [ ] HSMForceGraphInspector renders without errors
- [ ] Machine subscription works (useMachine)
- [ ] Data flows to base component
- [ ] State changes detected

### Phase C (Base Component)
- [ ] Canvas renders with nodes and links visible
- [ ] Nodes display labels (leaf names)
- [ ] Links display (but labels optional for ForceGraph)
- [ ] Current state highlighted

### Phase D (Interaction)
- [ ] Clicking node/link triggers event
- [ ] State updates correctly
- [ ] Highlighting updates on state change
- [ ] Force simulation runs smoothly

### Phase E (Full System)
- [ ] Toggle example works
- [ ] RPS example works
- [ ] Checkout example works
- [ ] Stopwatch example works
- [ ] Physics simulation good quality
- [ ] No missing/extra transitions

---

## ForceGraph Configuration

### Physics Parameters
```typescript
const forceParams = {
  numDimensions: 2,           // 2D or 3D
  nodeRelSize: 4,             // Node size
  nodeCanvasObjectMode: () => 'after',  // Render labels
  linkCanvasObject: drawLink, // Custom link rendering
  
  // Force simulation
  d3Force: {
    charge: d3Force.forceManyBody()
      .strength(-300),        // Repulsion
    link: d3Force.forceLink()
      .distance(100)
      .strength(0.5),         // Attraction
  },
  
  warmupTicks: 100,           // Initial layout time
  cooldownTime: 3000,         // How long to simulate
};
```

### Customization Options
```typescript
interface ForceGraphInspectorProps {
  // ... existing props
  
  // Physics (optional)
  nodeSize?: number;
  linkDistance?: number;
  chargeStrength?: number;
  
  // Visual (optional)
  nodeColor?: (node: ForceGraphNode) => string;
  linkColor?: (link: ForceGraphLink) => string;
  showLabels?: boolean;
  
  // Interaction (optional)
  onNodeClick?: (node: ForceGraphNode) => void;
  onLinkClick?: (link: ForceGraphLink) => void;
}
```

---

## Relationship to ReactFlow

### Similarities
- Both need adapter pattern
- Both use same shape system
- Both need state subscription (useMachine)
- Both need state highlighting
- Both need interaction support

### Differences
- ReactFlow: Graph layout algorithm (ELK)
- ForceGraph: Physics simulation (D3 force)
- ReactFlow: Nodes with explicit positions
- ForceGraph: Nodes with simulated positions
- ReactFlow: Complex edge routing
- ForceGraph: Simple straight links

### Shared Concepts
Both converters:
1. Take MachineShape as input
2. Extract nodes from shape.states
3. Extract links/edges from shape.transitions
4. Return format-specific structure
5. Validate state references

This makes both converters similar in structure, just different output format.

---

## Testing Strategy

### Unit Tests
```typescript
// test/shapeToForceGraph.test.ts
describe('buildForceGraphData', () => {
  it('converts toggle shape to 2 nodes 2 links', () => { ... });
  it('converts RPS shape with multiple events', () => { ... });
  it('validates all links reference existing nodes', () => { ... });
  it('uses string IDs not objects', () => { ... });
});
```

### Integration Tests
```typescript
// Manual testing
// Load stopwatch example → see canvas render
// Load toggle → see 2 nodes, state highlights
// Click node → see transition trigger
// Check highlighting changes on state change
```

---

## Risk Assessment

### Low Risk
- Converter implementation (isolated, testable)
- Creating HSMForceGraphInspector (new file)
- Unit testing

### Medium Risk
- Base component refactoring (must render correctly)
- State comparison logic
- Physics configuration

### High Risk
- ForceGraph library integration (external library)
- Interaction handling
- Physics parameter tuning

### Mitigation
- Keep old component during development
- Test each phase before moving on
- Use reference examples for physics params
- Have fallback if canvas won't render

---

## Phasing Relative to ReactFlow

### Recommended Order
1. **Complete ReactFlow** fully (all 5 phases)
2. **Then ForceGraph** (can reuse learnings)

### Why
- ReactFlow debugging will uncover shape system edge cases
- Fix patterns from ReactFlow apply to ForceGraph
- ForceGraph is simpler (no ELK layout complexity)
- Doing them in order reduces risk

### Parallel Work
While ReactFlow is in Phase C-D, can start:
- ForceGraph Phase A (converter)
- ForceGraph Phase B (wrapper)

Both converters are independent of rendering issues.

---

## Conclusion

ForceGraph can be successfully adapted using same pattern as ReactFlow:
1. ✅ Converter: Shape → ForceGraph format
2. ✅ Wrapper: Handles shape extraction and dispatch
3. ✅ Base component: Focused on rendering and physics
4. ✅ Clear separation of concerns
5. ✅ Testable and maintainable

**Recommendation**: 
- Proceed with ReactFlow first (full completion)
- Then apply same pattern to ForceGraph
- Both will be working and consistent

---

## Appendix: ForceGraph Library Notes

### Important Details
- Library expects nodes/links, not node objects
- Node IDs must be strings (not objects)
- Force simulation runs asynchronously
- Canvas requires explicit dimensions
- Label rendering customizable via nodeCanvasObjectMode

### Common Issues
- "Cannot read property 'id' of undefined" → links have wrong format
- Canvas stays black → container size issue
- No layout changes → force params not configured
- Clicking doesn't work → handlers not bound

All of these are prevented by proper converter and wrapper design.

### Example Setup
```typescript
import ForceGraph from '3d-force-graph';

const graph = new ForceGraph(containerRef.current)
  .graphData(data)              // { nodes, links }
  .nodeId('id')                 // Use id field
  .nodeLabel('name')            // Display name
  .nodeColor(node => nodeColor(node))
  .onNodeClick(handleNodeClick)
  .warmupTicks(100)
  .cooldownTime(3000);
```

Simple and clean when data format is correct.
