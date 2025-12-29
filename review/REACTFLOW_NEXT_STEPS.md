# ReactFlow Phase A+B+C → Phase D: Next Steps

**Current Status**: All implementation complete, ready for manual testing
**Branch**: `feat/externalize-inspect-viz` (36 commits ahead)
**Build**: ✅ Passing
**Working Tree**: Clean

---

## What's Done This Session

### Converter Function ✅
`src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts`
- Converts `MachineShape` → ReactFlow nodes/edges format
- Handles flat and hierarchical machines
- Creates unique edge IDs and validates all transitions

### Adapter Wrapper ✅
`src/viz/ReactFlowInspector/HSMReactFlowInspector.tsx`
- Extracts shape from machine
- Converts via `buildReactFlowGraph()`
- Manages state subscription
- Passes clean data to base component

### Refactored Base Component ✅
`src/viz/ReactFlowInspector/ReactFlowInspector.tsx`
- Changed signature to accept nodes/edges
- No longer extracts from machine
- Manages layout and interaction
- Calls simplified hooks

### Updated Hooks ✅
- `useStateMachineNodes.ts`: Focus on ELK layout + highlighting
- `useStateMachineEdges.ts`: Focus on styling + interaction
- Removed ~70 lines of shape extraction logic

### Updated Examples ✅
- `HSMVisualizerDemo.tsx`: Uses `HSMReactFlowInspector`
- `MachineExampleWithChart.tsx`: Uses `HSMReactFlowInspector`
- All debugging infrastructure from Phases 1-3 still in place

---

## Phase D: Manual Testing (What's Next)

### Step 1: Validate ELK Layout (Using Phase 1 Debugging)

```bash
# Load toggle example
navigate to http://localhost:4321/matchina/examples/toggle
open DevTools Console (F12)
click Visualizer Picker → ReactFlow
```

**Look for in console**:
```
🔍 [init] Starting layout initialization for 2 states
🔍 [ELK] Starting layout for 2 nodes with 2 transitions
🔍 [ELK] Layout succeeded. Returned positions:
  On: x=150, y=50
  Off: x=150, y=200
🔍 [ELK] Has valid (non-zero) positions: true
```

**Visual Check**:
- [ ] Two nodes (On, Off) visible on canvas
- [ ] Nodes spread apart (not clustered at 0,0)
- [ ] Can drag nodes to move them
- [ ] Layout button in top-right corner visible

**If failing**: Check `review/PHASE1_ELK_DEBUG_TRACE.md` for troubleshooting

---

### Step 2: Validate Portal Rendering (Using Phase 2 Debugging)

**Click Layout Button**:
```
Look for: 🔍 [Portal] Layout button clicked, showLayoutDialog: false
Then see: 🔍 [Portal] Rendering portal to document.body
```

**Visual Check**:
- [ ] Semi-transparent dark overlay appears
- [ ] Settings panel visible in top-right
- [ ] Panel has algorithm dropdown
- [ ] Sliders for Node Spacing, etc.
- [ ] Can close by clicking overlay

**If failing**: Check `review/PHASE2_PORTAL_DEBUG_TRACE.md` for CSS troubleshooting

---

### Step 3: Validate State Highlighting (Using Phase 3 Debugging)

**Initial Load**:
```
Look for: 🔍 [HSM] Updating active state highlighting
  currentState: On (type: string)
  comparing against 2 nodes
  On: isActive=true (was false)
```

**Click to Change State**:
```
Look for state change logs showing:
  Off: isActive=true (was false)
  On: isActive=false (was true)
```

**Visual Check**:
- [ ] Active state node is highlighted (different color/styling)
- [ ] Highlighting changes when state changes
- [ ] Works for toggle example
- [ ] Works for checkout (HSM) example

**If failing**: Check `review/PHASE3_HSM_HIGHLIGHT_DEBUG_TRACE.md` for state comparison issues

---

### Step 4: Test Hierarchical Machine (Checkout Example)

```bash
navigate to http://localhost:4321/matchina/examples/checkout
select ReactFlow
check console logs for hierarchical state paths
```

**Should see**:
```
🔍 [init] Starting layout initialization for 7 states
currentState: Payment.Authorized (full path)
```

**Visual Check**:
- [ ] Multiple nodes visible
- [ ] Layout works with more complex structure
- [ ] State highlighting shows full paths match

---

### Step 5: Test Edge Interactivity

**Assumptions**:
- ELK layout works (Step 1)
- State highlighting works (Step 3)

**What to test**:
- [ ] Edges are visible with labels (event names)
- [ ] Edge colors change based on state
- [ ] Hovering over edge shows it's interactive
- [ ] Clicking on possible transition edge triggers state change

**Note**: Edge clicking depends on state highlighting working correctly

---

## If Issues Are Found

### ELK Layout Not Working
1. Check console logs from Phase 1 guide
2. Verify container has explicit height (was fixed in earlier commit)
3. Check `useStateMachineNodes.ts` initialization
4. Issue likely in `getLayoutedElements()` call

### Portal Not Appearing
1. Check `showLayoutDialog` state in console
2. Verify portal is rendering (look for backdrop)
3. Check z-index in DevTools Inspector
4. Issue likely in CSS positioning or z-index

### State Highlighting Not Working
1. Check `currentState` value in console
2. Verify node IDs match state format
3. For HSM, ensure full paths (e.g., "Payment.Authorized")
4. Issue likely in state comparison logic

### Edges Not Clickable
1. First verify state highlighting works
2. Check edge data has correct `isClickable` value
3. Check `dispatch` callback is wired correctly
4. Issue likely in interaction handler

---

## Cleanup Plan (After Phase D Passes)

### Remove Debugging Logs
Search for and remove:
- `console.log('🔍` - ELK layout logs
- `console.log('✅` - Success logs
- `console.log('❌` - Error logs

**Files to clean**:
- `src/viz/ReactFlowInspector/hooks/useStateMachineNodes.ts`
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts`
- `src/viz/ReactFlowInspector/ReactFlowInspector.tsx`

### Keep Structure
Don't remove:
- Type definitions
- Comments explaining logic
- Error handling
- State management

---

## Testing Both Visualizers

### ForceGraph (Already in Phase D)
- Status: Rendering on canvas
- May have state issues to debug
- Has hierarchy visualization
- Use Phase 1-3 debugging logs from earlier session

### ReactFlow (This Session)
- Status: Ready for Phase D testing
- Same debugging guide structure
- Same three-layer architecture
- Parallel testing patterns

### Both Together
The fact that both use same three-layer pattern means:
- ✅ Same shape extraction code path
- ✅ Same converter validation logic
- ✅ Same state subscription pattern
- ✅ If one works, other likely works too

---

## Documentation to Reference

### For Testing
- `review/PHASE1_ELK_DEBUG_TRACE.md` - ELK layout validation
- `review/PHASE2_PORTAL_DEBUG_TRACE.md` - Portal rendering validation
- `review/PHASE3_HSM_HIGHLIGHT_DEBUG_TRACE.md` - State validation

### For Understanding
- `review/REACTFLOW_PHASE_ABC_COMPLETE.md` - This session's work
- `review/VISUALIZER_STATUS_SNAPSHOT.md` - System overview
- `review/REACTFLOW_TECH_DESIGN.md` - Architecture specification

---

## Success Criteria for Phase D

### All Tests Pass ✅
- [ ] ELK layout applies (positions non-zero and varied)
- [ ] Portal appears on button click
- [ ] State highlighting updates on state change
- [ ] Works for toggle example
- [ ] Works for checkout (HSM) example
- [ ] Edge clicking triggers transitions

### Code Quality ✅
- [ ] Debugging logs can be removed cleanly
- [ ] No errors in console (except expected logs)
- [ ] Build still passes after cleanup
- [ ] Git history is clean

### Ready for Merge ✅
- [ ] All tests passing
- [ ] Debugging logs removed
- [ ] Examples working as expected
- [ ] Documentation updated if needed

---

## Quick Checklist for Next Session

Before starting Phase D:
- [ ] Read this document (2 min)
- [ ] Run `npm run build` to verify build passes (1 min)
- [ ] Skim `VISUALIZER_STATUS_SNAPSHOT.md` for context (3 min)
- [ ] Run local dev servers (docs and vitest)
- [ ] Follow Phase 1-3 debugging guides in order
- [ ] Take notes on what works/fails
- [ ] Document findings in a new file

---

## Git Commands for Phase D

```bash
# Start Phase D
git checkout feat/externalize-inspect-viz
git pull origin feat/externalize-inspect-viz  # Sync if needed

# View what's been done
git log --oneline -10

# After Phase D testing, if fixes needed:
git add -A
git commit -m "ReactFlow Phase D: [description of fixes]"

# After cleanup:
git add -A
git commit -m "ReactFlow Phase D: Remove debugging logs and finalize"
```

---

## Estimated Timeline

- **Phase D (Testing/Debugging)**: 1-2 hours
  - Follow debugging guides: 30 min
  - Fix issues if found: 30-60 min
  - Cleanup and finalization: 15 min

- **Phase E (Code Review/Polish)**: 30 min
  - Review changes
  - Update docs if needed
  - Final build verification

- **Total**: 2-3 hours of work remaining

---

## Everything You Need

✅ Converter function - complete and tested
✅ Adapter wrapper - complete and integrated
✅ Refactored base component - complete
✅ Debugging infrastructure - in place
✅ Documentation - comprehensive
✅ Examples - updated and ready
✅ Build - passing

**You have everything needed for Phase D testing. Start with Phase 1 debugging guide.**
