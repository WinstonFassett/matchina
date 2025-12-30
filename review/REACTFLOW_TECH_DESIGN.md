# ReactFlow Visualizer: Technical Design Doc

## Executive Summary

ReactFlow currently attempts to consume Matchina's shape system but has architectural inconsistencies. This design doc specifies how to properly adapt it following proven patterns from Sketch and Mermaid.

**Recommendation**: Hybrid adapter approach (similar to HSMMermaidInspector) that cleanly separates shape-understanding from rendering.

---

## Current State Analysis

### What Works
- Edge extraction from `shape.transitions` (mostly correct)
- Node creation from `shape.states` (correct structure)
- Event subscription via `useMachine()`
- ELK layout algorithm integration (code present)

### What's Broken
1. **ELK Layout Not Applied**: Nodes render at (0,0) despite layout algorithm
2. **Portal Rendering**: Settings dialog doesn't appear
3. **HSM State Highlighting**: Doesn't work correctly for hierarchical machines
4. **Interactive Edge Clicks**: Don't trigger transitions in HSM examples

### Root Causes
- **Architectural**: Mixing shape understanding with React hook logic
- **State Handling**: Assumptions about currentState format and comparison
- **Portal Quirks**: CSS/Z-index/positioning issues
- **Integration**: Hooks don't fully understand hierarchical structures

---

## Design Goals

1. **Unified Interface**: Use same shape system as Sketch/Mermaid
2. **Clean Separation**: Shape extraction separate from rendering logic
3. **HSM Support**: Full support for both flat and hierarchical machines
4. **Maintainability**: Clear code with minimal assumptions
5. **Type Safety**: Proper typing for shape structures

---

## Option A: Adapter Pattern (Recommended)

### Architecture

```
Machine (.shape attached)
    ↓
HSMReactFlowInspector (new wrapper)
    ├─ Extracts shape: machine.shape.getState()
    ├─ Converts to ReactFlow format via buildReactFlowGraph()
    └─ Passes nodes/edges to ReactFlowInspector
         ↓
    ReactFlowInspector (refactored)
    ├─ No longer knows about shape
    ├─ Works with nodes/edges directly
    ├─ Manages ELK layout
    └─ Handles interactions
```

### Benefits
- ✅ Clear separation of concerns (shape vs rendering)
- ✅ Matches proven Mermaid pattern
- ✅ Testable: converter can be unit tested separately
- ✅ Reusable: converter works for any visualizer needing this format
- ✅ Maintainable: rendering logic doesn't need to know about shape

### Implementation Stages

#### Stage 1: Create Converter Function
**File**: `src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts`

```typescript
export interface ReactFlowGraphData {
  nodes: Node[];
  edges: Edge[];
  nodeIds: string[];
}

export function buildReactFlowGraph(
  shape: MachineShape
): ReactFlowGraphData {
  // Extract states: shape.states.keys() → Node[]
  // Extract transitions: shape.transitions → Edge[]
  // Return both with metadata for rendering
}
```

**What it does**:
1. Iterate `shape.states` → create nodes with:
   - `id`: full key (e.g., "Payment.Authorized")
   - `data`: { label, isActive: false, path: [] }
   - `position`: { x: 0, y: 0 } (placeholder for layout)

2. Iterate `shape.transitions` → create edges with:
   - `id`: unique per transition
   - `source`/`target`: state keys
   - `label`: event name
   - `data`: { event, isClickable: false }

3. Return structured data

**Testing**: Unit test with toggle and checkout examples

#### Stage 2: Create HSMReactFlowInspector Wrapper
**File**: `src/viz/ReactFlowInspector/HSMReactFlowInspector.tsx`

```typescript
const HSMReactFlowInspector = ({ machine, ... }) => {
  // Get shape
  const shape = useMemo(
    () => machine.shape?.getState(),
    [machine]
  );

  // Convert to ReactFlow format
  const graphData = useMemo(
    () => shape ? buildReactFlowGraph(shape) : null,
    [shape]
  );

  // Get current state (full path)
  const currentState = useMachine(machine);

  // Pass to base renderer
  return (
    <ReactFlowInspector
      nodes={graphData?.nodes || []}
      edges={graphData?.edges || []}
      currentState={currentState?.key}
      ...
    />
  );
};
```

**What it does**:
1. Subscribes to machine and gets shape
2. Converts shape to nodes/edges via converter
3. Gets current state
4. Passes everything to ReactFlowInspector

#### Stage 3: Refactor ReactFlowInspector
**File**: `src/viz/ReactFlowInspector/ReactFlowInspector.tsx`

**Change signature**:
```typescript
interface ReactFlowInspectorProps {
  // NEW: Direct nodes/edges instead of machine
  nodes: Node[];
  edges: Edge[];
  currentState: string;
  previousState?: string;
  
  // KEEP: Dispatch and options
  dispatch: (event: { type: string }) => void;
  layoutOptions?: LayoutOptions;
  interactive?: boolean;
}
```

**What changes**:
- Remove `definition` prop (no longer needs machine)
- Accept `nodes` and `edges` directly
- Remove shape extraction logic from hooks
- Focus hooks on rendering and layout only

#### Stage 4: Simplify Hooks
**File**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`

**New responsibility**: Layout and highlighting only

```typescript
export const useStateMachineNodes = (
  nodes: Node[],        // From parent (already have all info)
  currentState: string, // From parent
  layoutOptions?: LayoutOptions
) => {
  // Focus ONLY on:
  // 1. Apply ELK layout to node positions
  // 2. Update highlighting based on currentState
  // 3. Handle dragging and saving positions
  
  // DO NOT: Extract from shape, build state tree, etc.
};
```

**What's removed**:
- Shape extraction logic
- `extractTransitionsForLayout()` (edges now separate)
- Hierarchy walking
- State comparison logic (just use exact match now)

#### Stage 5: Update useStateMachineEdges
**File**: `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts`

```typescript
export const useStateMachineEdges = (
  edges: Edge[],        // From parent
  nodes: Node[],        // For positioning
  currentState: string,
  previousState?: string,
  interactive?: boolean
) => {
  // Focus ONLY on:
  // 1. Update edge styling based on state
  // 2. Make edges interactive when applicable
  
  // DO NOT: Extract from shape, map transitions, etc.
};
```

### Files Involved

**New**:
- `src/viz/ReactFlowInspector/HSMReactFlowInspector.tsx`
- `src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts`

**Modified**:
- `src/viz/ReactFlowInspector/ReactFlowInspector.tsx` (signature change)
- `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts` (major refactor)
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts` (minor simplification)

**Migration**:
- Update all import sites to use `HSMReactFlowInspector` instead of direct `ReactFlowInspector`
- Keep old `ReactFlowInspector` as internal component (don't export)

---

## Option B: In-Place Refactor (Not Recommended)

Keep current structure but fix issues directly in existing hooks.

### Issues with this approach
- ❌ Mixes shape understanding with rendering
- ❌ Doesn't match proven Mermaid pattern
- ❌ Harder to test shape extraction separately
- ❌ Creates technical debt for future visualizers
- ❌ Repeats mistakes from Mermaid pre-adapter

**Decision**: Not recommended. Option A is cleaner.

---

## Shape System Integration

### Shape Contract Expected
```typescript
machine.shape.getState() returns MachineShape {
  states: Map<string, StateNode>          // All states, full paths
  transitions: Map<string, Map<string, string>>  // from → event → to
  hierarchy: Map<string, string | undefined>    // child → parent
  initialKey: string
}
```

### How Adapter Uses Shape
1. **Node Creation**: Iterate `shape.states` keys
2. **Edge Creation**: Iterate `shape.transitions`
3. **Hierarchy**: Store in node data for later use if needed
4. **Initial State**: From `shape.initialKey`

### Important Assumptions
- All state keys are already full paths (even for hierarchical machines)
- No additional extraction needed
- Transitions map has all events as keys

---

## Addressing Current Issues

### Issue 1: ELK Layout Not Applied

**Current Problem**: Nodes created at (0,0), ELK runs, but positions not applied

**Root Cause (likely)**:
1. React state batching delays updates
2. Container doesn't have explicit height
3. `fitView` called before layout completes

**Solution in New Design**:
1. Converter creates nodes with placeholder positions
2. Hook applies ELK layout
3. Hook updates state with positioned nodes
4. Container has explicit height constraint
5. `fitView` called only after layout completes

**Key Change**: ELK layout in hook receives clean node list from converter, applies layout, updates state. Clear data flow.

### Issue 2: Portal Rendering

**Current Problem**: Settings dialog button doesn't show popover

**Root Cause (likely)**:
1. Z-index issue (z-50 might not be high enough)
2. Position/fixed positioning issue
3. CSS overflow or clipping
4. Portal rendering outside visible area

**Solution in New Design**:
1. Keep portal as-is (structure is correct)
2. Add CSS debugging class
3. Test with temporary background color
4. Verify ReactFlow container doesn't clip portal

**Key Change**: This isn't a shape problem, so no changes in new design. Just CSS debugging.

### Issue 3: HSM State Highlighting

**Current Problem**: State changes don't highlight in hierarchical machines

**Root Cause**: 
1. currentState format unclear (leaf vs full path?)
2. Comparison logic may have edge cases
3. node.id might not match currentState

**Solution in New Design**:
1. Converter ensures all node.id values are full paths
2. currentState passed from parent is full path (HSMReactFlowInspector ensures this)
3. Hook does simple exact match: `node.id === currentState`
4. No complex traversal or fuzzy matching

**Key Change**: Clear contract: both sides use full paths, simple comparison.

### Issue 4: Edge Interactivity

**Current Problem**: Clicking edges doesn't trigger transitions in HSM

**Root Cause**: Likely related to state highlighting - if state isn't right, click detection fails

**Solution in New Design**:
1. Edges created with proper event data from transitions
2. State highlighting works correctly
3. Edge click handler uses currentState to check if clickable

**Key Change**: Depends on Issue 3 being fixed first. Should work once state comparison is fixed.

---

## Implementation Sequence

### Phase A: Build Adapter (no changes to current code yet)
1. Create `shapeToReactFlow.ts` converter
2. Create `HSMReactFlowInspector.tsx` wrapper
3. Test converter with toggle and checkout examples
4. Validate nodes/edges match expected structure

### Phase B: Refactor ReactFlowInspector
1. Change signature to accept nodes/edges
2. Update props and interface
3. Remove shape-related props

### Phase C: Simplify Hooks
1. `useStateMachineNodes`: Focus on layout + highlighting
2. `useStateMachineEdges`: Focus on styling + interaction
3. Remove shape extraction logic

### Phase D: Debugging + Fix Issues
1. Debug ELK layout application
2. Fix portal rendering
3. Verify HSM highlighting
4. Test edge interactivity

### Phase E: Migration
1. Update HSMVisualizerDemo to use HSMReactFlowInspector
2. Keep ReactFlowInspector as internal (don't export)
3. Update any direct ReactFlowInspector imports

---

## Success Criteria

### Phase A (Adapter)
- [ ] Converter exports valid ReactFlowGraphData
- [ ] Test: toggle example produces 2 nodes (On, Off)
- [ ] Test: checkout example produces 7 nodes (Payment.Authorized, etc.)
- [ ] Test: edges correctly extracted (4 for toggle, 6+ for RPS)
- [ ] HSMReactFlowInspector renders without shape errors

### Phase B (Refactor)
- [ ] ReactFlowInspector accepts nodes/edges props
- [ ] Backward compatibility maintained (via wrapper)
- [ ] No changes needed to hook signatures yet

### Phase C (Simplify)
- [ ] useStateMachineNodes: ~100 lines (down from 400+)
- [ ] useStateMachineEdges: Focused on styling only
- [ ] No shape extraction code remains

### Phase D (Fix Issues)
- [ ] ELK layout applies: nodes spread across canvas
- [ ] Portal appears when button clicked
- [ ] State highlighting works for toggle
- [ ] State highlighting works for checkout
- [ ] Edge clicks trigger transitions

### Phase E (Migrate)
- [ ] All examples work with new HSMReactFlowInspector
- [ ] No broken imports
- [ ] Clean git history

---

## Risk Assessment

### Low Risk
- Converter implementation (isolated, testable)
- Creating HSMReactFlowInspector (new file, no deletions)
- Portal debugging (CSS-only, no logic changes)

### Medium Risk
- Hook refactoring (must not break layout)
- State comparison changes (must handle all cases)

### High Risk
- Signature changes (could affect other code)
- ELK layout debugging (complex algorithm)

### Mitigation
- Keep old component during migration
- Write unit tests for converter
- Test all examples after each phase
- Revert if issues appear

---

## Testing Strategy

### Unit Tests
```typescript
// test/shapeToReactFlow.test.ts
describe('buildReactFlowGraph', () => {
  it('converts toggle shape to 2 nodes', () => { ... });
  it('converts checkout shape to hierarchical nodes', () => { ... });
  it('creates transitions as edges', () => { ... });
});
```

### Integration Tests
```typescript
// Manual: Load toggle example
// Verify: Nodes appear, ELK layout applies, state highlights

// Manual: Load checkout example
// Verify: All nodes appear, hierarchical structure visible
```

### Browser Testing (Required)
- Toggle example: nodes positioned, layout works, state highlights
- RPS example: edges extracted correctly, interactive
- Checkout example: HSM structure visible, state highlights change

---

## Future Considerations

### Adapter Pattern Value
Once this pattern is established for ReactFlow, can apply to:
- ForceGraph (create shapeToForceGraph converter)
- Future visualizers
- Any format conversion needs

### Refactoring to Option B (Full)
After all visualizers adapted, could further refactor to:
- Create generic `ShapeVisualizer` base component
- Define standard converter interface
- Reduce code duplication

But that's Phase 2 work. First, get ReactFlow and ForceGraph properly adapted.

---

## Conclusion

Adapter pattern (Option A) is the correct approach. It:
1. ✅ Solves immediate issues (ELK, portal, HSM)
2. ✅ Matches proven Mermaid pattern
3. ✅ Sets up ForceGraph for similar treatment
4. ✅ Leaves room for future refactoring
5. ✅ Clear separation of concerns
6. ✅ Testable and maintainable

**Recommendation**: Proceed with Option A implementation.
