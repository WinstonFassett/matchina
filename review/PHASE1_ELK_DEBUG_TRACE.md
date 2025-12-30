# Phase 1: ELK Layout Debugging - Console Log Guide

## What's Been Added

Comprehensive console logging has been added to `useStateMachineNodes.ts` to trace the ELK layout process end-to-end.

## How to Debug

### Step 1: Open Browser Console

1. Navigate to http://localhost:4321/matchina/examples/toggle
2. Open browser DevTools: **F12** or **Cmd+Option+I** (Mac)
3. Click on **Console** tab
4. Look for logs starting with 🔍 [ELK] or 🔍 [init]

### Step 2: Watch for Layout Initialization

When the page loads, you should see:

```
🔍 [init] Starting layout initialization for 2 states
🔍 [init] Saved positions available: 0
🔍 [ELK] Starting layout for 2 nodes with 2 transitions
```

**What this means:**
- ✅ If you see these logs: Component is rendering and calling layout setup
- ❌ If you DON'T see them: Component isn't initializing (bigger issue, check for React errors)

### Step 3: Check ELK Result

After initialization logs, you should see:

```
🔍 [ELK] Layout succeeded. Returned positions:
  On: x=150, y=50
  Off: x=150, y=200
🔍 [ELK] Has valid (non-zero) positions: true
✅ [ELK] State updated, isLayoutComplete set to true
```

**Success criteria:**
- ✅ "Layout succeeded" appears (ELK ran without error)
- ✅ Position values are different (x and y vary)
- ✅ "Has valid (non-zero) positions: true" (positions aren't all 0,0)
- ✅ isLayoutComplete set to true (state was updated)

**Failure scenarios:**

If you see:
```
❌ [ELK] Layout failed: [error message]
🔍 [ELK] Using fallback grid layout: [positions]
```

This means ELK threw an error. Check the error message - common issues:
- Missing or invalid node/edge data
- Container height not set properly
- ELK library issue

### Step 4: Check Node Positions on Canvas

Once layout succeeds, nodes should be visible on the canvas.

**Expected for toggle example:**
- 2 nodes: "On" and "Off"
- Nodes should be **spread across the canvas** (not all at 0,0)
- Nodes might be at (150, 50) and (150, 200) or similar spread positions

**Test by:**
1. Look at the ReactFlow canvas - are the nodes spread out?
2. Try dragging nodes - can you move them?
3. Change layout algorithm (Layout button) - do positions change?

### Step 5: Watch State Changes

Click the canvas to trigger a state change. You should see:

```
🔍 [updateNodeStates] Updating active state highlighting for currentState: Off
```

**This means:**
- ✅ State change was detected
- ✅ Node highlighting is being updated
- Should see visual change (active node color changes)

## Test Sequence

### For Toggle Example (Simplest Case)

1. Load http://localhost:4321/matchina/examples/toggle
2. Open console
3. Look for initialization logs (should see `Starting layout for 2 nodes`)
4. Look for position logs (should see non-zero positions)
5. Look at canvas - nodes should be spread out
6. Click to change state - see `Updating active state highlighting`
7. Visual state change should occur

### For Checkout Example (Hierarchical Case)

1. Load http://localhost:4321/matchina/examples/checkout
2. Look for initialization logs (should see `Starting layout for 7+ nodes`)
3. Look for position logs (all should have valid coordinates)
4. Canvas should show hierarchical layout
5. Click to transition - see highlighting change

## Interpreting Results

### ✅ Everything Works

- [x] Initialization logs appear
- [x] "Layout succeeded" in logs
- [x] Positions are non-zero and varied
- [x] Nodes spread across canvas
- [x] State changes trigger highlighting
- [x] Layout changes work (Algorithm button)

**Result: Phase 1 Complete ✅**

### ⚠️ Partial Working

**If positions are all (0,0) or (0,0) clustered:**
- ELK is returning zero positions
- Check: Is container height set?
- Check: Is node width/height configured in elkLayout.ts?
- May need to adjust node sizing or container constraints

**If ELK fails with error:**
- Check error message in console
- Might be shape data format issue
- Check useStateMachineNodes is getting shape.states correctly

### ❌ Not Working

**If you see no console logs at all:**
- Component not rendering
- Check for React errors (red text in console)
- Check if ReactFlowInspector is being used
- Verify machine has .shape property

**If you see errors about undefined:**
- `Cannot read property 'x' of undefined` → ELK returned malformed data
- `shape is undefined` → Machine doesn't have .shape property
- Check if other machines in examples work

## Key Validation Checkpoints

| Checkpoint | Expected | If Failing |
|-----------|----------|-----------|
| Init log appears | Yes | Component not initializing |
| Layout succeeded | Yes | ELK error in console |
| Position values non-zero | Yes | Nodes all at (0,0) |
| Canvas shows spread nodes | Yes | Nodes clustered together |
| State change triggers log | Yes | useMachine subscription issue |
| Highlighting updates visually | Yes | Node.data.isActive not affecting rendering |

## Next Steps

Once debugging is complete:

1. **If everything works:** Move to Phase 2 (Portal Rendering)
2. **If ELK issue:** Check container height and node dimensions
3. **If state issue:** Verify useMachine() subscription working
4. **If shape issue:** Verify machine.shape.getState() returns valid data

## Reference: Expected Console Flow

```
// Page loads
🔍 [init] Starting layout initialization for 2 states
🔍 [init] Saved positions available: 0
🔍 [ELK] Starting layout for 2 nodes with 2 transitions

// ELK processes
🔍 [ELK] Layout succeeded. Returned positions:
  On: x=150, y=50
  Off: x=150, y=200
🔍 [ELK] Has valid (non-zero) positions: true
✅ [ELK] State updated, isLayoutComplete set to true

// User interacts
🔍 [updateNodeStates] Updating active state highlighting for currentState: Off
```

This is the healthy flow. Any deviations indicate where debugging needs to focus.
