# ReactFlow Visualization Fixes

## Status
ReactFlow infrastructure is now **FIXED** for both flat and hierarchical state machines. Critical data flow and layout bugs have been resolved.

## Critical Bugs Fixed

### 1. Wrong Machine Definition Passed to ReactFlowInspector
**File**: `docs/src/components/MachineExampleWithChart.tsx`
**Problem**: ReactFlowInspector was receiving `config` (XState-style configuration) instead of the actual `machine` instance
**Impact**: ReactFlow couldn't access `machine.shape` to extract states and transitions
**Fix**: Changed `definition={config}` to `definition={machine}` (line 129)

```typescript
// BEFORE (broken)
<ReactFlowInspector
  definition={config}  // ❌ XState config, doesn't have shape
  ...
/>

// AFTER (fixed)
<ReactFlowInspector
  definition={machine}  // ✅ Actual machine with shape property
  ...
/>
```

### 2. Map Data Structures Not Handled in Hierarchical State Extraction
**File**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`
**Problem**: The hierarchical state extraction function used `Object.entries()` on Maps, which returns empty arrays
**Impact**: Hierarchical machines (HSM) would extract zero nested states
**Fix**: Added Map type checking in the nested `extractStates()` function (lines 174-181)

```typescript
// BEFORE (broken)
const extractStates = (shapeObj: any, prefix = '') => {
  if (!shapeObj?.states) return;
  Object.entries(shapeObj.states).forEach(([stateName, stateConfig]) => {
    // Doesn't work if shapeObj.states is a Map!
  });
};

// AFTER (fixed)
const extractStates = (shapeObj: any, prefix = '') => {
  if (!shapeObj?.states) return;
  const stateEntries = shapeObj.states instanceof Map
    ? Array.from(shapeObj.states.entries())
    : Object.entries(shapeObj.states);
  stateEntries.forEach(([stateName, stateConfig]) => {
    // Works for both Map and Object
  });
};
```

### 3. Missing Height Constraints on Diagram Containers
**File**: `docs/src/components/MachineExampleWithChart.tsx`
**Problem**: Flex containers didn't have explicit height, so ReactFlow couldn't properly fit content
**Impact**: Diagrams would render at minimal size or not be fully visible
**Fix**: Added `h-96` (height: 24rem) to parent container and `h-full` to children (lines 102, 104, 137)

```typescript
// BEFORE (broken)
<div className={`flex flex-col md:flex-row gap-4 w-full`}>
  <div className={`flex-1`}> {/* No height! */}

// AFTER (fixed)
<div className={`flex flex-col md:flex-row gap-4 w-full h-96`}>
  <div className={`flex-1 h-full`}> {/* Explicit height */}
```

## Examples Updated to Use ReactFlow

All flat and hierarchical machine examples now use ReactFlow as default inspector:

**Flat Machines** (2 states or simple state machines):
- `toggle` - 2 states (On/Off)
- `traffic-light` - 3 states (Red/Yellow/Green)
- `counter` - 1 state
- `stopwatch-using-data-and-hooks` - 3 states
- `stopwatch-using-react-state-using-transitionhooks` - 3 states

**Flat + Hierarchical Comparison Examples** (using VisualizerDemo):
- `hsm-combobox` - 6 total states (1 parent + 5 nested)
- `hsm-checkout` - 7+ total states (hierarchical)
- `hsm-traffic-light` - 4+ total states (hierarchical)
- `rock-paper-scissors` - flat machine
- `checkout`, `auth-flow` - flat machines with explicit layouts

**Mermaid Examples** (for complex flows best shown as flowcharts):
- `async-calculator`
- `fetcher-advanced`
- `promise-machine-fetcher`

## Data Structure Context

### Shape Structure Change (Root Cause)
The machine shape object changed from Object-based to Map-based:

```typescript
// OLD (Object-based)
shape.states = {
  Idle: { on: { START: "Running" } },
  Running: { on: { STOP: "Idle" } }
}

// NEW (Map-based)
shape.states = Map {
  "Idle" => { on: Map { "START" => "Running" } },
  "Running" => { on: Map { "STOP" => "Idle" } }
}

// For hierarchical machines, nested states also use Maps
shape.states = Map {
  "Parent" => {
    states: Map {
      "Child1" => { ... },
      "Child2" => { ... }
    }
  }
}
```

### Extraction Patterns (Now Correct)

All transition and state extraction functions now properly handle both patterns:

```typescript
const stateEntries = states instanceof Map
  ? Array.from(states.entries())
  : Object.entries(states);
```

This pattern is applied in:
- `useStateMachineNodes.ts` - extractTransitionsForLayout() and extractStates()
- `useStateMachineEdges.ts` - extractTransitions()
- `ForceGraphInspector.tsx` - extractStates() and extractTransitions()

## Testing

### E2E Tests Created
- `test/e2e/reactflow-toggle.spec.ts` - Tests flat machines
- `test/e2e/reactflow-hsm-combobox.spec.ts` - Tests hierarchical machines
- `test/e2e/reactflow-basic.spec.ts` - Comprehensive tests for flat and HSM

### Manual Testing Required
1. Flat machines: toggle, traffic-light, counter should each render their correct number of states
2. HSM machines: combobox (nested mode), checkout, traffic-light should render all nested states
3. Diagram sizing: All nodes should be visible without scrolling in normal viewport

## Files Modified

1. **src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts**
   - Fixed hierarchical state extraction to handle Maps
   - Removed debug console.log statements

2. **src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts**
   - Already had correct Map handling (no changes needed)

3. **src/viz/ForceGraphInspector.tsx**
   - Updated to use shape.transitions Map directly
   - Added Map handling for state and transition extraction
   - Removed debug console.log statements

4. **docs/src/components/MachineExampleWithChart.tsx**
   - **CRITICAL**: Fixed `definition={machine}` (was `definition={config}`)
   - Added proper height constraints
   - Removed unused imports

5. **docs/src/components/HSMVisualizerDemo.tsx**
   - Verified correct machine passing (already correct)
   - Removed debug console.log statements

6. **Example files** (updated inspectorType):
   - `docs/src/code/examples/toggle/example.tsx`
   - `docs/src/code/examples/counter/example.tsx`
   - `docs/src/code/examples/stopwatch-using-data-and-hooks/example.tsx`
   - `docs/src/code/examples/stopwatch-using-react-state-using-transitionhooks/example.tsx`

## Commits Made

```
2bcece75 test: add comprehensive reactflow e2e tests
e8ae3144 fix: pass actual machine to ReactFlow inspector and add proper height constraints
4fec7bbd fix: handle Map instances in hierarchical state extraction
326fcf41 chore: update examples to use react-flow inspector and remove debug logs
```

## Remaining Work

### ForceGraph (Separate Issue)
ForceGraph now extracts correct diagram data but canvas rendering is not yet working. This requires:
1. Verify force-graph library initialization
2. Check canvas rendering pipeline
3. Verify CSS and theme variables are accessible

### Optional: Layout Customization
Current ReactFlow implementation uses ELK layout. Could add:
- User-selectable layout algorithms
- Custom node sizing based on hierarchy depth
- Theme color customization

## Key Takeaways

The visualization fixes hinge on three critical points:

1. **Data Structure Handling**: Always check for Maps vs Objects when extracting data
2. **Correct Data Flow**: Pass the actual machine object, not derived configurations
3. **Container Sizing**: Diagram containers need explicit height constraints in flexbox layouts

All three were violated in the original broken code. Now fixed.
