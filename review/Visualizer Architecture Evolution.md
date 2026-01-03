# Visualizer Architecture Evolution: From Instance Inspection to Shared Shape System

## Overview

This document captures the deliberate architectural evolution of the Matchina visualization system. What started as ad-hoc inspection of machine instances evolved into a sophisticated shared interface (the Shape System) that all visualizers can rely on. This journey reveals why the current architecture works and how to extend it successfully.

## Part 1: The Evolution Journey

### Phase 1: Instance Inspection (Initial Approach)
**Problem**: Visualizers needed to understand machine structure to render diagrams.

**First attempt**: Inspect the machine instance directly
- Look at `machine.states` (if it existed)
- Look at `machine.transitions` (if it existed)
- Treat the machine as a black box and extract what's visible

**Result**: This worked for simple cases but:
- Different machines exposed structure differently
- XState format, Matchina format, custom machines all looked different
- Visualizers had to understand multiple formats
- Code became brittle when machine internals changed

### Phase 2: Invoking Functions (Intermediate Approach)
**Realization**: Instead of inspecting, maybe visualizers should invoke the state factory functions to understand what states are possible.

**Approach**:
- Call `states.On()`, `states.Off()` to see what instances look like
- Inspect the returned state objects
- Extract keys and data from instances

**Result**: Better, but still problems:
- Requires knowing about factory functions
- Can't guarantee what factories return
- Still different per machine
- Doesn't solve the hierarchy problem

### Phase 3: Transition Helpers (Getting Closer)
**Realization**: We need a way to understand not just states, but how they connect.

**Approach**:
- Create helpers to traverse transitions
- Build graphs from transition definitions
- Create utilities to extract paths

**Result**: Getting better, but still ad-hoc:
- Different visualizers had different helpers
- Duplication across codebase
- Still not a unified interface
- Each visualizer had to know about Matchina internals

### Phase 4: The Breakthrough - Shared Shape System (Current)
**Key Insight**: What if every machine provided a **standardized structural description**?

**The idea**: Create a common interface that all machines expose, regardless of type:
- All machines get `.shape` property
- `.shape` provides `getState()` method
- Returns `MachineShape` with standard structure
- Visualizers depend on this interface, not machine internals

**Result**: The foundation for successful visualization
- Single source of truth for machine structure
- All visualizers use same interface
- Easy to add new visualizers
- Machine internals can change without breaking visualizers

---

## Part 2: The Shape System Contract

Once the Shape System is properly exposed via `.shape` on every machine, visualizers can access:

```typescript
const shape = machine.shape.getState();

// shape.states: Map<string, StateNode>
// Example keys: "On", "Off" (flat) or "Payment.Authorized", "Payment.Pending" (hierarchical - already flattened)
for (const [fullKey, stateNode] of shape.states.entries()) {
  console.log(fullKey); // Full key with dots if nested
  console.log(stateNode.key); // Just the leaf name ("Authorized" not "Payment.Authorized")
  console.log(stateNode.fullKey); // The full path
}

// shape.transitions: Map<string, Map<string, string>>
// Maps: from-state -> event-name -> to-state
for (const [fromState, eventMap] of shape.transitions.entries()) {
  for (const [eventName, toState] of eventMap.entries()) {
    console.log(`${fromState} --[${eventName}]--> ${toState}`);
  }
}

// shape.hierarchy: Map<string, string | undefined>
// Maps: full-key -> parent-full-key (undefined if root)
```

### Implementing the Shape System Universally

**Key Decision**: Every machine, regardless of type, must expose `.shape`

**File**: `src/factory-machine.ts` (lines 114-130)

The critical insight: `.shape` should be attached to **ALL** machines created via `createMachine()`, not just hierarchical ones.

```typescript
// BEFORE: Conditional - only hierarchical machines got shape
const stateKeys = Object.keys(states);
const hasFlatKeys = stateKeys.some(key => key.includes('.'));
if (hasFlatKeys) {
  // attach shape - but this meant flat machines didn't get it!
}

// AFTER: Always attach shape (to ALL machines)
try {
  const shapeStore = createStaticShapeStore(machine);
  Object.defineProperty(machine, 'shape', {
    value: shapeStore,
    enumerable: false,
    configurable: true,
    writable: true,
  });
} catch (e) {
  console.error('[createMachine] Failed to attach shape:', e);
}
```

**Why the original was wrong:**
The condition `stateKeys.some(key => key.includes('.'))` meant:
- Flat machines (toggle, RPS) with keys like "On", "Off" → NO shape attached ❌
- Hierarchical machines (checkout) with keys like "Payment.Authorized" → shape attached ✅

This created an inconsistent interface where some machines had `.shape` and others didn't.

**Why the fix works:**
- `.shape` is **non-enumerable** - doesn't affect `Object.keys()`, JSON serialization, or standard machine usage
- `.shape` is **configurable and writable** - can be overridden if needed
- **Backward compatible** - zero breaking changes to existing code
- **Universal** - works for both flat AND hierarchical machines
- **Consistent** - all machines now expose the same interface

---

## Part 3: Concrete Problem Solved

Once `.shape` is universally available, visualizers can rely on it working everywhere. This solved multiple problems:

### Problem 1: Visualizers Couldn't Access Machine Structure
**Before**: Each visualizer had different ways to inspect structure
- Sketch tried to walk nested states
- Mermaid tried to find config objects
- ReactFlow tried to extract transitions from state.on

**After**: All visualizers use `machine.shape.getState()` consistently

### Problem 2: Hierarchical and Flat Machines Needed Different Code
**Before**: Need separate code paths for nested vs flat
```typescript
if (hasNestedStates) {
  // Complex extraction for HSM
} else {
  // Simple extraction for flat
}
```

**After**: Single code path - shape.states already contains all states (flat or nested) with their full paths

### Problem 3: Different Machine Types Had Different Interfaces
**Before**: XState machines, Matchina factory machines, custom machines all looked different

**After**: All expose `.shape` property with consistent `MachineShape` structure

---

## Part 2: Pragmatic Reality Check

### It Works, But Might Have Rough Edges

The fixes and patterns described here work well in practice, but there may be:
- Edge cases not yet exposed by current examples
- Assumptions about state structure that haven't been fully tested
- Weirdness in how updates are batched or applied
- Inconsistencies between different visualizers

**Important**: Don't assume perfect correctness just because things are currently working. Be prepared to:
1. Add logging if users report issues
2. Review "weird" code patterns that seem to work
3. Simplify or clarify confusing logic
4. Fix edge cases as they appear

**Example areas to watch**:
- HSM state comparison logic (works but may have subtle issues)
- ELK layout application (works sometimes but positioning unclear)
- Portal rendering (works but scrollbar behavior is quirky)
- Edge extraction from shape.transitions (works but format is unusual)

**Philosophy**: Make it work first, clean it up once you understand all the edge cases.

---

## Part 3: Successful Adaptation Patterns

### Pattern 1: Sketch Inspector (Fully Adapted)

**File**: `src/viz/SketchInspector.tsx`

**How it works:**
1. Gets machine and subscribes with `useMachine(machine)` for reactivity
2. Accesses shape directly: `const shape = machine.shape?.getState()`
3. **Extracts root states** by filtering hierarchy for entries with `parentFullKey === undefined`
4. **Renders recursively** - StateItem component renders:
   - Current state by exact key match: `isActive = (stateNode.fullKey === fullPath)`
   - Children by looking up hierarchy: `parentFullKey === stateNode.fullKey`
   - Transitions by querying shape: `shape.transitions.get(stateNode.fullKey)`

**Key design decision:** Separates `key` (leaf name) from `fullKey` (full path). Uses `fullKey` for hierarchy traversal and comparison, `key` for display.

**Handles both flat and hierarchical:**
```typescript
// Flat machine (toggle)
// fullKey: "On", parentFullKey: undefined → renders as root
// fullKey: "Off", parentFullKey: undefined → renders as root

// Hierarchical machine (checkout)
// fullKey: "Payment.Authorized", parentFullKey: "Payment" → renders as child
// fullKey: "Payment", parentFullKey: undefined → renders as root, contains children
```

**Why it works:**
- Doesn't assume anything about key format
- Uses shape.hierarchy directly (ground truth source)
- Doesn't try to extract nested structure from state config (wrong approach)
- Subscription via `useMachine()` ensures UI updates when state changes

### Pattern 2: Mermaid Inspector (Fully Adapted + HSM-Specific Wrapper)

**Files**: `src/viz/MermaidInspector.tsx` and `src/viz/HSMMermaidInspector.tsx`

**Base MermaidInspector approach:**
1. Takes a pre-built config object (not the machine directly)
2. Converts config to Mermaid syntax (stateDiagram-v2)
3. Highlights active state via DOM manipulation after Mermaid renders

**HSM-specific wrapper (HSMMermaidInspector):**
```typescript
// Builds the shape tree from the machine
const config = useMemo(() => buildShapeTree(machine), [machine]);

// Then passes to base MermaidInspector
return <MermaidInspector config={config} stateKey={stateKey} ... />
```

**The buildShapeTree function:**
- Converts `machine.shape` into a nested config structure that Mermaid expects
- Handles both flat (no nesting) and hierarchical (nested states) machines
- Result is passed to MermaidInspector which doesn't need to know about matchina

**Why this two-layer pattern:**
- **Decouples shape understanding from diagram rendering**
- MermaidInspector deals with config format (format-specific problem)
- HSMMermaidInspector deals with shape system (integration problem)
- Makes MermaidInspector reusable for non-matchina configs

**Key pattern learned:**
> For complex visualizers, create an adapter layer that converts from Matchina's shape system into the visualizer's expected format.

## Part 3: ReactFlow - Not Yet Adapted (Critical Issue)

### Current State

**Files involved:**
- `src/viz/ReactFlowInspector/ReactFlowInspector.tsx` - Main component
- `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts` - Node extraction
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts` - Edge extraction
- `src/viz/ReactFlowInspector/utils/elkLayout.ts` - Layout algorithm

### Known Issues

1. **Layout toggle broken** - Button to open layout options panel disappeared
2. **Node positioning** - Nodes render but are clustered (layout algorithm not being applied)
3. **Not interactive for HSMs** - State changes don't update visualizations for hierarchical machines
4. **No hierarchical visualization** - All nodes at same level, no visual nesting/grouping

### Root Causes Identified

**Issue 1: Incomplete Shape Adaptation**

The hooks extract from shape but make assumptions about structure:

```typescript
// useStateMachineNodes.ts - CURRENT APPROACH
const extractTransitionsForLayout = (shapeTree: any) => {
  // Tries to navigate stateConfig.states recursively
  // But shapeTree is a shape object, not a tree of configs
  // This mixing of abstractions is causing confusion
}
```

**Issue 2: State Comparison for HSMs**

The current logic doesn't handle hierarchical state paths correctly:

```typescript
// WRONG: Uses currentState directly without understanding it's a full path
isActive: currentState === state

// For HSM example:
// currentState might be "Payment.Authorized" (full path)
// state might be "Payment" or "Authorized" (leaf)
// They never match
```

**Issue 3: Node Positioning**

ELK layout is called but results aren't being applied:

```typescript
// Layout promise resolves but nodes don't update properly
getLayoutedElements(...).then(({ nodes: layoutedNodes }) => {
  setNodes(layoutedNodes);  // This should work but nodes stay at (0,0)
})
```

### Design Decision: Keep ReactFlow or Rewrite?

**Option A: Adapt ReactFlow (Recommended)**
- Apply the Sketch/Mermaid patterns
- Create an adapter layer if needed (like HSMMermaidInspector)
- Reuse the hooks but fix the abstractions

**Option B: Simpler Alternative**
- Create `HSMReactFlowInspector.tsx` wrapper (like HSMMermaidInspector)
- Convert shape to ReactFlow-friendly format first
- Let hooks work with that format

## Part 4: ForceGraph - Not Yet Adapted

Similar issues to ReactFlow:
- Expects a different data format than shape provides
- No adapter layer to convert between them
- Likely needs HSMForceGraphInspector wrapper

## Part 5: Recommended Evolution Path

### Step 1: Understand the Pattern

All successful visualizers follow this pattern:

```
Machine with .shape
    ↓
Read shape with machine.shape.getState()
    ↓
Either:
  A. Work directly with shape structure (Sketch)
  B. Convert shape to visualizer format via adapter (Mermaid via buildShapeTree)
    ↓
Render visualization
    ↓
Subscribe to machine with useMachine() for updates
    ↓
Compare against fullKey to determine highlights
```

### Step 2: Fix ReactFlow

**Option A: Minimal Fix (Recommended First)**

1. **Fix state comparison** - Use `fullKey` from shape.states
2. **Fix the layout toggle** - Debug why panel disappeared
3. **Fix HSM state updates** - Ensure currentState is always full path
4. **Fix node positioning** - Debug why ELK layout results aren't applied

**Option B: Full Refactor**

1. Create `HSMReactFlowInspector.tsx` adapter
2. Convert shape to ReactFlow node/edge format (like buildShapeTree for Mermaid)
3. Keep hooks simple and format-focused (not shape-focused)

### Step 3: Fix ForceGraph

Same approach as ReactFlow:
- Either adapt existing logic to work with shape
- Or create `HSMForceGraphInspector.tsx` adapter

### Step 4: Document Results

Update this file with successful patterns for future reference.

## Key Principles Learned

1. **Separate concerns**: Shape understanding (integration) from visualization rendering (format-specific)

2. **Use full keys consistently**: For hierarchical machines, state identifiers must be full paths with dots. Never assume leaf names work.

3. **Hierarchy is truth**: Use `shape.hierarchy` as the source of truth for parent-child relationships. Don't try to derive it from key naming conventions.

4. **Subscribe for reactivity**: Always use `useMachine(machine)` to subscribe to state changes. Don't rely on prop changes alone.

5. **Explicit design patterns**: Create wrapper components (like HSMMermaidInspector) for visualizers that need shape adaptation rather than trying to make single components work for all cases.

6. **Non-enumerable properties are safe**: `.shape` doesn't affect normal machine usage because it's non-enumerable and configurable.

## Files Reference

**Shape System (Read-only, understood):**
- `src/factory-machine.ts` - Where `.shape` is attached (FIXED)
- `src/hsm/shape-types.ts` - MachineShape and ShapeController interfaces
- `src/hsm/shape-store.ts` - createStaticShapeStore and createLazyShapeStore

**Successful Visualizers (Model these):**
- `src/viz/SketchInspector.tsx` - Direct shape approach (WORKING)
- `src/viz/MermaidInspector.tsx` - Base renderer
- `src/viz/HSMMermaidInspector.tsx` - Shape adapter wrapper (WORKING)

**Visualizers Needing Adaptation (Focus here):**
- `src/viz/ReactFlowInspector/ReactFlowInspector.tsx` - Main (BROKEN)
- `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts` - Needs shape understanding
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts` - Needs shape understanding
- `src/viz/ReactFlowInspector/utils/elkLayout.ts` - Layout logic (may be working)

**ForceGraph (Similar issues):**
- `src/viz/ForceGraphInspector.tsx` - Needs adaptation (NOT RENDERING)

## Next Actions

1. Debug the layout toggle regression in ReactFlow
2. Fix node positioning by understanding ELK application
3. Fix HSM state updates by using proper state path comparison
4. Consider creating HSMReactFlowInspector adapter if full refactor needed
5. Apply same fixes to ForceGraph
