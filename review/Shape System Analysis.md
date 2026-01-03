# Shape System Analysis: Confusion and Clarification

## The Problem

The visualizers (`ReactFlowInspector`, `ForceGraphInspector`, `SketchInspector`) all require machines to have a `.shape` property with a `.getState()` method. However, not all machines created with `createMachine()` had this property, causing visualizer rendering to fail.

## Current State Before Fix

### When `.shape` is attached:

1. **`createFlatMachine()`** (src/hsm/flat-machine.ts:56)
   - Always attaches `.shape = createStaticShapeStore(machine)`
   - Used for flat machines with optional enhancements

2. **`createMachine()` with hierarchical keys** (src/factory-machine.ts:114-130)
   - Only attached `.shape` if state keys contain dots (`.`)
   - Condition: `stateKeys.some(key => key.includes('.'))`
   - Why? Unclear - possibly thought only hierarchical machines need visualization

3. **`propagateSubmachines()`** (src/hsm/propagateSubmachines.ts:115, 135)
   - Attaches `.shape = createLazyShapeStore()` for HSM machines

### When `.shape` is NOT attached:
- Any flat machine created with `createMachine()` directly WITHOUT dot-notation keys
- Examples: toggle, RPS, counter (all have simple state names like "On", "Off", not "Parent.Child")

## The Discovery

All example machines (toggle, RPS, counter) use `createMachine()` with simple state names and never got `.shape` attached. This caused:
- ReactFlow visualizer: No nodes/edges render
- ForceGraph visualizer: No diagram
- Force visualization to fail completely

## The Proposed Fix

Change `createMachine()` to ALWAYS attach `.shape`, not just for hierarchical machines:

```typescript
// OLD: Only if hierarchical
const hasFlatKeys = stateKeys.some(key => key.includes('.'));
if (hasFlatKeys) {
  // attach shape
}

// NEW: Always attach
// attach shape
```

## Critical Questions to Answer

1. **Why was it conditional in the first place?**
   - Performance? No clear evidence of this in comments
   - Memory usage? Unlikely - shape is tiny
   - Intentional design to only support visualization for HSM? But visualizers support flat machines

2. **Does attaching `.shape` to ALL machines break anything?**
   - `.shape` is non-enumerable, so won't affect `Object.keys()` or JSON serialization
   - `.shape` is configurable and writable, so can be overridden if needed
   - Unclear risk of side effects

3. **Should we document the shape system?**
   - What is `.shape` for?
   - What's the contract for `.shape.getState()`?
   - When should machines have `.shape`?
   - How do different creation patterns (createMachine, createFlatMachine, HSM) differ?

## Recommendation

Before applying the fix broadly, establish:

1. **Document the shape contract** - what is it, what must it provide
2. **Understand the original intent** - why was it conditional?
3. **Validate the fix** - check if attaching shape to all machines has unintended consequences
4. **Update creation patterns** - clarify which API to use when

## Related Files

- **Shape creation**: `src/hsm/shape-store.ts` - `createStaticShapeStore()`, `createLazyShapeStore()`
- **Shape types**: `src/hsm/shape-types.ts` - `ShapeController` interface
- **Machine creation**: `src/factory-machine.ts` - `createMachine()`
- **Flat machines**: `src/hsm/flat-machine.ts` - `createFlatMachine()`
- **Hierarchical**: `src/hsm/propagateSubmachines.ts` - HSM setup
- **Visualizers**: `src/viz/*` - all expect `.shape.getState()`
- **Examples**: `docs/src/code/examples/*/machine.ts` - use `createMachine()` directly

## The Fix Applied

Modified `src/factory-machine.ts` lines 114-130 to:
- **Remove the condition** that only attached `.shape` for hierarchical machines
- **Always attach `.shape`** to all machines created with `createMachine()`
- Use `createStaticShapeStore()` which works for all flat machines

**Result**: All machines (toggle, RPS, counter, etc.) now have `.shape` property with proper structure.

**Validation**:
- ✅ toggle machine: `machine.shape.getState()` returns valid MachineShape
- ✅ RPS machine: `machine.shape.getState()` returns valid MachineShape
- ✅ Non-enumerable property: doesn't affect Object.keys() or JSON serialization
- ✅ Tests pass with shape properly attached

## Next Steps

1. ✅ **Root blocker fixed**: All machines now have `.shape`
2. **Test visualizers**: Verify ReactFlow, ForceGraph, Sketch now work with the fix
3. **Document the contract**: Add comment explaining what `.shape` is for in factory-machine.ts
4. **Review all creation patterns**: Ensure consistency across createMachine, createFlatMachine, HSM
5. **Update shape system docs**: Clarify in code comments when/why shape is needed
