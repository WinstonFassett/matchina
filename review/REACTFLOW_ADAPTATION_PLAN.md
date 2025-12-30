# ReactFlow Adaptation Plan: Strategic Approach to HSM Support

## Current Situation

ReactFlow visualizer was partially adapted to use the Matchina shape system but has critical issues that prevent it from working properly with hierarchical state machines (HSMs). Meanwhile, Sketch and Mermaid visualizers work correctly with both flat and HSM examples.

## Critical Issues (In Priority Order)

### 1. Node Positioning / ELK Layout (Blocks all visualizations)
- **Symptom**: Nodes render but are all positioned at (0,0) instead of being laid out
- **Root Cause**: ELK layout calculation results aren't being properly applied to nodes
- **Impact**: All ReactFlow visualizations look wrong (compressed into top-left corner)
- **Status**: BLOCKING - without layout, diagram is unusable

### 2. Layout Options Panel Toggle (UX Regression)
- **Symptom**: Layout button shows but popover doesn't appear
- **Observations**:
  - Code looks correct (createPortal should work)
  - Button should set state (setShowLayoutDialog)
  - Popover should render conditionally
- **Likely Cause**: CSS/styling issue OR portal rendering outside viewport
- **Impact**: Users can't change layout algorithm
- **Status**: IMPORTANT - affects usability

### 3. HSM State Highlighting (Breaks hierarchical examples)
- **Symptom**: In HSM examples (checkout, payment), state updates don't highlight correctly
- **Root Cause**: State comparison logic doesn't handle full paths correctly
  - Current state passed as full path: `"Payment.Authorized"`
  - Node IDs from shape are also full paths: `"Payment.Authorized"`
  - But the comparison logic may have other issues
- **Impact**: User can't see which state is active in HSM diagrams
- **Status**: CRITICAL - breaks HSM visualization

### 4. Interactive Edge Clicks (Minor)
- **Symptom**: Clicking edges doesn't trigger transitions in HSM examples
- **Root Cause**: Likely related to HSM state highlighting - if state isn't right, clicks don't match
- **Impact**: Can't test HSM transitions visually
- **Status**: MEDIUM - secondary to state highlighting

## Strategic Options

### Option A: Minimal Targeted Fixes (Recommended)
**Philosophy**: Keep the existing structure, fix the specific bugs

**Steps**:
1. Debug ELK layout application
2. Debug layout panel portal rendering
3. Fix HSM state comparison
4. Verify edge interactivity works

**Pros**:
- Minimal code changes
- Preserves existing patterns
- Quick to implement

**Cons**:
- May miss underlying architectural issues
- Could leave technical debt

**Effort**: ~2 hours

---

### Option B: Full Adapter Pattern (Like Mermaid)
**Philosophy**: Create HSMReactFlowInspector that adapts shape to ReactFlow format first

**Steps**:
1. Create `HSMReactFlowInspector.tsx` wrapper
2. Create shape-to-ReactFlow converter (like buildShapeTree for Mermaid)
3. Convert shape to nodes/edges format upfront
4. Keep hooks simple and format-focused
5. Handle updates through converter

**Pattern**:
```typescript
const HSMReactFlowInspector = ({ machine, ... }) => {
  // Step 1: Extract shape
  const shape = machine.shape?.getState();
  
  // Step 2: Convert to ReactFlow format
  const { nodes: nodeData, edges: edgeData } = convertShapeToReactFlow(shape);
  
  // Step 3: Pass to base ReactFlowInspector
  return (
    <ReactFlowInspector 
      definition={{ nodes: nodeData, edges: edgeData }}
      ...
    />
  );
};
```

**Pros**:
- Clear separation of concerns (shape understanding vs rendering)
- Proven pattern from Mermaid success
- More maintainable long-term
- Easier to test converter separately

**Cons**:
- More code changes
- Need to rework how nodes/edges are passed to hooks
- More complex to implement

**Effort**: ~4 hours

---

### Option C: Hybrid - Fix Critical Issues + Prepare for Refactor
**Philosophy**: Get things working now, plan proper refactor for later

**Steps**:
1. Fix ELK layout application (critical blocker)
2. Fix layout panel portal (UX regression)
3. Fix HSM state comparison (gets it working)
4. Add TODO comments for future refactor to Option B
5. Document what needs changing in architecture

**Pros**:
- Gets functionality working immediately
- Leaves path clear for proper refactor
- Less risk than full rewrite
- User can see progress

**Cons**:
- Creates technical debt
- Might need to rework twice

**Effort**: ~2 hours

---

## Recommendation

**Implement Option C: Hybrid Approach**

### Why:
1. **Immediate value** - User can see working ReactFlow diagrams quickly
2. **Lower risk** - Minimal changes to existing code
3. **Clear path forward** - Document what needs refactoring and why
4. **Preserves learning** - Problems exposed during bug fixes inform the refactor design

### Implementation Order:

#### Phase 1: Fix Critical Blocker (ELK Layout)
- [ ] Debug why ELK layout results aren't applied to nodes
- [ ] Verify nodes get positions from ELK
- [ ] Test with toggle example (simplest case)

#### Phase 2: Fix UX Regression (Layout Panel)
- [ ] Debug why portal doesn't appear
- [ ] Check if CSS is causing scrollbar jump
- [ ] Test layout options work when visible

#### Phase 3: Fix HSM Support (State Highlighting)
- [ ] Verify currentState is always full path
- [ ] Fix state comparison in useStateMachineNodes
- [ ] Test with checkout example

#### Phase 4: Document for Refactor
- [ ] Add comments about why each part exists
- [ ] Document what the refactor (Option B) should look like
- [ ] Note entry points that would change

## Debugging Plan for Phase 1: ELK Layout

### Issue: Nodes stuck at (0,0)

**Investigation checklist:**

1. **Verify ELK is being called**
   ```typescript
   // In useStateMachineNodes.ts, add console.log
   getLayoutedElements(initialNodes, initialEdges, layoutOptions)
     .then(({ nodes: layoutedNodes }) => {
       console.log('ELK returned nodes:', layoutedNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })));
       setNodes(layoutedNodes);
     })
   ```

2. **Verify layoutedNodes have positions**
   - If they're still (0,0) after ELK, ELK isn't working
   - If they have positions, setNodes might not be updating state

3. **Check if setNodes is actually updating**
   - Add logging after setNodes call
   - Check that nodes state changes in React

4. **Verify fitView is called**
   - The fitView in the useEffect might be the issue
   - Try removing it temporarily to isolate

5. **Check ReactFlow container has size**
   - Parent div needs width/height
   - Look at HSMVisualizerDemo to see how it renders

### Common Issues:

- **Container height not set**: ReactFlow needs explicit height
- **ELK not returning positions**: Check ELK error handling
- **fitView called before layout complete**: Race condition
- **setNodes batching**: React batching might delay updates

## Phase 2: Debug Layout Panel Portal

### Possible issues:

1. **Portal rendering but off-screen**
   - Check z-index: z-50 should be high enough
   - Check fixed positioning: `fixed inset-0` should overlay
   - Check if scrollbar is jumping (CSS issue)

2. **Portal div not styled**
   - Background color not visible (should be `bg-white`)
   - Border not visible
   - Text color wrong

3. **Click handler not firing**
   - Button onClick should work
   - Check if event propagation is blocked

### Debug approach:

```typescript
// Add temporary logging
const [showLayoutDialog, setShowLayoutDialog] = useState(false);
useEffect(() => {
  console.log('Dialog state:', showLayoutDialog);
}, [showLayoutDialog]);

// Verify portal renders
{showLayoutDialog && (
  <div style={{ background: 'red', position: 'fixed', inset: 0, zIndex: 50 }}>
    TEST PORTAL - should see red
  </div>
)}
```

## Phase 3: Fix HSM State Highlighting

### Root cause analysis:

**Current code pattern:**
```typescript
// useStateMachineNodes.ts
const states = useMemo(() => {
  if (!shape?.states) return [];
  if (shape.states instanceof Map) {
    return Array.from(shape.states.keys());
  }
  return Object.keys(shape.states);
}, [shape]);

// Later in node rendering
data: {
  isActive: currentState === state,  // Exact match
}
```

**Question**: Is `currentState` always a full path?

For flat machine (toggle):
- currentState should be: "On" or "Off"
- state should be: "On" or "Off"
- Match: ✓ Works

For HSM (checkout):
- currentState should be: "Payment.Authorized" or "Payment.Pending" (full path)
- state should be: "Payment.Authorized" or "Payment.Pending" (full path)
- Match: ✓ Should work

**But user reports it doesn't work for HSMs.** Why?

Possibilities:
1. currentState is sometimes leaf-only instead of full path
2. State comparison has a different issue (different format, trimming, etc.)
3. State comparison is right but highlighting logic is wrong

**Debug approach:**

```typescript
// In useStateMachineNodes.ts
console.log('Current state:', currentState);
console.log('States available:', states);
console.log('Match result:', states.map(s => ({ state: s, matches: s === currentState })));

// In node data
data: {
  label: state,
  isActive: currentState === state,
  // Add these for debugging:
  _currentState: currentState,
  _nodeState: state,
}
```

## Success Criteria

### Phase 1 (ELK Layout) - PASS if:
- [ ] Nodes position across screen (not clustered at 0,0)
- [ ] Layout changes when algorithm changes
- [ ] Different examples have different layouts (not same positions)

### Phase 2 (Layout Panel) - PASS if:
- [ ] Button click shows popover
- [ ] Popover is visible and styled
- [ ] No scrollbar jump

### Phase 3 (HSM State) - PASS if:
- [ ] Active state highlights in checkout example
- [ ] Highlight changes when state changes
- [ ] Works for both flat and HSM examples

## After Success: Refactoring Notes

Once all three phases work, document what needs refactoring to Option B:

1. **Create converter function** - Shape to ReactFlow format
2. **Create HSMReactFlowInspector** wrapper
3. **Simplify hooks** - Remove shape logic, work with converted format
4. **Separate concerns** - Shape understanding in wrapper, rendering in hooks
5. **Improve testability** - Converter can be unit tested separately

This keeps current fixes focused while leaving clear path to clean architecture.
