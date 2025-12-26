# Matchina: Work Organization

Branch: `hierarchical-machines-with-viz-r5` (HSM code review)

---

## Pre-Merge (This Branch)

Tasks that should be done before merging HSM r5:

### Must Do

| Task | Rationale |
|------|-----------|
| HSM packaging (`matchina/hsm`) | HSM is this branch's focus |
| Mark propagation as experimental | Flattening primary, propagation escape hatch |
| Implement `.extend()` on FactoryMachine | Foundation for API refactor |
| Refactor `matchina()` to use `.extend()` | Or deprecate in favor of `.extend(withEventApi)` |

### Should Do

| Task | Rationale |
|------|-----------|
| Fix 9 broken doc links | Low effort, high value |
| Remove README duplicates | Low effort cleanup |

### Could Do

| Task | Rationale |
|------|-----------|
| Basic type audit (find `any` in type defs) | Prep for later fix |

---

## Post-Merge

Tasks that depend on merged HSM or are independent:

### Visualization

| Task | Notes |
|------|-------|
| Design manifest format for viz | States, transitions, init, dispatch |
| Reconcile viz with machine creation | How nested machines expose manifest |
| Externalize visualizers from docs | Later, after manifest design |
| Actions with params in viz | Future feature — for now, clicks may no-op if params missing |

### Type System

| Task | Notes |
|------|-------|
| Run TypeSlayer analysis | Needs beads ticket with context |
| Fix `any` in type definitions | Per Decision 3 |
| Improve flattening type inference | If possible |

### API

| Task | Notes |
|------|-------|
| Full `matchina()` deprecation | After `.extend()` is stable |
| Document `.extend()` pattern | README, docs site |

---

## Beads Tickets Needed

### Pre-Merge Tickets

1. **Implement `.extend()` on FactoryMachine**
   - Add `.extend<T>(fn: (m: Machine) => T): T` method
   - Ensure proper TS inference

2. **Refactor `matchina()` to use `.extend()`**
   - Internally: `createMachine(...).extend(withEventApi)`
   - Or deprecate entirely

3. **HSM packaging**
   - Export from `matchina/hsm`
   - Mark propagation as experimental
   - Ensure tree-shaking works

4. **Fix broken doc links**
   - 9 links identified in `105-docs.md`

### Post-Merge Tickets

5. **TypeSlayer analysis**
   - Context: Review findings from `104-types.md`, `304-conversation-notes.md`
   - Goal: Identify type bottlenecks, simplify complex mapped types
   - Independent session

6. **Design viz manifest format**
   - What machines expose for visualization
   - Reconcile with flattening/propagation

7. **Externalize visualizers**
   - Move from docs to `matchina/viz` or separate packages
   - After manifest design

8. **Type definitions audit**
   - Remove `any` from type definitions
   - Replace with proper types or `unknown`

---

## Open Design Questions (Future Sessions)

1. **Manifest format**: What's minimal for viz? XState-compatible or custom?
2. **Nested machine manifest**: How do flattened/propagated machines expose hierarchy?
3. **Actions with params**: Schema-based? Detect and disable? Future feature.

---

## Branch Strategy

```
main
  └── hierarchical-machines-with-viz-r5 (current)
        ├── Pre-merge work here
        └── Merge to main
              └── Post-merge work on main or feature branches
```
