# HSM Type Analysis - Understanding the Type Flow

## Current Problem
The `createHSM` function should allow typed state data and transitions, but the type inference is broken.

## How the Existing System Works

### 1. defineStates() - The Working Example
```typescript
const states = defineStates({
  Loading: (query: string) => ({ query }), // ← Typed state data
  Success: (query: string, results: string[]) => ({ query, results })
});
```

**Key Types:**
- `defineStates<Config>(config: Config)` returns `StateMatchboxFactory<Config>`
- Each state factory function preserves its parameter types
- The return type maintains the parameter information

### 2. FactoryMachineTransitions - The Working Example
```typescript
const transitions: FactoryMachineTransitions<typeof states> = {
  Loading: {
    complete: (query: string, results: string[]) => states.Success(query, results),
    error: (query: string) => states.Loading(query)
  }
};
```

**Key Types:**
- `FactoryMachineTransitions<SF>` where `SF` is the state factory
- Transition functions can take parameters and return states
- The parameter types are preserved in the type system

### 3. ExtractEventParams - The Magic
```typescript
send<T extends FactoryMachineEvent<FC>["type"]>(
  type: T,
  ...params: ExtractEventParams<FC, T>
): void;
```

**How it works:**
- `ExtractEventParams<FC, T>` looks up the event type `T` in the transitions
- It extracts the parameter types from the transition function
- This gives you type-safe `send()` calls

## What createHSM Should Do

### The Input:
```typescript
const machine = createHSM({
  initial: "Inactive",
  states: {
    Suggesting: {
      data: (text: string) => text, // ← State data with parameter
      on: {
        type: (input: string) => "Suggesting" // ← Transition with parameter
      }
    }
  }
} as const);
```

### The Desired Output:
The machine should have:
1. Properly typed state factories
2. Properly typed transitions
3. Type-safe `send()` calls
4. Type-safe event handlers that automatically infer parameter types

### The Type Flow Should Be:
1. `data: (text: string) => text` → State factory with string parameter
2. `type: (input: string) => "Suggesting"` → Transition that takes string
3. `machine.send("type", "input")` → Type-safe send call
4. `type: (it) => {...}` → Handler that infers `it: string` automatically

## Current Implementation Issues

### Issue 1: Generic Parameter Not Used
```typescript
export function createHSM<T extends DeclarativeFlatMachineConfig>(config: T)
```
- The `T` captures the config type but isn't used for return type inference
- The return type is not properly constrained by `T`

### Issue 2: Runtime Flattening vs Type Preservation
- The runtime code flattens the hierarchical structure
- But the type system should preserve the original structure for inference
- Need to map hierarchical types to flattened types while preserving parameter information

### Issue 3: Handler Parameter Inference
- The `ev.match()` handlers should infer parameter types from transitions
- Currently they get `any` because the type mapping is broken
- Need to connect transition parameter types to handler parameter types

## What Needs to Be Fixed

### 1. Return Type Inference
The `createHSM` return type should be:
```typescript
ReturnType<typeof createFlatMachine<
  // Properly typed state factory from config
  StateFactoryFromConfig<T>,
  // Properly typed transitions from config  
  TransitionsFromConfig<T>,
  // Initial state type
  T["initial"]
>>
```

### 2. Type Mapping Functions
Need utility types to:
- Extract state factory types from hierarchical config
- Extract transition types from hierarchical config
- Map hierarchical state keys to flattened keys while preserving types

### 3. Handler Type Inference
The `ev.match()` should infer handler parameter types from the transition definitions.

## Current Progress

### ✅ What I've Done:
1. Created type extraction utilities in `type-extraction.ts`
2. Added imports for these utilities
3. Created analysis document to understand the type flow
4. Tests still pass - functionality is preserved

### ❌ What's Still Broken:
1. The return type constraint is too complex and causes compilation errors
2. Handler parameter inference still doesn't work
3. The type mapping from config to machine types is incomplete

### 🔥 The Core Issue:
The `createFlatMachine` function expects specific type constraints that are hard to satisfy when extracting types from a hierarchical config. The type-level computation becomes too complex and breaks.

## Next Steps
1. Simplify the return type approach - focus on making it work rather than perfect
2. Test if the basic type extraction utilities work
3. Ensure handler parameter inference works
4. Verify that `machine.send()` calls are type-safe

## Key Insight
The existing system works perfectly with `defineStates()` and `FactoryMachineTransitions`. The challenge is bridging the gap between the declarative hierarchical config and the flattened machine types while preserving parameter information.
