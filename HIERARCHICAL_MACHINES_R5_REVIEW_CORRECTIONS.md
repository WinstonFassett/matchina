# Hierarchical Machines R5 - Review Corrections & Suggestions

**Date:** 2025-12-22
**Context:** Corrections to initial review based on maintainer feedback

---

## What I Got Wrong

### 1. React Notifications ARE Working ✅

**Initial claim:** "React integration gap - users must manually subscribe to child machines"

**Reality:** The propagation system DOES propagate changes up correctly:
- When child transitions, `propagateSubmachines.ts` creates a `child.change` self-transition on parent
- This updates parent's `lastChange` event (lines 371-382)
- React's `useSyncExternalStore` sees new `getChange()` object and re-renders
- Test `hsm.react-change-detection.test.ts` confirms this works

**Clarification needed:** The manual `useMachine(childMachine)` calls in searchbar example are for accessing child state directly in the UI, not for notifications. The parent machine already notifies on child changes.

### 2. Flattening IS Used ✅

**Initial claim:** "Flattening marked EXPERIMENTAL, not used in examples"

**Reality:** Full working example at `/docs/src/content/docs/examples/hsm-nested-vs-flattened.mdx`
- Compares nested submachine vs flattened equivalent
- Demonstrates how flattening can be cleaner than nested + propagation
- `flattenMachineDefinition()` is actively used

**Maintainer note:** "Flattening seemed to work better than nesting and propagating tbh"

---

## Real Issues Confirmed

### 1. Inspection vs Visualization - Keep Stamping Metadata

**Maintainer position:**
- Stamping (depth, fullKey, stack) is useful in UI
- Inspection is important (like other libs should be inspectable)
- An AI invented stamping, but maintainer finds it useful

**Suggestion:** Keep stamping, but consider:

**Option A: Lazy stamping** - Only stamp when accessed
```typescript
// Instead of stamping on every event:
Object.defineProperty(state, 'nested', {
  get() {
    if (!this._nested) {
      this._nested = computeNested(this);
    }
    return this._nested;
  }
});
```

**Option B: Explicit inspection API**
```typescript
// Don't mutate states, provide inspection separately:
const inspector = createInspector(hierarchicalMachine);
inspector.getFullKey(state); // "Parent.Child.GrandChild"
inspector.getDepth(state); // 2
inspector.getStack(); // [parentState, childState, grandChildState]
```

**Trade-off:** Keeps states immutable but adds API surface.

### 2. API Ceremony - Traversable Definitions

**Maintainer position:**
- `defineMachine` vs `createMachine` is about traversable definitions
- Manually attaching `.def` is bad, should have APIs to simplify
- Started as functional TS lib, hard to make declarative at runtime

**Current ceremony:**
```typescript
// For visualization support:
const paymentDef = defineMachine(states, transitions, initial);
const createPayment = paymentDef.factory;
createPayment.def = paymentDef; // Manual attachment

const paymentFactory = submachine(createPayment, {id: "payment"});
```

**Suggestion A: Auto-attach in submachine()**
```typescript
export function submachine<F extends () => any>(
  createChild: F,
  opts?: { id?: string }
) {
  const factory = () => ({
    machine: createChild(),
    ...(opts?.id ? { id: opts.id } : {})
  });

  // Auto-discover and attach definition
  if ((createChild as any).def) {
    (factory as any).machineFactory = createChild;
    (factory as any).def = (createChild as any).def;
  }

  return factory;
}

// Usage becomes:
const createPayment = defineMachine(states, transitions, initial).factory;
const paymentFactory = submachine(createPayment, {id: "payment"});
// No manual .def attachment needed
```

**Suggestion B: Single definition API**
```typescript
// Combine definition + factory creation:
export function defineMachine<...>(states, transitions, initial, opts?: {
  factory?: boolean; // Create factory function
  hierarchical?: boolean; // Auto-wrap with propagation
}) {
  const def = { states, transitions, initial };

  if (opts?.factory) {
    const factory = () => {
      const m = createMachine(states, transitions, initial);
      return opts.hierarchical ? createHierarchicalMachine(m) : m;
    };
    factory.def = def;
    return factory;
  }

  return def;
}

// Usage:
const createPayment = defineMachine(states, transitions, initial, { factory: true });
// .def already attached, ready for submachine()
```

### 3. Remove Dead Code

**Confirmed unused:**
- `src/devtools/` - 2 files, not imported
- Inspectable transition format `{to, handle}` - type support but no usage
- `sendWhen()` in types.ts - experimental?

**Action:** Remove before merge.

### 4. Console.logs in Examples

**Confirmed issue:** searchbar example has debug console.logs throughout

**Action:** Remove them.

---

## Suggestions for Simplification

### 1. Reduce Propagation Complexity Without Losing Features

**Current:** `propagateSubmachines.ts` is 409 lines with:
- Hooking system ✅ (needed for child-first routing)
- Stamping system ✅ (useful for inspection, keep)
- Child.exit synthesis ✅ (core feature)
- `_internal` flags ❓ (feels hacky)

**Simplification idea:**

The `_internal` flag is used to distinguish:
- External `child.change` - route through `handleAtRoot`
- Internal `child.change` - just notify subscribers

Could this be simplified by having two different event types?
- `child.change` - for external routing
- `child.changed` (past tense) - for internal notifications

Or use a symbol instead of `_internal`:
```typescript
const INTERNAL = Symbol('internal');
// payload[INTERNAL] instead of payload._internal
```

### 2. Simplify Nesting Ceremony

**Current flow requires understanding:**
1. `defineMachine()` - for definition
2. `.factory` - to get creator
3. `submachine()` - to wrap
4. `createHierarchicalMachine()` - to enable propagation

**Suggestion:** Reduce to 2 steps:
```typescript
// Step 1: Define with factory
const createPayment = defineMachine(states, transitions, initial, {factory: true});

// Step 2: Use in parent (submachine auto-detects .def)
const checkoutStates = defineStates({
  Payment: submachine(createPayment, {id: "payment"}),
});

// Optional step 3: Enable hierarchical (or make this automatic?)
const checkout = createMachine(checkoutStates, transitions, "Cart");
const hierarchical = createHierarchicalMachine(checkout);
```

**Question:** Should `createMachine()` auto-detect nested machines and enable propagation?
Or keep it explicit with `createHierarchicalMachine()`?

### 3. Fix Searchbar Example

**Issues:**
- Dual definitions (runtime + visualization)
- Complex child.exit handler (lines 107-135)
- Manual data extraction feels brittle

**Root cause:** Promise machine data structure doesn't match expected shape?

**Suggestion:** Review how promise machine data flows into child.exit event. The test fallback suggests the data isn't coming through as expected:
```typescript
const items = data.items || [
  { id: 'test-1', title: 'Test Result 1' }, // Fallback data
  // ...
];
```

This suggests the promise machine's result isn't being passed correctly in the child.exit event.

---

## Concrete Next Steps

### Must Do Before Merge
1. ✅ Delete 16 working doc files (DONE)
2. ✅ Rename PRINCIPALS → PRINCIPLES (DONE)
3. Remove `src/devtools/` (unused)
4. Remove console.logs from searchbar example
5. Remove inspectable transition format or document why it exists
6. Document when to use `defineMachine` vs `createMachine`

### Should Consider
1. Simplify `submachine()` to auto-attach `.def` from factory
2. Replace `_internal` flag with symbol or separate event type
3. Fix searchbar promise machine data flow in child.exit
4. Add API to reduce nesting ceremony (defineMachine with factory option)
5. Consider making hierarchical propagation automatic when submachines detected

### Questions to Answer
1. Should `createMachine()` auto-enable propagation when it detects submachines?
2. Should stamping be lazy (computed on access) or eager (on every event)?
3. Should visualization/inspection be a separate optional import?
4. What's the ideal "hello world" hierarchical machine example?

---

## Minimum Viable Hierarchical Machine

**Core features that must stay:**
1. Child-first event routing with bubbling
2. Child.exit event synthesis
3. Inspection metadata (fullKey, depth, stack) - useful in UI
4. React notification on child changes (already works)

**Could be simplified:**
1. API ceremony (too many steps)
2. `_internal` routing flags
3. Manual `.def` attachment
4. Dual definition patterns in examples

**Should be removed:**
1. Dead code (devtools, inspectable transitions)
2. Console.logs in examples
3. Unused working docs (done)

The implementation is solid, but the DX could be smoother.
