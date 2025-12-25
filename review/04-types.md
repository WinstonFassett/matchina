# Matchina: TypeScript Types Review

## Core Type Architecture

### Type Hierarchy

```
TaggedTypes (config object)
    ↓ matchboxFactory()
MatchboxFactory<Config, TagProp>
    ↓ defineStates() (TagProp = "key")
StateMatchboxFactory<Config>
    ↓ createMachine()
FactoryMachine<FactoryMachineContext>
```

---

## State Definition Types

### `TaggedTypes<T>` (`matchbox-factory-types.ts:142`)
```typescript
export type TaggedTypes<T = any> = {
  [k: string]: T;
} & { _?: never };
```
**Purpose**: Config object shape for matchbox factories.
**Issue**: `_?: never` prevents `_` as a state key but allows any other string.

### `StateMatchboxFactory<Specs>` (`state-types.ts:57`)
```typescript
export type StateMatchboxFactory<Specs extends TaggedTypes> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};
```
**Purpose**: Maps state specs to state constructor functions.

### `StateMatchbox<Tag, Specs>` (`state-types.ts:11`)
```typescript
export type StateMatchbox<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: any;  // ⚠️ Loosened typing
  depth: number;
  nested: { fullKey: string; stack: any[]; machine: any; };
  stack: any[];
} & MatchboxMemberApi<Specs, "key">;
```
**Issues**:
- `data: any` loses type safety (comment says "to support cross-state access patterns")
- `depth`, `nested`, `stack` are runtime-stamped by hierarchy but always present in type

### `KeyedStateFactory` (`state-keyed.ts:30`)
```typescript
export interface KeyedStateFactory {
  [key: string]: (...args: any[]) => KeyedState;
}
```
**Purpose**: Generic factory interface for state machines.
**Issue**: Uses `any[]` for args, losing parameter type information.

---

## Machine Types

### `FactoryMachineContext<SF>` (`factory-machine-types.ts:26`)
```typescript
export interface FactoryMachineContext<SF extends KeyedStateFactory = KeyedStateFactory> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}
```
**Purpose**: Bundle states and transitions for type inference.

### `FactoryMachine<FC>` (`factory-machine-types.ts:41`)
```typescript
export interface FactoryMachine<FC extends FactoryMachineContext<any> = FactoryMachineContext>
  extends Omit<StateMachine<FactoryMachineEvent<FC>>, "send" | "getState"> {
  states: FC["states"];
  transitions: FC["transitions"];
  send<T extends FactoryMachineEvent<FC>["type"]>(
    type: T,
    ...params: NormalizeParams<ExtractEventParams<FC, T>>
  ): void;
  getState(): FactoryKeyedState<FC["states"]>;
}
```
**Purpose**: Main machine interface with typed send/getState.
**Complexity**: `ExtractEventParams` involves 3-level nested mapped types.

### `FactoryMachineTransitions<SF>` (`factory-machine-types.ts:100`)
```typescript
export type FactoryMachineTransitions<SF extends KeyedStateFactory> = {
  [FromStateKey in keyof SF]?: {
    [EventKey in string]?: FactoryMachineTransition<SF, FromStateKey, EventKey>;
  };
};
```
**Purpose**: Transition table type.
**Issue**: `EventKey in string` allows any string, no exhaustiveness check.

### `FactoryMachineTransition<SF>` (`factory-machine-types.ts:106`)
```typescript
export type FactoryMachineTransition<SF, FromStateKey, EventKey> =
  | keyof SF  // String shortcut
  | ((...params: any[]) => FactoryKeyedState<SF>)  // Direct function
  | ((...params: any[]) => (ev: ResolveEvent<...>) => FactoryKeyedState<SF> | null | undefined);  // Curried
```
**Purpose**: Union of valid transition forms.
**Issue**: `any[]` params lose type inference for transition parameters.

---

## Event Types

### `FactoryMachineEvent<FC>` (`factory-machine-types.ts:122`)
```typescript
export type FactoryMachineEvent<FC extends FactoryMachineContext<any>> = {
  [K in keyof FC["transitions"]]: {
    [E in keyof FC["transitions"][K]]: FactoryMachineTransitionEvent<FC, K, E>;
  }[keyof FC["transitions"][K]];
}[keyof FC["transitions"]];
```
**Purpose**: Union of all possible transition events.
**Complexity**: Double-nested mapped type with indexed access.

### `TransitionEvent<To, From>` (`state-machine.ts:67`)
```typescript
export interface TransitionEvent<To = unknown, From = To> {
  type: string;
  params: any[];
  to: To;
  from: From;
  get machine(): StateMachine<TransitionEvent<To, From>>;
}
```
**Issues**:
- `type: string` not narrowed to actual event types
- `params: any[]` loses parameter typing

---

## Hierarchical Types

### `MachineDefinition<SF, T, I>` (`definition-types.ts:12`)
```typescript
export type MachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
> = {
  states: SF;
  transitions: T;
  initial: I;
};
```
**Purpose**: Static definition for flattening.

### `FlattenFactoryStateKeys<F>` (`definition-types.ts:44`)
```typescript
export type FlattenFactoryStateKeys<F extends StateMatchboxFactory<any>, Delim extends string = "."> =
  F extends StateMatchboxFactory<infer C>
    ? (
        | (HasMachineProperty<F[keyof C & string]> extends false ? keyof C & string : never)
        | `${Extract<keyof C, string>}${Delim}${string}`
      )
    : never;
```
**Purpose**: Generate flattened state key union.
**Issue**: `${string}` suffix allows any nested key, not validated against actual child states.

### `HierarchicalMachine<M>` (`propagateSubmachines.ts:47`)
```typescript
export type HierarchicalMachine<M> = M & {
  send: (type: HierarchicalEvents<M>, ...params: any[]) => void;
};
```
**Issue**: `params: any[]` loses type safety for event parameters.

---

## Findings

### Overly Complex Types

| Type | Complexity | Impact |
|------|------------|--------|
| `FactoryMachineEvent<FC>` | Double-nested mapped type | Slow IDE inference, hard to debug |
| `ExtractEventParams<FC, T>` | Triple-nested mapped type | Can cause "type instantiation is excessively deep" |
| `FactoryMachineTransitionEvent<FC, K, E>` | 4 type parameters with conditional inference | Complex error messages |
| `FlattenedFactoryStateSpecs<F>` | Recursive conditional with template literals | May not resolve correctly |

### Fragile Types

| Type | Issue | Risk |
|------|-------|------|
| `StateMatchbox.data: any` | Explicit `any` for "cross-state access" | Loses data type safety |
| `TransitionEvent.params: any[]` | No parameter typing | Runtime type errors |
| `KeyedStateFactory[key]: (...args: any[])` | Generic args | Parameter inference lost |
| `FlattenFactoryStateKeys` with `${string}` | Unbounded template literal | Accepts invalid keys |

### Missing Invariants

| Missing | Impact |
|---------|--------|
| **No `child.exit` event type** | `child.exit` is stringly-typed, not in event union |
| **No final state marker type** | `data.final` is convention, not enforced |
| **No machine property type** | `data.machine` is convention, not typed |
| **No depth/stack types** | Runtime-stamped fields not validated |

### Likely User Pain Points

1. **Complex error messages**: When transition types don't match, errors reference deep nested types
2. **IDE slowness**: Large state machines cause slow autocomplete due to type complexity
3. **`any` leakage**: `data: any` in StateMatchbox means `.data.foo` never errors
4. **Hierarchy type loss**: `HierarchicalMachine` loses parameter typing
5. **Flattening type mismatch**: `FlattenedMachineDefinition` types don't match runtime values

### Type Workarounds in Code

```typescript
// factory-machine.ts:93
return to ? new FactoryMachineEventImpl(ev.type, ev.from, to, ev.params, machine as any) : undefined;

// with-reset.ts:21
machine.transition({ from: before.to, type, to: state } as any);

// propagateSubmachines.ts:251
const ev = (root as any).resolveExit?.({ type, params, from });
```

These `as any` casts indicate places where the type system couldn't express the actual runtime behavior.

---

## Summary

### Strengths
- Good use of mapped types for state/transition inference
- `MatchboxMemberApi` provides clean `.is()`, `.as()`, `.match()` API
- `KeysWithZeroRequiredArgs` enables zero-arg state shortcuts

### Weaknesses
- Over-reliance on `any` for flexibility
- Deeply nested types cause poor DX
- Hierarchy types are largely untyped (`any` throughout)
- No branded types for `child.exit`, `final`, `machine` conventions

---

## Performance Analysis

### TypeScript Diagnostics (Dec 2025)

```
Types:           246,848
Instantiations:  1,185,404  (very high for 5.7K lines)
Memory:          637MB
Check time:      3.55s
```

### Trace Analysis (structuredTypeRelatedTo)

From TypeScript trace, **66% of check time** is spent in type compatibility checking:

| Operation | Total Time | Count | Avg |
|-----------|------------|-------|-----|
| structuredTypeRelatedTo | 6,624ms | 816 | 8.1ms |
| findSourceFile | 3,973ms | 131 | 30ms |
| checkExpression | 799ms | 184 | 4.3ms |
| getVariancesWorker | 576ms | 30 | 19ms |

### Priority Ranking

| Priority | Types | Issue |
|----------|-------|-------|
| **P0** | `ExtractEventParams`, `ExtractParamTypes`, `FactoryMachineEvent` | Triple-nested mapped types, 4-level conditionals |
| **P1** | `FlattenFactoryStateKeys`, `FlattenedFactoryStateSpecs`, `ChildOf` | Template literal explosion, 5+ level nesting |
| **P2** | `StateEventTransitionSenders`, `TUnionToIntersection` | Double mapped types |

---

## Refactoring Plan

### Phase 1: Critical Path (P0)

**ExtractEventParams** - Simplify from triple-nested to single lookup:
```typescript
// Current: 3-level nested mapped type
// Proposed: Direct lookup with precomputed event map
export type ExtractEventParams<FC, T extends string> = 
  T extends keyof EventParamMap<FC> ? EventParamMap<FC>[T] : never;
```

**ExtractParamTypes** - Reduce from 4-level to 2-level conditional:
```typescript
// Current: 4 conditional branches with multiple infers
// Proposed: Simplified helper
type GetTransitionParams<T, States> = 
  T extends keyof States ? Parameters<States[T]>
  : T extends (...args: infer A) => any ? A : [];
```

### Phase 2: Hierarchical Types (P1)

**FlattenFactoryStateKeys** - Avoid unbounded `${string}`:
```typescript
// Current: `${Extract<keyof C, string>}${Delim}${string}` - infinite patterns
// Proposed: Explicit union construction
type FlattenFactoryStateKeys<F> = DirectStateKeys<F> | NestedStateKeys<F>;
```

### Phase 3: Type Safety (P2)

Replace critical `any` usages:
- `StateMatchbox.data: any` → `StateData<Specs, Tag>`
- `TransitionEvent.params: any[]` → `EventParams<E>`
- `KeyedStateFactory[key]: (...args: any[])` → `StateCreator<K>`

### Expected Outcomes

| Metric | Current | Target |
|--------|---------|--------|
| Instantiations | 1.18M | 500K |
| Memory | 637MB | 300MB |
| Check time | 3.55s | 1.5s |

---

## Automated Tests

### Type Correctness Tests

**File:** `test/type-correctness.test.ts` (21 tests)

Compile-time regression tests that fail if refactoring breaks types:
- State key types (`getState().key` union)
- State data types (typed `.data` access)
- `send()` method types (correct params)
- Transition types (structure validation)
- Machine interface types (`states`, `transitions`)
- Function transition types
- Curried transition types
- `match()` API types
- Edge cases (undefined data, optional params)

### Type Performance Tests

**File:** `test/type-performance.test.ts` (23 tests)

Verifies complex type patterns resolve correctly:
- `ExtractEventParams` param extraction
- `ExtractParamTypes` function params
- `StateEventTransitionSenders` sender types
- `FlattenFactoryStateKeys` flattening
- `HasMachineProperty` detection
- `ExtractMachineFromFactory` extraction
- Performance regression (no deep instantiation)

### Running Tests

```bash
# Type correctness (compile-time + runtime)
npx vitest run test/type-correctness.test.ts

# Type performance
npx vitest run test/type-performance.test.ts

# Full type check
npx tsc --noEmit
```
