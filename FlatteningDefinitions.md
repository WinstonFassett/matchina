# Flattening Definitions: Hierarchical State Machines

## Overview

This document explains the flattening of hierarchical state machines in Matchina, focusing on the type-level challenges and current implementation approach.

## What is Hierarchical State Machine Flattening?

Hierarchical state machines allow states to contain sub-machines. Flattening converts this nested structure into a single-level state machine with fully-qualified state keys.

### Example
```typescript
// Hierarchical definition
const Parent = defineMachine(
  defineStates({
    Broken: undefined,
    Working: Child, // Child is a submachine
  }),
  {
    Broken: { repair: "Working" },
    Working: { break: "Broken" },
  },
  "Working"
);

// Flattened result
{
  states: {
    "Broken": () => ({ key: "Broken" }),
    "Working.Red": () => ({ key: "Working.Red" }),
    "Working.Green": () => ({ key: "Working.Green" }),
    "Working.Yellow": (delta?: number) => ({ key: "Working.Yellow", data: { delta } })
  },
  transitions: {
    "Broken": { repair: "Working.Red" }, // Targets child initial
    "Working.Red": { tick: "Working.Green" },
    "Working.Green": { tick: "Working.Yellow", bump: (delta: number) => "Working.Yellow" },
    "Working.Yellow": { tick: "Working.Red" },
    "Working": { break: "Broken" } // Parent-level transitions
  },
  initial: "Working.Red"
}
```

## The "Has A" Approach

Matchina uses a "has a" relationship for submachines:

```typescript
// Submachine is stored as a property
Working: Child  // "has a" relationship

// NOT "is a" inheritance
// Working: { ...Child.states, ... }  // "is a" relationship
```

This means:
- Submachines are referenced by the parent state
- State keys are prefixed: `"Working.Red"`, `"Working.Green"`
- Parent can transition to/from the submachine as a unit
- Events bubble up from child to parent when appropriate

## Implementation Structure

The code is separated into types and implementation:

### `src/definition-types.ts`
Contains all type definitions for type-level flattening:
- `MachineDefinition<SF, T, I>` - Core machine type
- `StateConfig` - Union of leaf states and submachines
- `FlattenStateKeys<Raw, Delim>` - Computes flattened state key types
- `FlattenedStateSpecs<Raw>` - Computes flattened state factory types
- `FlattenedMachineDefinition<Raw, TR>` - Return type of flattening

### `src/definitions.ts`
Contains runtime implementation:
- `defineMachine()` - Creates machine definitions
- `defineSubmachine()` - Wraps machines for "has a" relationship
- `flattenMachineDefinition()` - Main flattening function
- `flattenFromRaw()` - Internal flattening logic

## The Type Inference Problem

### Current Issue
TypeScript cannot automatically infer precise types from runtime objects:

```typescript
// This works but requires explicit typing
const Parent = defineMachine(
  defineStates({
    Broken: undefined,
    Working: Child as { machine: typeof Child }, // Explicit typing needed
  }),
  // ...
);

// This doesn't infer types automatically
const Parent = defineMachine(
  defineStates({
    Broken: undefined,
    Working: Child, // TypeScript sees this as 'any'
  }),
  // ...
);
```

### Why This Happens
1. **Runtime Objects Lose Type Information**: JavaScript objects don't preserve TypeScript's generic type parameters
2. **Factory Functions Are Black Boxes**: `defineStates()` returns a generic factory that TypeScript can't peer into
3. **Union Types Get Widened**: Without explicit typing, TypeScript infers `string | number | symbol` for state keys

### The Raw Tracking Attempt
Previous versions tried tracking "raw" state specs alongside factories:
```typescript
// Old approach (removed)
function normalizeStates(input) {
  return {
    factory: defineStates(raw),
    raw: raw  // Keep original specs for type computation
  };
}
```
This failed because:
- Added complexity without solving the core issue
- Raw specs still lost type information at runtime
- Made the API confusing with dual representations

## Current Implementation Details

### `defineMachine()` Overloads
```typescript
// Overload 1: Direct factory
defineMachine<SF, T, I>(states: SF, transitions: T, initial: I)

// Overload 2: Shorthand object with implicit submachines
defineMachine<SS, SF, T, I>(states: SS, transitions: T, initial: I)

function defineMachine(states: any, transitions: any, initial: any) {
  const { factory } = normalizeStates(states);
  return { states: factory, transitions, initial };
}
```

### `defineSubmachine()` Wrapper
```typescript
export function defineSubmachine<SS, T, I>(
  states: SS, 
  transitions: T, 
  initial: I
): { machine: MachineDefinition<any, any, I> } {
  return { machine: defineMachine(states, transitions, initial) };
}
```

### `flattenMachineDefinition()` Current State
```typescript
export function flattenMachineDefinition<
  Raw extends Record<string, StateConfig>,
  TR extends Record<string, any>
>(
  def: MachineDefinition<any, any, any>,
  _opts: FlattenOptions = {}
): FlattenedMachineDefinition<Raw, TR> {
  // Current implementation just returns the input
  // Type-level flattening happens via generics
  const { factory } = normalizeStates(def.states);
  return {
    states: factory,
    transitions: def.transitions,
    initial: def.initial,
  } as any;
}
```

**Note**: The current `flattenMachineDefinition` doesn't actually do runtime flattening yet. It's a stub that preserves the type structure while the real flattening logic exists in `flattenFromRaw()`.

### `isSubmachineMarker()` Detection
```typescript
function isSubmachineMarker(x: any): x is { machine: MachineDefinition<any, any, any> } {
  return x && typeof x === "object" && "machine" in x;
}
```

This checks for the "has a" relationship by looking for a `machine` property.

## What Works vs What Doesn't

### ✅ Working
- **Runtime Flattening**: `flattenFromRaw()` correctly flattens nested machines
- **Type Definitions**: All type computations work when explicitly typed
- **"Has A" Relationship**: Submachines are properly detected and handled
- **State Key Prefixing**: `"Parent.Child.Grandchild"` style keys
- **Event Propagation**: Parent-level transitions work
- **Factory Preservation**: State factories maintain their parameter types

### ❌ Not Working
- **Automatic Type Inference**: Requires explicit typing in tests
- **Runtime Type Preservation**: JavaScript loses TypeScript generics
- **Complete Flattening**: `flattenMachineDefinition` is a type-only stub
- **Event Collision Handling**: Basic implementation exists but untested

## The Fundamental Challenge

The core issue is TypeScript's limitation with runtime type preservation:

```typescript
// TypeScript knows this at compile time
type PreciseType = {
  Working: { machine: MachineDefinition<...> }
}

// But at runtime, it's just an object
const runtimeValue = {
  Working: { machine: { states: {...}, transitions: {...}, initial: "Red" } }
}
// TypeScript infers: { Working: any }
```

### Possible Solutions

1. **Accept Explicit Typing** (Current approach)
   - Require users to explicitly type submachine references
   - Clear and predictable, but verbose

2. **API Redesign for Type Preservation**
   - Change `defineSubmachine` to return typed wrappers
   - Use symbol-based type branding
   - More complex but enables automatic inference

3. **Build-Time Code Generation**
   - Generate typed definitions at build time
   - Complex tooling requirement

4. **Type-Only Flattening**
   - Keep flattening as compile-time only
   - Runtime uses different structure
   - Schizophrenic API

## Current Test Status

The test file `test/flatten.api.types.ts` demonstrates the issue:

```typescript
// This requires explicit typing to work
const Parent = defineMachine(
  defineStates({
    Broken: undefined,
    Working: Child as { machine: typeof Child }, // Explicit cast needed
  }),
  // ...
);

// Without the cast, TypeScript infers:
// FlatStateKey = string | number | symbol (too broad)
```

## Conclusion

The flattening system works correctly at runtime and with explicit typing. The challenge is making TypeScript infer types automatically from runtime objects, which requires fundamental changes to how the API preserves type information through the JavaScript runtime.

The current approach prioritizes runtime correctness and clear separation of types from implementation, accepting that some explicit typing is needed for full type safety.
