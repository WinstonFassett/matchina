# Hierarchical State Machines R5 Code Review

**Branch:** `hierarchical-machines-with-viz-r5`
**Reviewer:** Claude (via Happy)
**Date:** 2025-12-22
**Comparison:** Against `main` branch

## Executive Summary

This branch adds hierarchical state machine support to Matchina. The implementation includes:
- Core propagation system (~409 lines in propagateSubmachines.ts)
- Definition and flattening utilities (~432 lines total)
- 23 HSM-specific test files
- 3 working examples (checkout, searchbar, nested-vs-flattened)
- Visualization components for hierarchical machines

**Key Concerns:**
1. **Complexity vs. Utility** - Core propagation system is very complex for what it achieves
2. **API Surface** - Too many ways to define hierarchical machines (confusing)
3. **Integration Gap** - React integration doesn't auto-subscribe to child machines
4. **Documentation** - 16+ working docs to delete, design docs need consolidation

---

## Implementation Review

### Core Files Added

#### `src/nesting/propagateSubmachines.ts` (409 lines)
**Purpose:** Core hierarchical event propagation system

**Concerns:**
- Very large monolithic file with complex control flow
- Multiple responsibilities: hooking, stamping, routing, bubbling
- Internal notification system with `_internal` flags feels hacky
- Hook installation on discovered machines could be simpler
- "Stamping" system (depth, nested.fullKey, stack) adds overhead

**What it does:**
1. Wraps a root machine to intercept all `send()` calls
2. Traverses hierarchy depth-first to handle events at deepest child first
3. Bubbles unhandled events up to parent
4. Synthesizes `child.exit` events when child reaches final state
5. "Stamps" states with hierarchical metadata (depth, fullKey, stack)
6. Routes child events back through root to maintain single event loop

**Questions:**
- Is the stamping system necessary? Could visualization tools traverse on-demand instead?
- Could event routing be simplified without `_internal` flags?
- Is the child-first traversal always desired, or should it be configurable?

**Example usage pattern:**
```typescript
const machine = createMachine(states, transitions, initial);
const hierarchical = createHierarchicalMachine(machine);
// Now events route through hierarchy automatically
```

#### `src/definitions.ts` (310 lines) & `src/definition-types.ts` (122 lines)
**Purpose:** Machine definition utilities and flattening support

**Concerns:**
- Two different APIs: `defineMachine()` and the existing `matchina()` / `createMachine()`
- Flattening system is marked EXPERIMENTAL with known type inference limitations
- Complex type gymnastics for extracting nested machine definitions
- `flattenFromRaw()` has significant implementation complexity

**What it does:**
1. `defineMachine(states, transitions, initial)` - Creates a definition object with `.factory()` method
2. `flattenMachineDefinition(def)` - Converts nested machine to flat state keys (e.g., "Parent.Child")
3. `defineSubmachine(states, transitions, initial)` - Wraps definition for nesting

**Questions:**
- Why not enhance existing `createMachine()` instead of adding `defineMachine()`?
- Is flattening actually used in any examples? If not, should it be removed?
- The docs mention "schema-based" patterns - is this different from runtime machines?

#### `src/nesting/submachine.ts` (19 lines)
**Purpose:** Helper to declare nested machines in state definitions

**Clean and simple.** Good use of the library's existing patterns.

```typescript
const states = defineStates({
  Parent: submachine(createChildMachine, { id: "child" })
});
```

**Note:** The `machineFactory` property (line 10) is attached for visualization without calling the factory. This is clever but feels like a side channel.

#### `src/nesting/types.ts` (46 lines)
**Purpose:** Type helpers for hierarchical machines

**Mostly good.** Provides useful type utilities:
- `StatesOf<M>` - Extract state keys from machine
- `EventsOf<M, K>` - Extract events for a given state
- `ChildOf<M, K>` - Extract child machine from state
- `ActiveEvents<M, K>` - Union of parent + child events
- `sendWhen()` - Type-safe send with state-specific events

**Question:** Is `sendWhen()` actually used anywhere? Seems like extra API surface.

#### `src/nesting/readHierarchicalFullKey.ts` (32 lines)
**Simple utility.** Walks state chain to build "Parent.Child.GrandChild" key.

### Core Files Modified

#### `src/factory-machine.ts`
**Changes:**
1. Added machine reference to event creation (for hierarchical context)
2. Added `initialKey` property for inspection
3. Added machine branding via `brandFactoryMachine()`
4. Added support for "inspectable transition format": `{ to: key, handle?: fn }`

**Concerns:**
- The "inspectable transition format" (lines diff +160-185) adds another way to define transitions
- Not clear if this is used in practice or just for visualization
- The `machine` reference in events might create circular references (check memory leaks?)

---

## Test Coverage Review

### Test Organization
23 HSM-specific test files, **2,349 total lines** of test code covering:
- **Core functionality** (hsm.nested.test.ts - 72 lines, hsm.simple-child-exit.test.ts - 57 lines)
- **Propagation** (hsm.comprehensive-propagation.test.ts - 142 lines, hsm.child-non-exit-propagation.test.ts - 153 lines)
- **Context propagation** (hsm.context-propagation.test.ts - 202 lines, hsm.simplified-3level.test.ts - 259 lines)
- **Edge cases** (hsm.infinite-depth.test.ts - 86 lines, hsm.routing-unhandled.test.ts - 58 lines)
- **React integration** (hsm.react-change-detection.test.ts - 118 lines)
- **Type ergonomics** (hsm.types-ergonomics.test.ts - 78 lines, hsm.types-facade-only.test.ts - 52 lines)
- **Flattening** (hsm.flattened.traffic-light.test.ts - 50 lines, flatten.types.ts)

### Deep Dive: Comprehensive Propagation Test

From `hsm.comprehensive-propagation.test.ts`:
```typescript
// 3-level hierarchy: Root -> Checkout -> Payment
it("multilevel machine: top/middle/bottom sends with correct fullKey propagation", () => {
  const root = createRoot();
  propagateSubmachines(root);
  const rootCalls = vi.fn();
  root.subscribe(rootCalls);

  // Verifies stamping system:
  expect(root.getState().depth).toBe(0);
  expect(root.getState().nested.fullKey).toBe("Checkout.Cart");
  expect(checkout.getState().depth).toBe(1);
  expect(payment.getState().depth).toBe(2);

  // All states share same nested instance
  expect(checkout.getState().nested).toBe(root.getState().nested);
  expect(payment.getState().nested).toBe(root.getState().nested);

  // Verifies stack contains all active states
  const stack = root.getState().nested.stack;
  expect(stack).toHaveLength(3);
  expect(stack[0].key).toBe("Checkout");
  expect(stack[1].key).toBe("Payment");
  expect(stack[2].key).toBe("Authorizing");
});
```

**What this confirms:**
1. **Stamping system is a core feature** - depth, nested.fullKey, stack are tested extensively
2. **Shared nested instance** - All states in hierarchy reference same object
3. **Subscription notifications** - Every child send triggers root subscriber
4. **Child.exit propagation** - Final states trigger parent transitions

### Traffic Light Test Pattern

From `hsm.traffic-light.test.ts`:
```typescript
const states = defineStates({
  Working: submachine(() => createMachine(
    lightStates,
    { Red: { tick: "Green" }, Green: { tick: "Yellow" }, Yellow: { tick: "Red" } },
    "Red"
  ))
});

hierarchical.send("tick"); // Routes to child
expect(childAfterFirst?.getState().key).toBe("Green");
```

**Simple and clean** - Shows basic child-first routing works.

### Test Quality Assessment

**Good:**
- Comprehensive coverage of propagation mechanics
- Tests verify stamping, bubbling, child.exit behavior
- Edge cases covered (infinite depth guard, unhandled routing)
- React integration tested

**Concerns:**
- **No performance tests** - What's the overhead of propagation?
- **No memory leak tests** - Circular references between machine and events?
- **Limited stress testing** - Deepest test is 3 levels, could test 10+ levels
- **Multiple similar tests** - Some redundancy between test files

---

## Examples Review

### `hsm-checkout/` - Clean and straightforward

**Good:**
- Clear separation: payment submachine handles auth, parent handles checkout flow
- Uses `child.exit` event to transition from Payment → Review
- Good use of `final: true` in Authorized state

**API Usage:**
```typescript
const paymentDef = defineMachine(paymentStates, transitions, "MethodEntry");
const createPayment = paymentDef.factory;
const paymentFactory = submachine(createPayment, { id: "payment" });

const checkoutStates = defineStates({
  Payment: paymentFactory,
  // ...
});

const checkout = createMachine(checkoutStates, transitions, "Cart");
const hierarchical = createHierarchicalMachine(checkout);
```

**Issue:** Requires understanding 4 different functions:
1. `defineMachine()` - for visualization
2. `.factory` - to get instance creator
3. `submachine()` - to wrap for nesting
4. `createHierarchicalMachine()` - to enable propagation

This is a lot of ceremony for a simple nested machine.

### `hsm-searchbar/` - Complex and concerning

**Issues:**
1. **Manual child subscription**: View must call `useMachine(fetcherMachine)` for nested promise machine
2. **Complex data extraction**: child.exit handler (lines 107-135) manually extracts data from event
3. **Debug cruft**: Many console.log statements throughout
4. **API confusion**: Uses both `defineMachine()` for visualization AND `matchina()` for runtime
5. **Dual definitions**: `activeDef` and `createActiveMachine()` seem redundant

**From machine.ts:**
```typescript
// Define for visualization
const activeDef = defineMachine(activeStates, transitions, "Empty");

// Create for runtime
function createActiveMachine({onDone}) {
  const active = matchina(activeStates, {
    // ... different transitions here ...
  }, activeStates.Empty(""));
  return active;
}

// Attach .def for visualization
createActiveMachine.def = activeDef;

// Wrap with submachine
const activeMachineFactory = submachine(createActiveForApp, { id: "active" });
```

**This is overwrought.** The lib should make this simpler, not require this much ceremony.

**From View.tsx:**
```typescript
const fetcherMachine = state.is("Query") ? state.data.machine : undefined;
useMachineMaybe(fetcherMachine); // Manual subscription to child!
```

The React integration should automatically subscribe to child machines. Users shouldn't need this.

### `hsm-nested-vs-flattened/` - Comparison example

**Purpose:** Show nested vs flattened approaches to same machine

**Useful for documentation** but highlights that there are now two ways to do the same thing.

**Question:** When should users choose nested vs flattened? The example doesn't make this clear.

---

## Modified Core Files Analysis

### `src/factory-machine.ts`
**Changes:**
1. **Event machine reference** - Events now hold reference to their machine
   ```typescript
   new FactoryMachineEventImpl(type, from, to, params, machine)
   ```
   **Concern:** Circular reference - events reference machine, machine holds lastChange event. Memory leak?

2. **Machine branding** - Added `brandFactoryMachine(machine)` for type guards
   **Good:** Enables robust `isFactoryMachine()` checks

3. **Initial key exposure** - `machine.initialKey` for inspection
   **Fine:** Duck-typed, non-breaking

4. **Inspectable transition format** - New syntax: `{ to: key, handle?: fn }`
   ```typescript
   {
     MethodEntry: {
       authorize: { to: "Authorizing", handle: (cardNum) => [cardNum] }
     }
   }
   ```
   **Question:** Is this actually used in any examples? Or just for visualization?
   **Finding:** Not used in examples reviewed - appears to be dead code

### `src/factory-machine-types.ts`
**Changes:**
1. **NormalizeParams helper** - Fixes zero-arg event type issues
   **Good:** Type-level fix for edge case

2. **getState() override** - Returns strongly-typed `FactoryKeyedState<FC["states"]>`
   **Good:** Better type inference

3. **New transition format type** - Adds `{ to: keyof SF; handle?: fn }` to union
   **Issue:** Increases complexity without clear usage

### `src/integrations/react.ts`
**Changes:**
1. **Added `useMachineMaybe()`** - Handles optional machines
   ```typescript
   const child = state.data?.machine;
   useMachineMaybe(child); // Doesn't throw if undefined
   ```
   **Good:** Type-safe undefined handling

2. **Original `useMachine()` preserved** - Strict variant that throws on undefined
   **Good:** Backward compatible

**Missing:** Auto-subscription to child machines in hierarchy. Users still must manually call `useMachine()` for each nested level.

### Other Modified Files
- `src/factory-machine-event.ts` - Event now holds machine reference
- `src/state-machine-hooks.ts` - Hook system extended for hierarchical
- `src/store-machine.ts` - Store branding added
- Various lifecycle/hook files - Minor updates for compatibility

### Unused Code Found
**`src/devtools/`** - 2 files, ~40 lines total
- `devtools-adapter.ts` - Normalizes machine API for devtools
- `devtoolsBridge.ts` - Bridge for devtools integration

**Finding:** Not imported/exported anywhere. Not used in examples or tests.
**Recommendation:** Remove or mark as experimental

---

## Working Docs Cleanup Catalog

### DELETE Immediately (16 files)

**Design iterations (obsolete):**
- `HIERARCHICAL_MACHINES_R3_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md`
- `HIERARCHICAL_MACHINES_R3.1_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md`
- `HIERARCHICAL_MACHINES_R3.2_FUCKING_PROPAGATION_OF_NEW_DESCENDANTS_DESIGN_FUCKING_FAIL.md`
- `HIERARCHICAL_MACHINES_R3.3_FUCKING_PROPAGATION_TECH_DESIGN.md`
- `HIERARCHICAL_MACHINES_R3.4_PROPAGATION_OF_NEW_DESCENDANTS_TECH_DESIGN.md`
- `HIERARCHICAL_MACHINES_R2_DESIGN.md`

**Progress tracking (obsolete):**
- `HIERARCHICAL_MACHINES_PROGRESS.md`
- `HIERARCHICAL_MACHINE_VIZ_PROGRESS.md`
- `PROPAGATION_REFACTOR_TODO.md`

**Session notes (obsolete):**
- `FUCKED_SESSION.md`
- `FUCKERY.md`
- `HSMDiagramStability_Session_2025-09-01.md`

**Task docs (obsolete):**
- `TASK.md`
- `HIERARCHICAL_MACHINE_VIZ_TASK.md`

**Debug/audit (obsolete):**
- `CASTING_AUDIT.md`
- `debug-propagation.js`

### EVALUATE for docs/ (8 files)
May contain useful content to extract:
- `HIERARCHICAL_MACHINES_DESIGN.md` - Original design doc
- `HIERARCHICAL_MACHINES_IMPLEMENTATION.md` - Implementation notes
- `HIERARCHICAL_MACHINES_DEMOS.md` - Demo notes
- `HIERARCHICAL_MACHINE_VIZ_DESIGN.md` - Viz design
- `HIERARCHICAL_MACHINES_R2_CODE_REVIEW.md` - Previous review
- `hsm-routing-design.md` - Routing design
- `FlatteningDefinitions.md` - Flattening notes
- `PRINCIPALS_FOR_HIERARCHICAL_MACHINES.md` - Principles (**typo:** should be PRINCIPLES)

### KEEP in root (7 files)
- `AGENTS.md` - Active (referenced in CLAUDE.md)
- `BRANCH.md` - Active branch notes
- `GOTCHAS.md` - Active gotchas
- `REVIEW.md` - Active review notes
- `CLAUDE.md` - Active (project instructions)
- `README.md` - Active (main readme)
- `CHANGELOG.md` - Active (changelog)

---

## Key Findings & Recommendations

### 1. Core Propagation System is Overwrought

**Current:** 409 lines in `propagateSubmachines.ts` with:
- Event hooking system with send interception
- State stamping system (depth, nested.fullKey, stack)
- Child-first traversal with bubbling
- Exit event synthesis
- Internal routing flags (`_internal`)
- Circular machine/event references

**Issues:**
- **Complexity** - Very difficult to understand/maintain
- **Performance** - Overhead of hooking, stamping, routing on every event
- **Memory** - Circular references (machine → event → machine)
- **Invasive** - Mutates states with depth/nested/stack properties

**Questions for user:**
- Is the stamping system (depth, nested.fullKey, stack) actually necessary?
- Could visualization traverse on-demand instead of pre-computing?
- Could this be simplified to just event routing without all the metadata?

**Recommendation:** Consider refactoring to minimal viable version:
1. Event routing (child-first, bubble up) - **core feature**
2. Child.exit synthesis - **core feature**
3. **Remove:** Stamping system (defer to visualization tools)
4. **Remove:** `_internal` flags (simplify routing logic)

### 2. Too Many APIs for Machine Definition

Users face:
1. `createMachine(states, transitions, initial)` - original ✅ **KEEP**
2. `matchina(states, transitions, initial)` - alias ✅ **KEEP** (popular)
3. `defineMachine(states, transitions, initial)` - returns def object ❓ **EVALUATE**
4. `createMachineFrom(def)` - creates from def ❓ **REDUNDANT?**
5. `flattenMachineDefinition(def)` - flattens nested ❓ **USED?**
6. `submachine(factory, {id})` - wraps for nesting ✅ **KEEP**
7. `createHierarchicalMachine(machine)` - enables propagation ✅ **KEEP**

**Findings:**
- `defineMachine()` / `createMachineFrom()` only used for visualization `.def` attachment
- `flattenMachineDefinition()` marked EXPERIMENTAL, not used in examples
- "Inspectable transition format" `{to, handle}` not used anywhere

**Recommendations:**
1. **Remove or deprecate:** Inspectable transition format (dead code)
2. **Document clearly:** When to use `defineMachine()` vs `createMachine()`
3. **Consider removing:** Flattening if not actually used
4. **Simplify:** Visualization pattern (shouldn't require dual definitions)

### 3. React Integration Gap

**Current:** Users manually subscribe to each nested machine:
```typescript
// In searchbar example:
const fetcherMachine = state.is("Query") ? state.data.machine : undefined;
useMachineMaybe(fetcherMachine); // Manual!
```

**Expected:** `useMachine(parent)` auto-subscribes to entire hierarchy.

**Why it matters:** The propagation system already routes all child events through root and notifies root subscribers. React integration should leverage this.

**Recommendation:** Enhance `useMachine()` to auto-subscribe to hierarchy:
```typescript
// Proposed:
useMachine(hierarchicalMachine); // Automatically re-renders on any child change
// No need to manually subscribe to nested machines
```

### 4. Examples Show Complexity, Not Simplicity

**Checkout example:** ✅ Clean usage pattern
- 97 lines total
- Clear separation of concerns
- Good use of `child.exit`

**Searchbar example:** ❌ Overcomplicated
- 206 lines in machine.ts
- Dual definitions (runtime + visualization)
- Manual data extraction in `child.exit` handler (lines 107-135)
- Debug console.logs throughout
- Manual child subscription in View

**What this reveals:** The library isn't making hierarchical machines easy enough. Users are fighting the API.

**Recommendation:** Simplify the searchbar example or replace it with something that shows the library helping, not hindering.

### 5. Unused/Dead Code

**Found:**
- `src/devtools/` - 2 files, not imported anywhere
- Inspectable transition format - type support but no usage
- Multiple test files with similar coverage

**Recommendation:** Remove dead code before merge.

### 6. Working Docs Clutter

**16 files to delete** - Session notes, design iterations, debug scripts

**Recommendation:** Delete immediately (in git history if needed).

---

## Overall Assessment

### What Works Well

1. **Core concept** - Hierarchical state machines solve real problems
2. **Child-first routing** - Sensible default behavior
3. **Child.exit events** - Clean pattern for parent transitions
4. **Test coverage** - Comprehensive (2,349 lines of tests)
5. **Checkout example** - Shows clean usage pattern

### What Needs Work

1. **Propagation complexity** - 409 lines for core feature is too much
2. **API proliferation** - Too many ways to define machines
3. **React integration** - Should auto-subscribe to hierarchy
4. **Stamping system** - Adds overhead, questionable value
5. **Searchbar example** - Shows users fighting the API
6. **Dead code** - Devtools, inspectable transitions unused
7. **Documentation** - 16+ working docs to clean up

### Before Merging

**Must Do:**
1. Delete 16 working doc files
2. Remove `src/devtools/` (unused)
3. Remove or document inspectable transition format
4. Simplify or replace searchbar example
5. Fix PRINCIPALS.md typo → PRINCIPLES.md
6. Document when to use each API

**Should Consider:**
1. Refactor propagateSubmachines.ts to remove stamping system
2. Enhance React integration for auto-subscription
3. Remove flattening if not actually needed
4. Consolidate similar test files

**Questions for Maintainer:**
1. Is the stamping system (depth, nested.fullKey, stack) required?
2. Is flattening actually used/needed?
3. Should visualization be separate from core runtime?
4. What's the minimum viable hierarchical machine implementation?

---

## Review Status: COMPLETE

**Completed:**
- ✅ Implementation files cataloged and reviewed
- ✅ Core propagation system analyzed (409 lines)
- ✅ Test coverage reviewed (23 tests, 2,349 lines)
- ✅ Examples reviewed (3/3)
- ✅ Modified core files analyzed
- ✅ Working docs cataloged (16 to delete)
- ✅ Unused code identified (devtools, inspectable transitions)
- ✅ Recommendations written

**Branch Status:** Ready for maintainer review and cleanup decisions.

