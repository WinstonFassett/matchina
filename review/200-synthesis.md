# Matchina: Synthesis

## What This Library Is Fundamentally About

Matchina is a **TypeScript-first toolkit for type-safe state machines** built on discriminated unions (tagged unions). Its core value proposition:

1. **Type inference over configuration**: States and transitions are inferred from code, not declared in JSON/XML
2. **Composable primitives**: Each piece (matchbox, lifecycle, hooks) works standalone or combined
3. **Nano-sized footprint**: ~3.4 kB full library, individual features 300-600 bytes
4. **Pattern matching**: `.match()`, `.is()`, `.as()` for exhaustive state handling

The library occupies a middle ground between:
- **Simpler**: Redux/Zustand (no state machine semantics)
- **More complex**: XState (full statecharts with parallel regions, history states)

---

## Core Design Invariants

### 1. Matchbox Foundation
All state machines are built on `matchboxFactory`, which creates branded objects with:
- A discriminator property (`key` for states, `tag` for generic matchbox)
- Type-safe `.is()`, `.as()`, `.match()` methods
- Data payload accessible via `.data`

### 2. Lifecycle Pipeline
All machines share the same `EventLifecycle` interface:
```
send → resolveExit → guard → handle → before → update → effect → leave → enter → notify → after
```
Hooks can abort at `guard`, `handle`, or `before` stages.

### 3. Transition Resolution
Transitions can be:
- String shortcut: `"TargetState"` (parameters forwarded)
- Direct function: `(params) => state`
- Curried function: `(params) => (ev) => state`

### 4. Hierarchy via Convention
Child machines are embedded via `state.data.machine` convention, not a dedicated type. This enables flexibility but loses type safety.

---

## High-Risk Areas

### 1. Hierarchical State Machines (Critical)

**Risk Level**: High

**Issues**:
- **Two competing approaches**: Flattening (`definitions.ts`) vs Propagation (`propagateSubmachines.ts`)
- **Convention-based child detection**: `state.data.machine` is not type-enforced
- **Complex propagation logic**: `propagateSubmachines.ts` is 375 lines of recursive descent/bubble logic
- **Type safety gaps**: HSM examples require `any` casts
- **Incomplete exports**: `submachine`, `defineMachine` not exported from main package

**Evidence**:
- Demo examples import directly from `../../../../../src/nesting/submachine`
- Test file `hsm.child-non-exit-propagation.test.ts` is `.skip`ped
- Multiple `as any` casts in `propagateSubmachines.ts`

### 2. Type Complexity (Medium-High)

**Risk Level**: Medium-High

**Issues**:
- `FactoryMachineEvent<FC>` is a double-nested mapped type
- `ExtractEventParams` involves 3-level nesting
- `StateMatchbox.data: any` explicitly loses type safety
- Complex error messages when types don't match

**Evidence**:
- Comment in `state-types.ts`: "Loosen data typing to support cross-state access patterns"
- Multiple `as any` casts in core implementation

### 3. Documentation Drift (Medium)

**Risk Level**: Medium

**Issues**:
- README has duplicate sections
- Broken internal links (9 verified)
- `machines.mdx` references non-existent paths (`/matchina/lifecycle/` etc.)
- Lifecycle diagram doesn't match code (effect calls leave/enter internally)

### 4. API Surface Sprawl (Medium)

**Risk Level**: Medium

**Issues**:
- 5 ways to create a machine: `createMachine`, `matchina`, `createMachineFrom`, `createMachineFromFlat`, `defineMachine`
- 3 ways to register hooks: `setup()`, `transitionHook()`, `onLifecycle()`
- Inconsistent naming: `send` vs `dispatch`, `key` vs `tag`

---

## Acceptable Debt

### 1. StoreMachine Simplicity
StoreMachine is intentionally simpler than FactoryMachine (no matchbox states). This is acceptable as it serves a different use case (simple value stores).

### 2. Promise Machine Fixed States
`createPromiseMachine` has fixed states (Idle/Pending/Resolved/Rejected). This is acceptable as it covers the common async pattern.

### 3. No Parallel Regions
Unlike XState, Matchina doesn't support parallel/orthogonal states. This is acceptable given the "nano-sized" philosophy.

### 4. React-First Examples
All interactive examples use React. This is acceptable as React is the primary integration target.

---

## Dangerous Debt

### 1. HSM Type Safety Gap

**Danger**: Users can't get type-safe child machine access without manual type guards and casts.

**Impact**: 
- Errors at runtime instead of compile time
- Poor IDE experience for HSM users
- Demos require `any` casts

**Recommendation**: Either:
- Add branded types for child machines
- Or clearly document HSM as "escape hatch" with known type limitations

### 2. Implicit Final State Detection

**Danger**: Final states detected by `data.final === true` OR empty transitions object.

**Impact**:
- Users may accidentally create final states
- Behavior differs from documentation (only mentions `data.final`)

**Recommendation**: Pick one mechanism and document it clearly.

### 3. Unexported HSM APIs

**Danger**: `submachine`, `defineMachine`, `createHierarchicalMachine` not properly exported.

**Impact**:
- Demos bypass public API
- Users can't use HSM features without deep imports

**Recommendation**: Export these from `matchina` or create `matchina/hsm` subpath.

### 4. Broken Documentation Links

**Danger**: 9 verified broken links in docs.

**Impact**:
- User frustration
- Perception of unmaintained library

**Recommendation**: Fix links before next release.

---

## Summary Matrix

| Area | Health | Priority |
|------|--------|----------|
| Core state machines | ✅ Good | Maintain |
| Matchbox/pattern matching | ✅ Good | Maintain |
| Lifecycle hooks | ✅ Good | Maintain |
| Promise machines | ✅ Good | Maintain |
| React integration | ✅ Good | Maintain |
| HSM propagation | ⚠️ Risky | Stabilize or deprecate |
| HSM flattening | ⚠️ Risky | Stabilize or deprecate |
| Type definitions | ⚠️ Complex | Simplify where possible |
| Documentation | ⚠️ Drifted | Update and fix links |
| API surface | ⚠️ Sprawling | Consider consolidation |
| StoreMachine | ℹ️ Underdocumented | Add guide and example |

---

## Recommended Focus Areas

### Immediate (Before Next Release)
1. Fix 9 broken documentation links
2. Export HSM APIs from main package
3. Remove README duplicates

### Short-Term (Next Sprint)
1. Decide: Flattening vs Propagation — pick one or clearly differentiate
2. Add StoreMachine guide and interactive example
3. Document implicit final state behavior

### Medium-Term (Next Quarter)
1. Improve HSM type safety or document limitations
2. Simplify type definitions where possible
3. Consolidate machine creation APIs
