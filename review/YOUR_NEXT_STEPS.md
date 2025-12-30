# Your Next Steps: ReactFlow Phase 1-5 Implementation

## Current Situation

**Design phase is complete.** All strategic planning and architecture decisions have been validated. Parallel work (converter + wrapper for both visualizers) has been specified and handed off.

You are now ready to begin implementation of ReactFlow's complete adaptation to the shape system.

---

## What's Happening in Parallel

Two agents are starting work simultaneously:
- **Agent on matchina-o3r8**: ReactFlow Phase A+B (converter + wrapper)
- **Agent on matchina-twm9**: ForceGraph Phase A+B (converter + wrapper)

This work is **independent of your Phase 1-5 work**. You don't depend on them; they just provide pre-built components that you'll use in Phase C.

---

## Your Work: ReactFlow Phase 1-5

You'll work on tickets:
- **Phase 1**: matchina-muq (ELK layout debugging)
- **Phase 2**: matchina-xoh (Portal rendering)
- **Phase 3**: matchina-jot (HSM state highlighting)
- **Phase 4-5**: Refactoring and migration (new work after parallel completes)

### Timeline

This can begin immediately. The parallel agents (Phase A+B) will take 2-4 hours. You can start Phase 1-3 in parallel with them.

---

## Phase 1: Debug ELK Layout (Immediate Start - Now)

**Ticket**: matchina-muq
**Time**: ~30 minutes
**Goal**: Get nodes to position correctly instead of staying at (0,0)

### The Problem

Nodes in ReactFlow render but are all positioned at (0,0) instead of being laid out by the ELK algorithm. You see a compressed diagram instead of a properly spaced layout.

### The Setup

You have clean code to work with:
- `useStateMachineNodes.ts` - Calls ELK layout
- `elkLayout.ts` - ELK algorithm configuration
- Example machines ready to test (toggle, RPS, checkout)

### Debugging Approach

**Add console.log at strategic points:**

```typescript
// In useStateMachineNodes.ts, around line 252 where ELK is called
getLayoutedElements(initialNodes, initialEdges, layoutOptions)
  .then(({ nodes: layoutedNodes }) => {
    console.log('🔍 ELK returned positions:', 
      layoutedNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
    );
    console.log('🔍 Positions valid?', layoutedNodes.every(n => n.position.x !== 0 || n.position.y !== 0));
    setNodes(layoutedNodes);
    console.log('🔍 setNodes called with:', layoutedNodes.length, 'nodes');
  })
```

**Test with simplest example (toggle)**:
```
npm run dev
# Open docs at localhost:4321
# Navigate to toggle example
# Open browser console
# Look for console.log output
# Check if positions are being returned
# Check if state is being updated
```

**Validation checklist**:
- [ ] ELK is being called (see "ELK returned" log)
- [ ] ELK returns positions (x, y not 0)
- [ ] setNodes is called (see "setNodes called" log)
- [ ] Nodes on canvas spread across screen (not clustered)

### Success Criteria

✅ Nodes are positioned across canvas with variation
✅ Layout changes when you change algorithm in layout panel
✅ Different examples have different layouts (not same positions)

### If Stuck

Common issues:
1. **Container height not set** - Check HSMVisualizerDemo passes height to component
2. **fitView called before layout done** - Check useEffect timing
3. **React batching** - State update happens but canvas doesn't refresh

**Debug by**: Adding more console.logs at key points in the layout effect

---

## Phase 2: Debug Portal Rendering (After Phase 1 - ~20 min)

**Ticket**: matchina-xoh
**Time**: ~20 minutes
**Goal**: Get layout settings dialog to appear when button is clicked

### The Problem

The "Layout" button is visible but clicking it doesn't show the settings panel. The popover should appear with layout options.

### The Setup

Code looks correct in ReactFlowInspector.tsx:
- Button with onClick handler
- State variable `showLayoutDialog`
- Portal rendering the panel

### Debugging Approach

**Add temporary styling to debug**:

```typescript
// In ReactFlowInspector.tsx around line 214
{showLayoutDialog &&
  createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}  // Temp: red background to see
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowLayoutDialog(false);
      }}
    >
      <div className="mt-16 mr-4 max-w-[300px] overflow-auto" style={{ background: 'white', padding: '10px', border: '2px solid red' }}>
        <LayoutPanel ... />
      </div>
    </div>,
    document.body
  )}
```

**Test**:
```
# With temp styling, click button
# Do you see red background overlay? YES → CSS issue in LayoutPanel
# Do you see white box with red border? YES → But not styled properly
# See nothing? → Portal not rendering (bigger issue)
```

**Validation checklist**:
- [ ] Button click fires (add console.log in onClick)
- [ ] State changes (check showLayoutDialog boolean)
- [ ] Portal appears with temp styling
- [ ] Portal is properly positioned

### Success Criteria

✅ Clicking button shows popover
✅ Popover displays layout options (selectable)
✅ Changing options works (triggers relayout)

### If Stuck

Common issues:
1. **z-index not high enough** - z-50 in Tailwind = z-index: 50. May need higher.
2. **Position: fixed not working** - Check parent container doesn't have position:relative
3. **Scrollbar jump** - Browser behavior when modal opens. Can add `overflow: hidden` to body

**Debug by**: Simplify portal content to just `<div>TEST</div>`. If it appears, issue is LayoutPanel styling.

---

## Phase 3: Fix HSM State Highlighting (After Phase 2 - ~30 min)

**Ticket**: matchina-jot
**Time**: ~30 minutes
**Goal**: Active state highlights correctly in hierarchical machines

### The Problem

In HSM examples (checkout), when state changes, the node highlighting doesn't update. Or highlights the wrong node.

### The Setup

State comparison happens in useStateMachineNodes.ts:
```typescript
data: {
  isActive: currentState === state,  // Simple equality check
}
```

### Debugging Approach

**Add diagnostic logging**:

```typescript
// In useStateMachineNodes.ts around line 205
const initialNodes: Node[] = states.map((state) => {
  const isActive = currentState === state;
  console.log('🔍 Node comparison:', {
    state: state,
    currentState: currentState,
    matches: isActive,
    stateType: typeof state,
    currentType: typeof currentState
  });
  
  return {
    id: state,
    data: {
      label: state,
      isActive: isActive,
      debug: { state, currentState, matches: isActive }  // Keep in data for debugging
    },
    // ...
  };
});
```

**Test with checkout example**:
```
# Open checkout example
# Look at console for diagnostic logs
# Check: Do state and currentState match in type and value?
# Toggle state (click an event)
# Check: Does highlighting update?
```

**Validation checklist**:
- [ ] Both state and currentState are strings
- [ ] currentState is full path (e.g., "Payment.Authorized" not "Authorized")
- [ ] state from nodes is full path
- [ ] Equality comparison returns true when they should match
- [ ] Highlighting updates when state changes

### Success Criteria

✅ Active state highlights in toggle example
✅ Active state highlights in checkout example (hierarchical)
✅ Highlighting updates immediately when state changes
✅ No "pending" states or wrong highlights

### If Stuck

Common issues:
1. **currentState is leaf-only** - Wrapper should pass full path. Check HSMReactFlowInspector.
2. **State format mismatch** - One has dots, other doesn't. Should never happen with shape.
3. **Component not re-rendering** - Check useMachine() is properly subscribed.

**Debug by**: Add `_debug` field to node.data with state/currentState values visible in rendered node.

---

## Phase 4: Refactor ReactFlowInspector (After Parallel Completes)

**Depends on**: matchina-o3r8 completion (parallel work)

### What Happens

Once the parallel agent completes Phase A+B:
- You'll have `shapeToReactFlow.ts` converter function
- You'll have `HSMReactFlowInspector.tsx` wrapper

Then you refactor:
1. Change ReactFlowInspector signature (accept nodes/edges instead of definition)
2. Remove shape extraction code
3. Simplify hooks
4. Update imports

**Time**: 1-2 hours
**Documentation**: See REACTFLOW_TECH_DESIGN.md Stage 3-4

---

## Phase 5: Migration (After Phase 4)

**Time**: 30 minutes - 1 hour

1. Update HSMVisualizerDemo to import HSMReactFlowInspector
2. Test with all examples
3. Verify no breaking changes

**Documentation**: See REACTFLOW_TECH_DESIGN.md Stage 5

---

## Your Focus Right Now

### This Session

Start with Phase 1 (ELK layout debugging):

1. Read REACTFLOW_TECH_DESIGN.md Stage 1-2 to understand what's coming
2. Understand why shape system is good
3. Add debug logging to ELK layout code
4. Test with toggle example
5. Validate nodes position correctly

Estimated time: 1 hour

### Before You Start Phase 2

The parallel agents should have code committed:
- `src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts`
- `src/viz/ReactFlowInspector/HSMReactFlowInspector.tsx`

You can look at how they built the wrapper to understand the pattern better. But Phase 1-3 don't depend on them.

---

## Key Documents in Order

1. **REACTFLOW_TECH_DESIGN.md** (15 min) - Understand the full plan
2. **DESIGN_REVIEW_AND_SANITY_CHECK.md** (10 min) - Validate it's sound
3. **Then start Phase 1 debugging** (1 hour)

---

## Success Definition for Your Work

### Phase 1 Done When
- Nodes spread across canvas (not clustered at 0,0)
- Layout changes with different algorithms
- Works for toggle and checkout examples

### Phase 2 Done When
- Layout options popover appears on button click
- Panel is visible and styled correctly
- Options are interactive

### Phase 3 Done When
- State highlighting works in toggle
- State highlighting works in checkout
- Highlighting updates as state changes

### Phases 4-5 Done When
- ReactFlowInspector refactored and simplified
- HSMReactFlowInspector is the public API
- All examples work (toggle, RPS, checkout)
- No console errors

---

## Debugging Tips

### Console Logging

Be methodical:
```typescript
console.log('🔍 Label: descriptive info about what you're checking');
console.log('📊 Data:', { var1, var2, var3 }); // Objects for inspection
console.log('✅ Success condition met');
console.log('❌ Error: description');
```

### Browser DevTools

- **Console**: Check your logs
- **Elements**: Inspect the ReactFlow canvas container, check if it has width/height
- **Network**: Check no failed requests
- **React DevTools**: Check state values, props flowing correctly

### Test Examples

Always test with:
1. **toggle** (simplest, 2 states)
2. **RPS** (multiple events from same state)
3. **checkout** (hierarchical, full paths)

If it works in all three, it's correct.

---

## When to Ask for Help

Use your design documents:
1. Check REACTFLOW_TECH_DESIGN.md for detailed specs
2. Check DESIGN_REVIEW_AND_SANITY_CHECK.md for why things are designed this way
3. Look at VISUALIZER_ARCHITECTURE_EVOLUTION.md for context
4. Reference HSMMermaidInspector.tsx (similar pattern, proven to work)

If still stuck:
- Add more console.log
- Simplify the component (remove features, test basic case)
- Check git history (what changed recently)
- Revert back to known state and try again

---

## Ready to Start?

You have:
- ✅ Full design documentation
- ✅ Clear Phase 1-3 specifications
- ✅ Success criteria for each phase
- ✅ Example machines to test
- ✅ Reference implementation (Mermaid pattern)
- ✅ Support documents

**You're ready to begin implementation.**

Start with Phase 1 debugging. Trust the design - it's been validated. Focus on making it work.

Good luck! 🚀
