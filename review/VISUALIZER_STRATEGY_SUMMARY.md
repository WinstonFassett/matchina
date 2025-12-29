# Visualizer Strategy: Summary and Next Steps

## The Big Picture

The Matchina visualizer system has evolved from XState integration to being deeply integrated with Matchina's shape-based introspection. This document provides the strategic context for the work ahead.

## What We Know Works

### ✅ Sketch Inspector (100% Working)
- Direct shape consumption approach
- Handles both flat and hierarchical machines
- Pattern: Read shape → Extract hierarchy → Render recursively
- File: `src/viz/SketchInspector.tsx`

### ✅ Mermaid Inspector (100% Working)
- Adapter pattern approach
- Creates shape-aware wrapper (HSMMermaidInspector)
- Pattern: Read shape → Convert to config → Pass to base renderer
- Files: `src/viz/MermaidInspector.tsx` + `src/viz/HSMMermaidInspector.tsx`

### ✅ Shape System Foundation (Fixed)
- `.shape` property now attached to ALL machines via `createMachine()`
- Previously only attached to hierarchical machines (bug)
- Non-enumerable property - zero side effects
- Provides unified interface for shape access: `machine.shape.getState()`

---

## What's Blocking Us

### ❌ ReactFlow Inspector (3 Critical Issues)
1. **ELK Layout broken** - Nodes won't position correctly
2. **Layout panel portal missing** - Settings dialog doesn't appear
3. **HSM state highlighting broken** - State changes don't highlight in hierarchical machines

### ❌ ForceGraph Inspector (Not rendering)
- Similar shape integration issues as ReactFlow
- Needs same adaptation approach

---

## Strategic Framework

### The Adaptation Pattern

Successful visualizers follow this architecture:

```
┌─────────────────────────────────────────┐
│  Machine with .shape attached           │
│  (All machines now have this)           │
└─────────────────────┬───────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Get shape: machine.shape        │
         │ .getState()                     │
         └─────────────┬───────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
    ┌─────────────┐      ┌──────────────────┐
    │  Pattern A: │      │   Pattern B:     │
    │   Direct    │      │    Adapter       │
    │ Consumption │      │    Pattern       │
    │             │      │                  │
    │  Read shape │      │  Convert shape   │
    │  directly   │      │  to visualizer   │
    │  in render  │      │  format first    │
    │             │      │                  │
    │  Example:   │      │  Example:        │
    │  Sketch     │      │  Mermaid via     │
    │             │      │  buildShapeTree  │
    └─────────────┘      └──────────────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────────┐
    │     Render Visualization            │
    └──────────────┬──────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  Subscribe to machine updates        │
    │  useMachine(machine)                 │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  Compare state to highlight active   │
    │  Use fullKey for exact match         │
    └──────────────────────────────────────┘
```

### Why This Matters

- **Pattern A (Sketch)**: Good for simple hierarchical rendering
- **Pattern B (Mermaid)**: Good for complex formats with many options
- **Pattern C (Not yet tried)**: Hybrid - adapter for format conversion only

---

## The Three Critical Insights

### 1. The Shape Contract

Every visualizer that works relies on this:

```typescript
const shape = machine.shape.getState();

// Three things shape provides:
shape.states       // Map<string, StateNode> - all states (flat or nested)
shape.transitions  // Map<string, Map<string, string>> - from → event → to
shape.hierarchy    // Map<string, string | undefined> - state → parent
shape.initialKey   // string - starting state
```

**Critical**: State keys in shape are already full paths for hierarchical machines.
- Flat: "On", "Off"
- Hierarchical: "Payment.Authorized", "Payment.Pending" (NOT just "Authorized")

### 2. The Subscription Pattern

Every visualizer that handles updates correctly does this:

```typescript
// Hook for reactivity
useMachine(machine);  // Subscribe to state changes

// Then use exact match for highlighting
isActive = (nodeState === currentState);  // currentState is full path
```

### 3. The Adapter Option

When a visualizer has complex format needs (Mermaid), create a wrapper:

```typescript
// HSMMermaidInspector.tsx - wrapper
const config = useMemo(
  () => buildShapeTree(machine),  // Convert shape → Mermaid config
  [machine]
);
return <MermaidInspector config={config} />;

// MermaidInspector.tsx - base
// Doesn't know about Matchina, works with any config
```

**Benefit**: Separates "shape understanding" (wrapper) from "visualization rendering" (base)

---

## Work Plan: Next 3 Phases

### Phase 1: Debug and Fix ELK Layout (Critical Blocker)
**Goal**: Get nodes to position correctly instead of clustering at (0,0)

**Time**: ~30 minutes
**Files**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`

**Debugging steps**:
1. Add console logs to trace ELK layout
2. Check if ELK is returning positions
3. Verify setNodes updates state
4. Check container has explicit height

**Success**: Nodes spread across diagram with different positions per layout

---

### Phase 2: Debug and Fix Layout Panel Portal
**Goal**: Get the settings popover to appear when Layout button clicked

**Time**: ~20 minutes
**Files**: `src/viz/ReactFlowInspector/ReactFlowInspector.tsx`

**Debugging steps**:
1. Add console logs to verify state changes
2. Check portal styling (z-index, positioning)
3. Verify portal renders (use red background temporarily)
4. Check for scrollbar issues

**Success**: Clicking layout button shows popover with options

---

### Phase 3: Fix HSM State Highlighting
**Goal**: Make state changes highlight correctly in hierarchical machines

**Time**: ~30 minutes
**Files**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`

**Debugging steps**:
1. Verify currentState is always full path (add logging)
2. Check state comparison logic
3. Fix node highlighting for HSM examples
4. Verify with checkout example

**Success**: Active state highlights in both flat and HSM examples

---

### After Success: Strategic Planning
**Goal**: Plan proper refactoring while momentum is high

**Actions**:
1. Document technical debt introduced by quick fixes
2. Design Option B (Adapter Pattern) for ReactFlow
3. Plan when to refactor
4. Apply learnings to ForceGraph

---

## What Success Looks Like

### For ReactFlow:
- [ ] Nodes position correctly across screen
- [ ] Layout options appear and work
- [ ] State highlighting works for toggle and checkout
- [ ] Edge clicks trigger transitions
- [ ] All examples (flat and HSM) work

### For ForceGraph:
- [ ] Canvas renders with visualized graph
- [ ] Nodes position based on physics simulation
- [ ] State highlighting works

### For Architecture:
- [ ] Clear documentation of shape system
- [ ] Pattern examples for each visualizer type
- [ ] Roadmap for future improvements documented

---

## Key Files Reference

### Shape System (Foundation - Fixed)
- `src/factory-machine.ts` (lines 114-130) - Always attach shape ✅
- `src/hsm/shape-types.ts` - Shape interfaces
- `src/hsm/shape-store.ts` - Shape creation

### Working Visualizers (Reference Implementation)
- `src/viz/SketchInspector.tsx` - Direct shape approach
- `src/viz/HSMMermaidInspector.tsx` - Adapter wrapper
- `src/viz/MermaidInspector.tsx` - Format-specific rendering

### Visualizers to Fix
- `src/viz/ReactFlowInspector/ReactFlowInspector.tsx` - Main component
- `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts` - Node logic
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts` - Edge logic
- `src/viz/ReactFlowInspector/utils/elkLayout.ts` - Layout algorithm
- `src/viz/ForceGraphInspector.tsx` - Not yet adapted

---

## Documentation Location

### Architecture Overview
- `review/VISUALIZER_ARCHITECTURE_EVOLUTION.md` - Full evolution story

### Action Plan
- `review/REACTFLOW_ADAPTATION_PLAN.md` - Detailed debugging and fix plan

### This Document
- `review/VISUALIZER_STRATEGY_SUMMARY.md` - Strategic context and next steps

---

## Important: Pragmatic State of Current Implementation

The visualizers (Sketch, Mermaid) work well, but some of the underlying logic may have:
- **Rough edges** - Edge cases not yet exposed by current examples
- **Weird patterns** - Code that works but could be clearer
- **Undocumented assumptions** - Behavior that relies on specific state structure

**This is intentional**: Working code first, perfect code later. As edge cases appear, the implementation will be refined. Don't assume perfect correctness just because things render correctly.

**Keep a watchlist**:
- HSM state comparison (works but may have subtle issues)
- ELK layout application (works sometimes, positioning logic unclear)
- Portal rendering quirks (scrollbar behavior)
- Edge extraction from shape.transitions (works but format is unusual)

## The Principle

> Visualizers succeed when they understand and respect the shape system, subscribe to machine updates, and compare using full state paths. They fail when they make assumptions about state naming or try to extract structure that shape already provides.

This is now codified in working implementations (Sketch, Mermaid). ReactFlow and ForceGraph need to adopt the same principles.

---

## References

- `review/VISUALIZER_ARCHITECTURE_EVOLUTION.md` - Full evolution history and patterns
- `review/REACTFLOW_ADAPTATION_PLAN.md` - Detailed debugging plan for ReactFlow
- `review/PHASE1_ELK_DEBUG_TRACE.md` - Specific ELK layout debugging steps (when created)
