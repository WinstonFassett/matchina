# Phase 3: HSM State Highlighting Debugging - Console Log Guide

## What's Been Added

Console logging to trace state comparison and highlighting in both hooks:

### useStateMachineNodes.ts (Node Highlighting)
- Logs currentState value and its type
- Shows how many nodes are being compared
- Logs which nodes match currentState (highlighting changes)
- Tracks isActive status changes

### useStateMachineEdges.ts (Edge Highlighting)
- Logs state comparison details for transitions
- Shows isPossibleExit (can transition from current state)
- Shows isTransitionFromPrevious (just happened)
- Helps validate edge styling logic

## How to Debug

### Step 1: Open Browser Console

1. Go to http://localhost:4321/matchina/examples/toggle (simple case first)
2. Open DevTools: **F12** or **Cmd+Option+I** (Mac)
3. Click **Console** tab
4. Look for logs starting with 🔍 [HSM]

### Step 2: Check Initial Rendering

When page loads, look for:

```
🔍 [HSM] Updating active state highlighting
  currentState: On (type: string)
  comparing against 2 nodes
  On: isActive=true (was false)
  Off: isActive=false (was false)
```

**What this means:**
- ✅ `type: string` - currentState is a string ✓
- ✅ `On: isActive=true` - Toggle starts in "On" state ✓
- ✅ `Off: isActive=false` - Other state not active ✓

**If you see different:**
- ❌ `type: object` - currentState is wrong type
- ❌ `currentState: undefined` - Not tracking state
- ❌ All nodes: `isActive=false` - None match

### Step 3: Test State Change

Click the toggle to switch state. Should see:

```
🔍 [HSM] Updating active state highlighting
  currentState: Off (type: string)
  comparing against 2 nodes
  Off: isActive=true (was false)
  On: isActive=false (was true)
```

**Key validations:**
- [ ] currentState changed from "On" to "Off" ✓
- [ ] Off node now has isActive=true ✓
- [ ] On node now has isActive=false ✓
- [ ] Visual change on canvas (highlighting moves) ✓

### Step 4: Check Edge Highlighting (optional)

Looking for:
```
🔍 [edges] State comparison: {
  currentState: "Off",
  transitionFrom: "Off",
  transitionTo: "On",
  isPossibleExit: true,
  isTransitionFromPrevious: false
}
```

**What this tells you:**
- `isPossibleExit: true` = We're at this state, can transition from it
- `isTransitionFromPrevious: false` = We didn't just arrive here
- Shows which edges are clickable

### Step 5: Test Hierarchical Example (Checkout)

Load http://localhost:4321/matchina/examples/checkout

Should see:
```
🔍 [HSM] Updating active state highlighting
  currentState: Payment.Authorized (type: string)
  comparing against 7 nodes
  Payment.Authorized: isActive=true (was false)
  ...
```

**Critical for HSM:**
- ✅ currentState includes dot: "Payment.Authorized" (not "Authorized")
- ✅ Node IDs also have dots
- ✅ Exact match happens

**If you see:**
- ❌ `currentState: Authorized` (missing "Payment.")
- ❌ But nodes are "Payment.Authorized"
- ❌ Then highlighting won't work

## Expected Console Flow

### Toggle Example

```
// Page loads
🔍 [HSM] Updating active state highlighting
  currentState: On (type: string)
  comparing against 2 nodes
  On: isActive=true (was false)

// User clicks
(state change in machine)

// Update fires
🔍 [HSM] Updating active state highlighting
  currentState: Off (type: string)
  comparing against 2 nodes
  Off: isActive=true (was false)
  On: isActive=false (was true)

🔍 [edges] State comparison: {
  currentState: "Off",
  transitionFrom: "Off",
  transitionTo: "On",
  isPossibleExit: true,
  isTransitionFromPrevious: false
}

// Visual change: Off node highlights, On node unhighlights
```

### Checkout Example (HSM)

```
// Page loads
🔍 [HSM] Updating active state highlighting
  currentState: Payment.Authorized (type: string)
  comparing against 7 nodes
  Payment.Authorized: isActive=true (was false)
  Payment.Pending: isActive=false (was false)
  (... other nodes ...)

// User clicks to change state
🔍 [HSM] Updating active state highlighting
  currentState: Payment.Processing (type: string)
  comparing against 7 nodes
  Payment.Processing: isActive=true (was false)
  Payment.Authorized: isActive=false (was true)
  (... other nodes ...)
```

## Debugging Scenarios

### ✅ Everything Works

- [x] currentState is a string
- [x] currentState is full path (e.g., "Payment.Authorized" not "Authorized")
- [x] Node IDs match currentState format
- [x] isActive toggles correctly on state changes
- [x] Visual highlighting follows isActive
- [x] Edge highlighting shows isPossibleExit correctly

**Result: Phase 3 Complete ✅**

### ⚠️ Partial Working

**If currentState is undefined:**
```
currentState: undefined (type: undefined)
```

Issue: State subscription not working
- Check if useMachine(machine) is being called
- Check if machine.getState() works
- Verify currentChange is passed correctly from parent

**Fix**: Debug state subscription in parent component

---

**If nodes have correct isActive but no visual change:**
```
On: isActive=true (was false)  // Logging shows it changed
// BUT: Visual highlighting doesn't change on canvas
```

Issue: React component not re-rendering
- Check CustomNode component reads node.data.isActive
- Check styling is using isActive
- Might need to add React key or dependency

**Fix**: Check CustomNode rendering logic

---

**If currentState is leaf name, not full path (HSM only):**
```
currentState: "Authorized" (type: string)
// But nodes are: "Payment.Authorized"
```

Issue: HSM state path not being tracked correctly
- Check useMachine is getting full state path
- Check machine.getState()?.key vs shape understanding
- Wrapper component might not be passing full path

**Fix**: Ensure shape.states keys are being used (full paths)

### ❌ Not Working

**If currentState is never updated:**
```
🔍 [HSM] Updating active state highlighting
  currentState: On (type: string)
  
// Click state change
(nothing happens, no new logs)
```

Issue: updateNodeStates isn't being called
- Check useEffect that calls updateNodeStates
- Check currentState dependency in useEffect
- Subscription might be broken

**Fix**: Verify useMachine(machine) is working

---

**If all nodes have isActive=false:**
```
On: isActive=false (was false)
Off: isActive=false (was false)
```

Issue: currentState never matches any node id
- Check node id format vs currentState format
- Check if node IDs are being generated correctly
- Might be case sensitivity issue

**Fix**: Check node id generation in useStateMachineNodes initialization

## State Format Validation

### For Flat Machines (Toggle, RPS)

Node IDs should be:
- "On", "Off" (simple names)
- Lowercase or as defined

currentState should be:
- "On", "Off" (exact match)

Check:
```
🔍 [HSM] Updating active state highlighting
  currentState: On (type: string)
  On: isActive=true  // MATCH!
```

### For Hierarchical Machines (Checkout)

Node IDs should be:
- "Payment.Authorized" (with dots, full path)
- "Payment.Processing" (compound key)

currentState should be:
- "Payment.Authorized" (same format)
- "Payment.Processing" (same format)

Check:
```
🔍 [HSM] Updating active state highlighting
  currentState: Payment.Authorized (type: string)
  Payment.Authorized: isActive=true  // MATCH!
```

**WRONG:**
```
currentState: Authorized (missing "Payment.")
// Won't match "Payment.Authorized"
```

## Edge Highlighting Details

The logs show:
```
isPossibleExit: true   // Current state can trigger this transition
isPossibleExit: false  // Current state cannot (shouldn't be clickable)
isTransitionFromPrevious: true   // We just arrived via this transition
isTransitionFromPrevious: false  // Not the path we took
```

These control:
- Edge color: Blue if possible exit, light if not
- Edge opacity: Higher if possible, lower if not
- Edge clickability: Only if isPossibleExit
- Edge animation: Dashed if just happened

If edges aren't styled correctly but logging is, the issue is in edge styling CSS, not state comparison.

## Cleanup Plan

Once highlighting works:
- Remove console.log statements
- Keep the isActive/isPrevious logic
- Verify visual styling still works

## Next Steps

1. **If everything works**: Phase 3 complete, begin Phase 4-5 (wait for parallel agents)
2. **If state format wrong**: Fix useMachine subscription or state path tracking
3. **If nodes not rendering**: Check CustomNode component
4. **If edges not styled**: Check edge styling CSS in useStateMachineEdges
