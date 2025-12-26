# Transition Helper: Simple Metadata Attachment

## The Goal
Minimal API to attach "what this returns" metadata to transition functions.

## Design Options

### Option 1: Simple Wrapper (Minimal)
```typescript
// Just attach metadata, return the handler
function t<Targets extends readonly string[]>(
  targets: Targets,
  handler: (...args: any[]) => (ev: any) => any
) {
  (handler as any)._targets = targets;
  return handler;
}

// Usage
const typed = t(["Empty", "TextEntry", "Suggesting"],
  (value: string) => (ev) => {
    const suggestions = getSuggestions(value, ev.from.data.selectedTags);
    if (!value.trim()) return activeStates.Empty(ev.from.data.selectedTags);
    return suggestions.length > 0
      ? activeStates.Suggesting({...})
      : activeStates.TextEntry({...});
  }
);
```

**Pros**: Absolute minimal boilerplate
**Cons**: Targets are strings (could typo)

### Option 2: State Constructor References
```typescript
// Pass state constructors, extract names automatically
function t<States extends Record<string, Function>>(
  states: States,
  handler: (...args: any[]) => (ev: any) => any
) {
  const targets = Object.keys(states);
  (handler as any)._targets = targets;
  return handler;
}

// Usage - no string literals!
const typed = t(
  { Empty: activeStates.Empty, TextEntry: activeStates.TextEntry, Suggesting: activeStates.Suggesting },
  (value: string) => (ev) => { ... }
);

// Or even shorter with array
function t(
  stateCtors: Function[],
  handler: (...args: any[]) => (ev: any) => any
) {
  // Extract state names from function names or attached metadata
  const targets = stateCtors.map(fn => fn.name || (fn as any)._stateName);
  (handler as any)._targets = targets;
  return handler;
}

const typed = t(
  [activeStates.Empty, activeStates.TextEntry, activeStates.Suggesting],
  (value: string) => (ev) => { ... }
);
```

**Pros**: Type-safe, no string literals, autocomplete works
**Cons**: Slightly more verbose

### Option 3: Discovery Function (Your Idea!)
```typescript
// Call a no-arg function to discover possible states
function t(
  discover: () => any[],  // Returns sample state objects
  handler: (...args: any[]) => (ev: any) => any
) {
  const samples = discover();
  const targets = samples.map(s => s.key);
  (handler as any)._targets = targets;
  return handler;
}

// Usage - literally construct samples
const typed = t(
  () => [
    activeStates.Empty([]),
    activeStates.TextEntry({ input: "", selectedTags: [] }),
    activeStates.Suggesting({ input: "", selectedTags: [], suggestions: [] })
  ],
  (value: string) => (ev) => { ... }
);
```

**Pros**: Calls actual constructors (validates they work), no strings
**Cons**: Have to construct sample objects

### Option 4: Fluent/Chainable API
```typescript
// Create transition, attach metadata via method
function transition(handler: (...args: any[]) => (ev: any) => any) {
  return {
    canReturn: (targets: string[]) => {
      (handler as any)._targets = targets;
      return handler;
    }
  };
}

// Usage
const typed = transition((value: string) => (ev) => { ... })
  .canReturn(["Empty", "TextEntry", "Suggesting"]);
```

**Pros**: Reads nicely, clear intent
**Cons**: Extra nesting

### Option 5: Return Type Inference Helper
```typescript
// Helper that extracts type info at compile time
function t<T extends (...args: any[]) => (ev: any) => { key: string }>(
  handler: T,
  // TypeScript magic to extract possible return keys
  // This is the tricky part - might need conditional types
) {
  // At runtime, we still need metadata
  return handler;
}

// Would need something like:
type ExtractKeys<T> = T extends (...args: any[]) => (ev: any) => { key: infer K } ? K : never;
```

**Pros**: Pure TypeScript types
**Cons**: Very complex, may not be possible without build step

## Recommendation: Hybrid of Options 1 & 2

```typescript
// Simple version - just strings
export function t<const T extends readonly string[]>(
  targets: T,
  handler: (...args: any[]) => (ev: any) => any
) {
  (handler as any)._targets = targets;
  return handler;
}

// Type-safe version - state constructors
export function transition<S extends Record<string, Function>>(
  states: S,
  handler: (...args: any[]) => (ev: any) => any
) {
  const targets = Object.keys(states);
  (handler as any)._targets = targets;
  return handler;
}

// Or even simpler - detect which version based on first arg
export function t(
  targetsOrStates: readonly string[] | Record<string, Function>,
  handler: (...args: any[]) => (ev: any) => any
) {
  const targets = Array.isArray(targetsOrStates)
    ? targetsOrStates
    : Object.keys(targetsOrStates);

  (handler as any)._targets = targets;
  return handler;
}
```

## Usage in Combobox

```typescript
import { t } from "matchina";

const activeSubmachine = defineSubmachine(
  activeStates,
  {
    Empty: {
      typed: t(["Empty", "TextEntry", "Suggesting"],
        (value: string) => (ev) => {
          const selectedTags = ev.from.data.selectedTags;
          if (!value.trim()) return activeStates.Empty(selectedTags);

          const suggestions = getSuggestions(value, selectedTags);
          return suggestions.length > 0
            ? activeStates.Suggesting({ input: value, selectedTags, suggestions })
            : activeStates.TextEntry({ input: value, selectedTags });
        }
      )
    },
    TextEntry: {
      typed: t(["Empty", "TextEntry", "Suggesting"],
        (value: string) => (ev) => { /* same handler, shared! */ }
      )
    },
    // ...
  },
  "Empty"
);
```

## Visualizer Update

```typescript
// In matchina-machine-to-xstate-definition.ts
Object.entries(machine.transitions).forEach(([fromKey, events]) => {
  Object.entries(events).forEach(([event, entry]) => {
    if (typeof entry === 'function') {
      // Check for metadata
      if ((entry as any)._targets) {
        const targets = (entry as any)._targets;
        // Show all possible targets
        definition.states[fromKey].on[event] = targets;
        return;
      }

      // No metadata - skip or show as dynamic
      return;
    }

    // String transition - normal handling
    const resolved = resolveState(machine.states, fromKey, entry);
    definition.states[fromKey].on[event] = resolved.key;
  });
});
```

## Validation (Optional Enhancement)

```typescript
export function t(
  targets: readonly string[] | Record<string, Function>,
  handler: (...args: any[]) => (ev: any) => any,
  options?: { validate?: boolean }
) {
  const targetKeys = Array.isArray(targets) ? targets : Object.keys(targets);

  if (options?.validate) {
    // Wrap handler to check return value
    const wrappedHandler = (...args: any[]) => (ev: any) => {
      const result = handler(...args)(ev);
      if (result?.key && !targetKeys.includes(result.key)) {
        console.warn(
          `Transition returned unexpected state "${result.key}". ` +
          `Expected one of: ${targetKeys.join(", ")}`
        );
      }
      return result;
    };
    (wrappedHandler as any)._targets = targetKeys;
    return wrappedHandler;
  }

  (handler as any)._targets = targetKeys;
  return handler;
}
```

## Implementation Checklist

- [ ] Create `src/transition-helper.ts` with `t()` function
- [ ] Export from `src/index.ts`
- [ ] Update visualizer to check `._targets` metadata
- [ ] Update combobox example to use `t()`
- [ ] Test that diagram shows transitions
- [ ] Test that text input works
- [ ] Document in HSM guide

## Name Bikeshedding

What should we call it?
- `t()` - ultra minimal
- `transition()` - clear but verbose
- `parameterized()` - descriptive
- `withTargets()` - explicit
- `returns()` - verb form
- `to()` - short, clear intent

My vote: **`t()`** for terseness, with `transition()` as alias for clarity.
