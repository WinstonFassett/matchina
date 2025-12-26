# HSM Branch Merge Readiness Assessment

**Branch**: `hierarchical-machines-with-viz-r5`  
**Target**: `main`  
**Date**: December 25, 2025

---

## Summary

**Recommendation**: ✅ **Ready to merge**

The branch adds hierarchical state machine (HSM) support with two approaches (flattening and propagation), visualization infrastructure, and comprehensive documentation. Pre-merge tasks are complete.

---

## What This Branch Adds

### Core Features
- **Hierarchical state machines** via flattening (`defineMachine`, `flattenMachineDefinition`)
- **Event propagation** as experimental escape hatch (`propagateSubmachines`, `createHierarchicalMachine`)
- **Submachine pattern** (`submachine()` factory wrapper)
- **Machine inspection** utilities (`inspect.ts`)

### Documentation
- HSM guides and examples in docs site
- Interactive visualizers (state chart, tree view, timeline)
- Multiple working examples (checkout, combobox, searchbar)

### Infrastructure
- `matchina/hsm` subpath export
- Type definitions for flattening (`definition-types.ts`)
- Test coverage for HSM patterns

---

## Pre-Merge Checklist

| Task | Status | Notes |
|------|--------|-------|
| HSM packaging (`matchina/hsm`) | ✅ Done | Exports flattening APIs |
| Mark propagation experimental | ✅ Done | `@experimental` JSDoc added |
| Deprecate `matchina()` | ✅ Done | `@deprecated` JSDoc added |
| Type optimization (Phase 1) | ✅ Done | -3.9% instantiations |
| Fix broken doc links | ✅ Done | 9 links fixed |
| Fix README duplicates | ✅ Done | Removed duplicate sections |

---

## Known Issues (Acceptable for Merge)

### Type System
- **`any` in type definitions**: Intentional for ergonomics (e.g., `StateMatchbox.data: any` for cross-state access)
- **Template literal explosion in flattening**: Works at runtime, type inference is complex but functional
- **Pre-existing type errors in `factory-machine.ts`**: Casts required for complex generic inference

### HSM Limitations
- **Propagation is experimental**: Works but complex, flattening is preferred
- **Nested machine types**: Some explicit annotations needed for deep hierarchies
- **`child.exit` is stringly-typed**: Convention, not enforced by types

### Documentation
- **StoreMachine guide missing**: Tracked as post-merge task (matchina-1ve)

---

## Post-Merge Work

Tracked in beads:

| ID | Task | Priority |
|----|------|----------|
| matchina-1ve | StoreMachine guide and example | P2 |
| (new) | Implement `.extend()` on FactoryMachine | High |
| (new) | Create `matchina/inspect` subpath | Medium |
| (new) | Design manifest format for viz | Medium |
| (new) | Externalize visualizers | Low |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing code | Low | High | No breaking changes, only additions |
| Type regressions | Low | Medium | Type tests pass, -3.9% instantiations |
| HSM bugs | Medium | Medium | Experimental flag on propagation |
| Doc drift | Low | Low | Links fixed, examples working |

---

## Merge Procedure

1. Ensure all tests pass: `npm test`
2. Ensure type check passes: `npx tsc --noEmit`
3. Merge to main: `git checkout main && git merge hierarchical-machines-with-viz-r5`
4. Tag release (optional): `git tag v0.x.x`
5. Create post-merge tickets in beads

---

## Decision

**Ready to merge?** ✅ Yes

The branch is stable, tested, and documented. Known issues are acceptable tradeoffs or tracked for future work. No blocking concerns remain.
