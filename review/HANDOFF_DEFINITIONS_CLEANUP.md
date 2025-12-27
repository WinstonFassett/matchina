# Handoff: Shape-Only Visualization - Obliterate Definitions

**Session Status:** 85% capacity - Handing off critical cleanup work

## What Happened

Shape store implementation revealed a critical design flaw:
- **Visualization still has definition fallback** (`buildDefinition()`)
- **Combobox example breaks** because it uses `matchina()` directly instead of `createMachineFromFlat()`
- **No shape property** → falls back to introspection → treats "Active.Empty" as top-level state
- **Result:** flat list, no hierarchy, no transitions

## Design Decision

**OBLITERATE DEFINITIONS FROM VISUALIZATION FOREVER**

The definition experiment failed. Visualization now works on **shapes only**.

## Critical Work for Next Session

### 1. Delete All Definition Code ⚠️
File: `docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts`

Delete entirely:
- `buildDefinition()` function (lines 58-206)
- `buildDefinitionFromOriginal()` - if it exists
- All introspection logic
- All submachine discovery via runtime walking

Keep ONLY:
- `buildDefinitionFromShape()` - rename to `buildVisualizerTree()`
- Remove "definition" terminology - it's a tree for rendering

### 2. Auto-Attach Shapes in `matchina()`
File: `src/factory-machine.ts` or `src/matchbox-factory.ts`

When creating a machine with flat state keys (containing dots):
```typescript
if (hasDotsInStateKeys(states)) {
  machine.shape = createStaticShapeStore(machine);
}
```

This auto-detects flat machines and gives them shapes without requiring `createMachineFromFlat()`

### 3. Update `getXStateDefinition()` → `buildVisualizerTree()`
File: `docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts`

```typescript
export function buildVisualizerTree(machine: FactoryMachine<any>) {
  const shape = (machine as any).shape?.getState();
  if (!shape) {
    throw new Error('Machine must have a shape for visualization');
  }
  return buildDefinitionFromShape(shape, machine);
}
```

No fallback. No introspection. Shape or nothing.

### 4. Update All Imports
- SketchInspector.tsx imports `getXStateDefinition`
- Update to `buildVisualizerTree`
- Remove any definition references in comments

### 5. Update Combobox Examples
Files:
- `docs/src/code/examples/hsm-combobox/machine-flat.ts`
- `docs/src/code/examples/hsm-checkout/machine-flat.ts`
- Any other flat example

Either:
- Option A: Change `matchina()` calls to `createMachineFromFlat()` (needs def restructuring)
- Option B: Let auto-attach handle it (cleaner, requires option 2 above)

Option B is simpler - just make sure auto-attach works.

## Open Tickets

**matchina-03v** (in_progress)
- Shape store implementation + definition cleanup
- BLOCKED on this work

**matchina-bbd** (in_progress)  
- Design decision documented
- Will close when cleanup done

**matchina-edz** (open, P0)
- Combobox viz broken
- Will auto-fix by cleanup work

## Success Criteria

After cleanup:
1. `getXStateDefinition()` removed or renamed
2. `buildDefinition()` completely deleted
3. `matchina()` auto-attaches shape for flat state keys
4. Combobox viz shows proper hierarchy + transitions
5. All 143 tests still pass
6. No "definition" terminology in visualization code

## Files to Change

```
✗ docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts
  - DELETE buildDefinition() 
  - RENAME getXStateDefinition() → buildVisualizerTree()
  - Keep buildDefinitionFromShape() (rename it too if needed)

✓ src/factory-machine.ts or src/matchbox-factory.ts
  - ADD shape auto-detect for flat keys

✓ docs/src/components/inspectors/SketchInspector.tsx
  - Update import from getXStateDefinition → buildVisualizerTree

✓ test files
  - Update any imports
  - Update any tests that reference definitions
```

## Why This Matters

Currently: **Shape + Definition = confusion**
After cleanup: **Shape = single source of truth for viz**

This fixes the combobox bug AND creates a clean architecture.

---

**READY FOR NEXT SESSION** - All context documented, ready to execute cleanup.
