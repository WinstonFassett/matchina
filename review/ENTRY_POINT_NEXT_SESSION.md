# Entry Point for Next Session: Visualizer Debugging

## Where We Left Off

The visualizer system architecture has been documented and strategic planning completed. The foundation (Shape System) is fixed and working. Sketch and Mermaid visualizers work perfectly. ReactFlow and ForceGraph need systematic debugging and fixes.

## Documents to Read First (In Order)

1. **`VISUALIZER_STRATEGY_SUMMARY.md`** (10 min read)
   - High-level overview of status quo
   - What works vs what's broken
   - Strategic approach chosen (Option C: Hybrid)
   - Time estimates for each phase

2. **`VISUALIZER_ARCHITECTURE_EVOLUTION.md`** (15 min read)
   - Full evolution story from instance inspection to shape system
   - Why shape system is the solution
   - Successful patterns from Sketch and Mermaid
   - Pragmatic reality check (things work but may have rough edges)

3. **`REACTFLOW_ADAPTATION_PLAN.md`** (20 min read)
   - Three critical issues identified
   - Three options for approach (recommended: Option C)
   - Detailed debugging plan with specific console.log points
   - Success criteria for each phase

## Current Tickets to Work On

**Priority Order** (as recommended in REACTFLOW_ADAPTATION_PLAN.md):

### Phase 1: Fix ELK Layout (Critical Blocker)
**Ticket**: `matchina-muq`
- **Issue**: Nodes stuck at (0,0) instead of being positioned by ELK layout
- **Time**: ~30 minutes
- **Files**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`
- **Goal**: Get nodes to spread across canvas with proper positions

### Phase 2: Fix Layout Panel Portal
**Ticket**: `matchina-xoh`
- **Issue**: Layout options button doesn't show popover
- **Time**: ~20 minutes
- **Files**: `src/viz/ReactFlowInspector/ReactFlowInspector.tsx`
- **Goal**: Get settings panel to appear when button clicked

### Phase 3: Fix HSM State Highlighting
**Ticket**: `matchina-jot`
- **Issue**: State changes don't highlight correctly in hierarchical machines
- **Time**: ~30 minutes
- **Files**: `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`
- **Goal**: Active state highlights properly in both flat and HSM examples

### After Success: Plan ForceGraph
**Tickets**: `matchina-51p`, `matchina-mks`
- Apply same patterns from ReactFlow
- Consider adapter pattern (like HSMMermaidInspector)

## Quick Reference: Key Code Locations

### Shape System (Foundation - Already Fixed)
```
src/factory-machine.ts          # Lines 114-130: Always attach .shape
src/hsm/shape-types.ts          # MachineShape and ShapeController interfaces
src/hsm/shape-store.ts          # createStaticShapeStore and createLazyShapeStore
```

### Working Visualizers (Reference)
```
src/viz/SketchInspector.tsx                    # Direct shape consumption
src/viz/HSMMermaidInspector.tsx                # Adapter pattern wrapper
src/viz/MermaidInspector.tsx                   # Format-specific rendering
```

### Visualizers to Fix
```
src/viz/ReactFlowInspector/ReactFlowInspector.tsx          # Main component
src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts   # Node extraction and layout (FOCUS HERE)
src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts   # Edge extraction
src/viz/ReactFlowInspector/utils/elkLayout.ts             # ELK layout algorithm
src/viz/ForceGraphInspector.tsx                            # Not yet adapted
```

### Example Machines
```
docs/src/code/examples/toggle/             # Simple flat machine (best for testing)
docs/src/code/examples/rock-paper-scissors/ # HSM but simpler
docs/src/code/examples/checkout/           # Complex HSM (good for validation)
```

## Debugging Checklist

### Before Starting
- [ ] Read the three documents in order (total ~45 min)
- [ ] Understand the Shape System concept
- [ ] Understand why Sketch and Mermaid work

### Phase 1: ELK Layout
- [ ] Add console.logs to track ELK execution
- [ ] Verify ELK returns positions (not 0,0)
- [ ] Check if setNodes updates React state
- [ ] Verify container has explicit height
- [ ] Test with toggle example (simplest case)
- [ ] Success: nodes spread across canvas

### Phase 2: Portal Toggle
- [ ] Add console.logs to state changes
- [ ] Verify button click fires handler
- [ ] Check portal styling (z-index, position)
- [ ] Look for CSS issues causing scrollbar jump
- [ ] Test visibility with temporary red background
- [ ] Success: popover appears and shows options

### Phase 3: HSM State
- [ ] Add console.logs showing currentState value
- [ ] Verify it's a full path (e.g., "Payment.Authorized")
- [ ] Check nodes from shape.states
- [ ] Test comparison logic
- [ ] Test with checkout example
- [ ] Success: state highlighting works in HSM

## The Shape System in 60 Seconds

Every machine has `.shape` property:
```typescript
const shape = machine.shape.getState();

// Three things shape provides:
shape.states       // Map<string, StateNode> - all states, full paths
shape.transitions  // Map<string, Map<string, string>> - from → event → to
shape.hierarchy    // Map<string, string | undefined> - child → parent
```

**For flat machines**: Keys are simple ("On", "Off")
**For hierarchical**: Keys are full paths ("Payment.Authorized")

**All visualizers use this same interface**. ReactFlow just needs to use it correctly.

## Key Principles

1. Always use `machine.shape.getState()` - don't assume machine has `.states` or `.transitions`
2. State keys in shape are already full paths - don't try to construct them
3. Use exact match for state comparison: `currentState === state`
4. Subscribe with `useMachine(machine)` for reactivity
5. Use `shape.hierarchy` for parent-child relationships, not key naming conventions

## Success Looks Like

- [ ] Toggle example: nodes positioned, layout options work, state highlights
- [ ] RPS example: same as toggle
- [ ] Checkout example: same as toggle, plus HSM nesting (state highlights in hierarchy)
- [ ] ForceGraph: canvas renders, similar functionality

## When Stuck

1. Check the architecture documents for context
2. Look at how Sketch and Mermaid solve the same problem
3. Add console.logs to trace what's happening
4. Remember: pragmatic approach - make it work first, clean it up later

## Next Session Deliverables

1. Phase 1 complete: ELK layout working
2. Phase 2 complete: Portal toggle working
3. Phase 3 complete: HSM highlighting working
4. Plan documented for ForceGraph

Total estimated time: ~1.5 hours for all three phases

Good luck! 🚀
