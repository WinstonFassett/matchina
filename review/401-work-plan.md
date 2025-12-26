# Matchina Work Plan

**Branch**: `hierarchical-machines-with-viz-r5`  
**Status**: Design complete, ready for implementation planning

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Manifest format | XState-compatible shape |
| `matchina()` | Deprecate but keep for now |
| HSM approach | Flattening primary, propagation as experimental escape hatch |
| `.extend()` | Returns `this & ReturnType<fn>` (post-merge) |

---

## Pre-Merge Work (This Branch)

Tasks that should be completed before merging `hierarchical-machines-with-viz-r5` to `main`.

### Must Do ✅ COMPLETE

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1 | **HSM packaging** | Export flattening from `matchina/hsm`, mark propagation experimental | ✅ Done (matchina-fkw) |
| 2 | **Mark propagation experimental** | Add `@experimental` JSDoc, update docs | ✅ Done (matchina-ayj) |
| 3 | **Deprecate `matchina()`** | Add `@deprecated` JSDoc pointing to `createMachine().extend(withEventApi)` | ✅ Done (matchina-r1d) |

### Should Do

| # | Task | Description | Status |
|---|------|-------------|--------|
| 4 | **Audit new type definitions** | Check `definition-types.ts` and related for `any` usage (created in this branch) | Open (matchina-qcq) |

### Could Do (If Time)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 5 | **Fix doc links created in this branch** | Only fix links broken by changes in this branch | Open (matchina-2yn) |

---

## Post-Merge Work (After Branch Merged to Main)

Tasks that depend on merged HSM or are independent improvements.

### API Improvements

| Task | Description | Priority |
|------|-------------|----------|
| **Implement `.extend()` on FactoryMachine** | Add `extend<T>(fn: (m) => T): this & T` method with proper generics | High |
| **Create `withEventApi` extension** | Refactor `assignEventApi` to work with `.extend()` | High |
| **Full `matchina()` removal** | After `.extend()` is stable and documented | Low |

### Visualization / Inspection

| Task | Description | Priority |
|------|-------------|----------|
| **Create `matchina/inspect`** | Move inspection utilities, add `getManifest()` | Medium |
| **Design manifest format** | XState-compatible `MachineManifest` interface | Medium |
| **Externalize visualizers** | Move from docs to separate package(s) | Low |

### Type System

| Task | Description | Priority |
|------|-------------|----------|
| **Run TypeSlayer analysis** | Identify type performance bottlenecks | Medium |
| **Fix `any` in type definitions** | Replace with proper types or `unknown` | Medium |
| **Improve flattening type inference** | If TypeSlayer reveals issues | Low |

### Documentation

| Task | Description | Priority |
|------|-------------|----------|
| **Document `.extend()` pattern** | README, docs site examples | High |
| **HSM documentation** | Emphasize flattening, document propagation as escape hatch | Medium |
| **Manifest/viz documentation** | How to use `getManifest()` with visualizers | Low |

---

## Pre-Merge Ticket Details

Ready to create as beads tickets:

### Ticket 1: HSM Packaging

**Goal**: Export HSM APIs from `matchina/hsm` subpath

**Tasks**:
- Create/update `matchina/hsm` entry point
- Export flattening APIs: `flattenMachineDefinition`, `defineSubmachine`, `defineMachine`
- Export propagation APIs with experimental marker
- Verify tree-shaking works (only pull in what's imported)

**Acceptance**: 
- `import { flattenMachineDefinition } from 'matchina/hsm'` works
- Propagation doesn't get bundled if not imported

---

### Ticket 2: Mark Propagation Experimental

**Goal**: Clear signaling that propagation is escape hatch, not primary

**Tasks**:
- Add `@experimental` JSDoc to `propagateSubmachines`, `createHierarchicalMachine`
- Update any docs referencing propagation
- Consider console warning on first use (optional)

**Acceptance**:
- IDE shows experimental warning
- Docs clearly state flattening is primary approach

---

### Ticket 3: Deprecate matchina()

**Goal**: Signal migration path to `.extend()` pattern

**Tasks**:
- Add `@deprecated` JSDoc to `matchina()` function
- Add deprecation message pointing to `createMachine(...).extend(withEventApi)`
- Keep function working (no breaking change)

**Acceptance**:
- IDE shows deprecation warning
- Function still works

---

### Ticket 4: Audit New Type Definitions

**Goal**: Document `any` usage in types created by this branch

**Tasks**:
- Check `definition-types.ts` for `any` usage
- Check other type files added/modified in this branch
- Document each instance and proposed fix
- Create post-merge ticket with findings

**Acceptance**:
- List of `any` usages in new types only
- Post-merge ticket created

---

### Ticket 5: Fix Doc Links (Branch Only)

**Goal**: Fix any doc links broken by changes in this branch

**Tasks**:
- Identify links broken by HSM changes
- Fix only those affected by this branch

**Acceptance**:
- No broken links from branch changes
- (Other broken links deferred to post-merge)

---

## Notes

- Pre-merge work is scoped to **this branch** (`hierarchical-machines-with-viz-r5`)
- Post-merge work happens on `main` or new feature branches
- `.extend()` implementation is **post-merge** — requires careful type work
- Visualization/manifest work is **post-merge** — depends on stable API
- **Branch merge blocked on tickets 1-3** (must-do items)
- **Post-merge work blocked on branch merge**

---

## Ready for Tickets?

Once this plan is approved, create beads tickets for pre-merge items 1-5.
