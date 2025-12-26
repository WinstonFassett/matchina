# HSM Inspection Solutions: Creative Approaches

## The Challenge
Function transitions enable rich behavior but can't be inspected for visualization. We need solutions that:
- ✅ Keep function flexibility (data-driven decisions, complex logic)
- ✅ Enable static inspection (show all possible transitions in diagrams)
- ✅ Stay DRY (single source of truth)
- ✅ Are ergonomic (minimal boilerplate)
- ✅ Are type-safe (catch mismatches at compile time)

## Solution 1: Conditional Transition Decorator

**Idea**: Wrap functions with metadata about what they MIGHT return.

```typescript
// Define possible targets upfront
const typed = conditional({
  to: ["Empty", "TextEntry", "Suggesting"] as const,
  handler: (value: string) => (ev) => {
    const suggestions = getSuggestions(value, ev.from.data.selectedTags);
    if (!value.trim()) return activeStates.Empty(ev.from.data.selectedTags);
    return suggestions.length > 0
      ? activeStates.Suggesting({...})
      : activeStates.TextEntry({...});
  }
});

// Usage - function behaves normally, but carries metadata
const comboboxDef = defineMachine(activeStates, {
  Empty: { typed },
  TextEntry: { typed },
  Suggesting: { typed }
});
```

**Visualization**:
```typescript
// Check if transition has metadata
if (typeof entry === 'function' && entry._conditionalMeta) {
  // Show all possible targets
  definition.states[fromKey].on[event] = entry._conditionalMeta.to;
}
```

**Type safety**:
```typescript
function conditional<Targets extends readonly string[]>(config: {
  to: Targets;
  handler: (...args) => (ev) => StateMatchbox<Targets[number], any>;
}) {
  const fn = config.handler;
  (fn as any)._conditionalMeta = { to: config.to };
  return fn;
}
```

**Validation**: Could add runtime check that returned state is in declared `to` list.

### Pros
- ✅ Minimal boilerplate (one wrapper)
- ✅ Full function flexibility
- ✅ Static visualization (shows all possibilities)
- ✅ Can be type-checked

### Cons
- ⚠️ Metadata is a promise, not enforced (unless we add runtime validation)
- ⚠️ Still manual declaration of targets

---

## Solution 2: Builder Pattern with Branching

**Idea**: Fluent API that captures decision tree structure.

```typescript
const typed = transition("typed")
  .withParam<string>()
  .branch((value, ev) => !value.trim())
    .to(() => activeStates.Empty(ev.from.data.selectedTags))
  .branch((value, ev) => getSuggestions(value, ev.from.data.selectedTags).length > 0)
    .to((value, ev) => activeStates.Suggesting({...}))
  .default()
    .to((value, ev) => activeStates.TextEntry({...}));
```

**Inspection**: The builder creates a structured object:
```typescript
{
  type: "conditional",
  branches: [
    { condition: fn, target: "Empty" },
    { condition: fn, target: "Suggesting" }
  ],
  default: "TextEntry"
}
```

**Runtime**: Evaluates branches in order, executes matched handler.

### Pros
- ✅ Self-documenting structure
- ✅ Fully inspectable (we know all branches)
- ✅ Type-safe branching
- ✅ Clear execution model

### Cons
- ⚠️ More verbose than raw functions
- ⚠️ Limited to branch patterns (but covers most cases)
- ⚠️ Need to extract state names from handlers

---

## Solution 3: Runtime Discovery with Mock Execution

**Idea**: Execute transitions with sample data to discover targets.

```typescript
function discoverTransitions(machine) {
  const discovered = {};

  for (const [fromState, events] of Object.entries(machine.transitions)) {
    discovered[fromState] = {};

    for (const [event, handler] of Object.entries(events)) {
      if (typeof handler === 'function') {
        // Generate sample event objects with different data patterns
        const samples = generateSamples(fromState, event);
        const targets = new Set();

        for (const sample of samples) {
          try {
            const result = handler(...)(sample);
            if (result?.key) targets.add(result.key);
          } catch (e) {
            // Skip invalid samples
          }
        }

        discovered[fromState][event] = Array.from(targets);
      }
    }
  }

  return discovered;
}
```

**Usage**:
```typescript
// At dev time or build time
const schema = discoverTransitions(machine);
machine._discoveredSchema = schema;

// Visualization uses discovered schema
```

### Pros
- ✅ Zero boilerplate (automatic)
- ✅ Always accurate (based on actual execution)
- ✅ Works with any function complexity
- ✅ Can be run in test/dev mode

### Cons
- ⚠️ May not discover all branches (depends on sample quality)
- ⚠️ Runtime overhead (mitigated by caching)
- ⚠️ Non-deterministic if functions have side effects

---

## Solution 4: Static Analysis of Simple Patterns

**Idea**: Parse common patterns in function bodies.

```typescript
function analyzeTransition(fn: Function) {
  const source = fn.toString();

  // Pattern: return someStates.StateName(...)
  const returns = source.match(/return\s+\w+\.(\w+)\(/g);
  if (returns) {
    return returns.map(r => r.match(/\.(\w+)\(/)[1]);
  }

  // Pattern: ternary - cond ? state1 : state2
  const ternary = source.match(/\?\s*\w+\.(\w+)\(.*:\s*\w+\.(\w+)\(/);
  if (ternary) {
    return [ternary[1], ternary[2]];
  }

  return null; // Can't analyze
}
```

### Pros
- ✅ Zero boilerplate
- ✅ Works for simple cases

### Cons
- ❌ Extremely fragile
- ❌ Breaks with minification
- ❌ Limited to simple patterns
- ❌ Can't handle complex logic
- **Not recommended**

---

## Solution 5: Event Trace Collection (Dev Mode)

**Idea**: Record actual transitions during development/testing.

```typescript
const machine = createMachineFromFlat(flatDef, {
  devMode: true,
  onTransition: (from, event, to) => {
    recordTransition(from.key, event, to.key);
  }
});

// After running tests/examples
const schema = getRecordedTransitions();
machine._traceSchema = schema;
```

**Visualization**: Use trace schema if available, mark as "incomplete" if lacking coverage.

### Pros
- ✅ Zero boilerplate
- ✅ Reflects actual usage
- ✅ Works with any complexity
- ✅ Can identify unused transitions

### Cons
- ⚠️ Requires good test coverage
- ⚠️ Only shows what was executed
- ⚠️ Needs persistence between runs

---

## Solution 6: TypeScript Type Extraction

**Idea**: Extract transition info from TypeScript return types.

```typescript
// Handler returns union type
const typed = (value: string) => (ev: Event):
  | StateMatchbox<"Empty", {...}>
  | StateMatchbox<"TextEntry", {...}>
  | StateMatchbox<"Suggesting", {...}> => {
  // Implementation
};
```

**Build-time tool**: Parse TypeScript AST, extract union members, generate schema.

### Pros
- ✅ Type-safe by definition
- ✅ No runtime overhead
- ✅ Single source of truth (types)

### Cons
- ⚠️ Requires build step
- ⚠️ Complex tooling
- ⚠️ Only works with TypeScript

---

## Solution 7: Hybrid Static/Dynamic Visualization

**Idea**: Accept that some transitions are dynamic, show them differently.

```typescript
// In visualizer
if (typeof entry === 'function') {
  // Show as "dynamic" edge with special styling
  definition.states[fromKey].on[event] = {
    type: "dynamic",
    label: "computed at runtime",
    style: "dashed"  // Dashed line in diagram
  };
} else {
  // Normal static edge
  definition.states[fromKey].on[event] = entry;
}
```

**Enhanced with sampling**:
```typescript
if (typeof entry === 'function') {
  // Try to discover some targets via sampling
  const samples = quickSample(machine, fromKey, event);
  definition.states[fromKey].on[event] = {
    type: "dynamic",
    discovered: samples,  // ["Empty", "TextEntry"] (partial list)
    label: samples.length ? `→ ${samples.join(", ")} (and others?)` : "computed"
  };
}
```

### Pros
- ✅ Honest about what we know/don't know
- ✅ Shows partial information better than nothing
- ✅ No code changes required
- ✅ Progressive enhancement (better with more info)

### Cons
- ⚠️ Incomplete diagrams
- ⚠️ May confuse users

---

## Solution 8: Transition Declaration Separation

**Idea**: Declare transitions separately from implementation, link them.

```typescript
// Schema - what transitions exist
const comboboxSchema = defineSchema({
  Empty: {
    typed: { to: ["Empty", "TextEntry", "Suggesting"] },
    removeTag: { to: ["Empty"] }
  },
  TextEntry: {
    typed: { to: ["Empty", "TextEntry", "Suggesting"] },
    clear: { to: ["Empty"] }
  }
  // ... complete schema
});

// Implementation - how they work
const comboboxImpl = implementSchema(comboboxSchema, {
  Empty: {
    typed: (value) => (ev) => {
      const suggestions = getSuggestions(value, ev.from.data.selectedTags);
      if (!value.trim()) return activeStates.Empty(...);
      return suggestions.length > 0 ? activeStates.Suggesting(...) : activeStates.TextEntry(...);
    },
    removeTag: (tag) => (ev) => activeStates.Empty(ev.from.data.selectedTags.filter(t => t !== tag))
  },
  // ... complete implementation
});

// Validation at runtime
validateImplementation(comboboxSchema, comboboxImpl);
```

### Pros
- ✅ Complete static schema
- ✅ Full function flexibility
- ✅ Validated consistency
- ✅ Schema can be used for codegen, docs, etc.

### Cons
- ⚠️ Duplication (most verbose option)
- ⚠️ Schema can drift from impl

---

## Recommended Hybrid Solution

**Combine multiple approaches for best DX:**

### Level 1: Simple Case (No boilerplate)
For simple transitions, just use strings:
```typescript
{ typed: "TextEntry" }  // Directly inspectable
```

### Level 2: Annotated Functions (Minimal boilerplate)
For complex but bounded transitions, use decorator:
```typescript
{
  typed: conditional({
    to: ["Empty", "TextEntry", "Suggesting"],
    handler: (value) => (ev) => { /* complex logic */ }
  })
}
```

### Level 3: Runtime Discovery (Automatic)
In dev mode, discover actual transitions:
```typescript
const machine = createMachine(..., { devMode: true });
// Records transitions during execution
// Exports schema for production visualization
```

### Level 4: Hybrid Visualization (Fallback)
Show what we know, mark rest as dynamic:
```typescript
// Visualizer shows:
// - Strings as solid edges
// - Annotated functions as solid edges to all declared targets
// - Plain functions as dashed "dynamic" edges
// - Discovered transitions as dotted edges with "(observed)" label
```

## Implementation Plan

1. **Phase 1**: Implement `conditional()` decorator (Solution 1)
   - Minimal change, immediate benefit
   - Update combobox example to use it
   - Visualizer checks for `._conditionalMeta`

2. **Phase 2**: Add hybrid visualization (Solution 7)
   - Show plain functions as "dynamic"
   - Special styling for different transition types

3. **Phase 3**: Add dev-mode tracing (Solution 5)
   - Record transitions during development
   - Export schema for production
   - Merge with declared schemas

4. **Phase 4**: (Optional) Builder API (Solution 2)
   - For complex branching patterns
   - More ergonomic than conditional decorator
   - Can compile to conditional format

## Next Steps

Which solution(s) resonate? Should we:
1. Start with `conditional()` decorator + hybrid viz?
2. Try builder pattern first?
3. Focus on runtime discovery?
4. Something else?

The key is starting with something that works for the combobox example and proves the pattern.
