# Matchina Type Inference Guide

**Living Document** - Updated as type issues are encountered and resolved.

## Core Philosophy

Matchina's entire purpose is **type-safe state machines with full type inference**. The framework is designed to obviate the need for developers to do declarative typing.

## Elegance Principles (User-Defined)

### 1. Elegant States = No Parameters, No Data

```typescript
// ✅ MOST ELEGANT - states are just markers
const states = defineStates({
  Inactive: undefined,
  "Active.Empty": undefined,
  "Active.Typing": undefined,
});

// ❌ LESS ELEGANT - states carry data
const states = defineStates({
  Inactive: (selectedTags: string[]) => ({ selectedTags }),
});
```

### 2. Elegant Transitions = Just State Names

```typescript
// ✅ MOST ELEGANT - simple string targets
const transitions = {
  Inactive: { focus: "Active.Empty" },
  "Active.Empty": { typed: "Active.Typing" },
};

// ❌ LESS ELEGANT - functional transitions
const transitions = {
  Inactive: { focus: (tags) => states["Active.Empty"](tags) },
};
```

### 3. Data Lives in Stores, Not States

Separate concerns: state machine handles state transitions, store handles data.

### 4. Conditional Logic Belongs in Hooks

```typescript
// ❌ BAD - conditional logic in transitions
typed: (input) => input.length > 0 ? states.TextEntry(input) : states.Empty()

// ✅ GOOD - multiple simple transitions, logic in hooks
typed: "Typing"  // Always go to Typing first
// Then in an effect hook, check conditions and send toTextEntry or toSuggesting
```

## Cardinal Rules

### 1. NEVER Declare Transitions as Variables

```typescript
// ❌ WRONG - Breaks type inference completely
const transitions = { Initial: { next: "Final" } };
const machine = createMachine(states, transitions, "Initial");

// ✅ CORRECT - Preserves full type inference
const machine = createMachine(states, {
  Initial: { next: "Final" },
  Final: {}
}, "Initial");
```

**Why**: TypeScript infers the literal types of the transition object only when passed inline. Assigning to a variable first widens the types, losing the connection between state names and transitions.

### 2. NEVER Use `any` in User-Facing Code

`any` is a red flag that type inference is broken. It's a footgun that defeats the library's purpose.

**Exceptions**: Internal implementation details where types are verified at boundaries.

### 3. Strict Typing > Loose Typing

- Prefer `unknown` over `any` when type is truly unknown
- Use type guards to narrow types
- Never strip typing to "make it work"

## Common Pitfalls

### Pitfall: Event Handler Parameter Types

**Problem**: Event handlers lose type inference for event parameters.

```typescript
// ❌ Implicit any
onEvent: (event) => { ... }

// ✅ Type flows from machine definition
// If this doesn't work, the machine definition is wrong
```

### Pitfall: Optional Methods That Are Always Provided

**Problem**: Marking methods as optional (`method?:`) when they're always provided in implementation.

**Fix**: If always provided, don't mark optional. If truly optional, handle the undefined case.

### Pitfall: Module Resolution

**Problem**: Import paths don't resolve correctly.

**Root Cause**: Usually package.json exports or tsconfig paths misconfigured.

## Issues Encountered

| Issue | Category | Root Cause | Fix |
|-------|----------|------------|-----|
| ev.machine undefined in effects | Library | FactoryMachineEventImpl never receives machine reference | Fixed: pass machine to FactoryMachineEventImpl in factory-machine.ts resolveExit |
| hooks.ts used ev.target | Usage | Wrong property name - TransitionEvent has `machine` not `target` | Fixed: changed to ev.machine |
| send() params typed as 'never' | Definition | String target transitions don't type params | Known limitation - runtime works, type polish item |
| hsm-visualization test wrong API | Usage | Test used 'activate' but machine uses 'focus' | Fixed: updated test to use correct API |

## Resolution Patterns

### Pattern: Fixing Broken Type Inference

1. Check if transitions are declared as variables (Cardinal Rule #1)
2. Check if `any` has crept in upstream
3. Trace the generic type parameters through the call chain
4. Verify the source types are correct before fixing downstream

### Pattern: Fixing Test Type Errors

1. Is the test using outdated APIs? → Update test
2. Is the library type wrong? → Fix library type
3. Is the usage pattern wrong? → Fix usage pattern

---

*Last updated: 2025-12-31*
