# HSM Inspection Architecture: The Function vs. Schema Problem

## The Core Tension

Matchina's hierarchical state machines (HSMs) face a fundamental architectural conflict:

**Runtime Flexibility (Functions)** ⚔️ **Static Inspection (Schemas)**

### What We Want
1. **Rich runtime behavior**: Transitions that compute next state based on data, context, suggestions, etc.
2. **Visual diagrams**: Show hierarchical structure and all possible transitions
3. **Type safety**: Infer types from state definitions
4. **Elegant APIs**: Both hierarchical (nested) and flattened patterns

### The Problem
These goals are fundamentally at odds:
- **Function transitions** enable rich behavior but can't be statically analyzed
- **String transitions** enable visualization but can't carry data or compute
- We have **two HSM creation patterns** that need unified inspection

## Current State: Two Incompatible Patterns

### Pattern 1: Hierarchical with `submachine()`
```typescript
// Runtime nesting - machines contain machines
const active = matchina(activeStates, {
  Empty: {
    typed: (value) => (ev) => {  // FUNCTION - can't inspect
      const suggestions = getSuggestions(value, ev.from.data.selectedTags);
      return suggestions.length > 0
        ? activeStates.Suggesting({...})
        : activeStates.TextEntry({...});
    }
  }
}, activeStates.Empty([]));

const machine = createHierarchicalMachine(
  matchina(topStates, {
    Inactive: { focus: "Active" },  // STRING - can inspect
    Active: { blur: () => (ev) => topStates.Inactive(ev.from.data.tags) }  // FUNCTION
  })
);
```

**Inspection approach**: Runtime introspection of nested machines
- ✅ Works for current active state
- ❌ Can't discover all possible states/transitions statically
- ❌ Requires running the machine

### Pattern 2: Flattened with `flattenMachineDefinition()`
```typescript
// Compile-time flattening - single-level machine
const def = defineMachine(
  defineStates({
    Inactive: ...,
    Active: defineSubmachine(activeStates, {
      Empty: { typed: "TextEntry" },  // STRING - can inspect
      TextEntry: { typed: "Suggesting" }  // STRING - can inspect
    })
  }),
  { Inactive: { focus: "Active" } },
  "Inactive"
);

const flattened = flattenMachineDefinition(def);
const machine = createMachineFromFlat(flattened);
```

**Inspection approach**: Use `_originalDef` for hierarchy, flattened transitions for edges
- ✅ Complete static structure
- ✅ All transitions known at definition time
- ❌ **Can't use functions for data-driven transitions**
- ❌ Loses Matchina's core flexibility

## The Combobox Case Study

### What It Needs (Runtime)
```typescript
typed: (value: string) => (ev) => {
  const selectedTags = ev.from.data.selectedTags;
  const suggestions = getSuggestions(value, selectedTags);

  // Decision tree based on runtime data
  if (!value.trim()) return activeStates.Empty(selectedTags);
  if (suggestions.length > 0) return activeStates.Suggesting({...});
  return activeStates.TextEntry({...});
}
```

### What Visualization Needs (Static)
```typescript
{
  Empty: {
    typed: "TextEntry" | "Suggesting" | "Empty"  // All possible targets
  }
}
```

**The conflict**: The function contains a decision tree that visualization needs to see, but functions are opaque.

## Current Visualization Code

From `matchina-machine-to-xstate-definition.ts`:
```typescript
Object.entries(machine.transitions).forEach(([fromKey, events]) => {
  Object.entries(events).forEach(([event, entry]) => {
    // Skip function transitions - they can't be statically resolved
    if (typeof entry === 'function') {
      return;  // ❌ VISUALIZATION SKIPS THESE
    }
    const resolved = resolveState(machine.states, fromKey, entry);
    definition.states[fromKey].on[event] = resolved.key;
  });
});
```

**Result**:
- ✅ Flattened machine shows hierarchy (from `_originalDef`)
- ❌ **No transitions shown** (all are functions, all skipped)
- ❌ **Text input doesn't work** (flattened transitions are wrong/missing)

## Architectural Solutions

### Option 1: Dual Representation (Recommended)
Maintain both static schema and runtime implementation:

```typescript
const comboboxDef = defineMachine(
  activeStates,
  {
    // Runtime implementation (functions)
    _transitions: {
      Empty: {
        typed: (value) => (ev) => {
          const suggestions = getSuggestions(value, ev.from.data.selectedTags);
          if (!value.trim()) return activeStates.Empty(ev.from.data.selectedTags);
          return suggestions.length > 0
            ? activeStates.Suggesting({...})
            : activeStates.TextEntry({...});
        }
      }
    },
    // Static schema (for inspection/visualization)
    _schema: {
      Empty: {
        typed: ["Empty", "TextEntry", "Suggesting"]  // All possible targets
      }
    }
  }
);
```

**Pros**:
- ✅ Full runtime flexibility
- ✅ Complete static visualization
- ✅ Type checking can verify schema matches implementation

**Cons**:
- ❌ Duplication (DRY violation)
- ❌ Schema can drift from implementation
- ❌ More verbose

### Option 2: Declarative Transition DSL
Create a declarative language for common transition patterns:

```typescript
const comboboxDef = defineMachine(
  activeStates,
  {
    Empty: {
      typed: when(
        (value, ev) => !value.trim(),
        then: () => activeStates.Empty(),
        else: when(
          (value, ev) => getSuggestions(value, ev.from.data.selectedTags).length > 0,
          then: (value, ev) => activeStates.Suggesting({...}),
          else: (value, ev) => activeStates.TextEntry({...})
        )
      )
    }
  }
);
```

**Pros**:
- ✅ Single source of truth
- ✅ Can be inspected (DSL is structured data)
- ✅ Type-safe

**Cons**:
- ❌ Complex DSL to design
- ❌ Limited to declarative patterns
- ❌ Loses flexibility for complex logic

### Option 3: TypeScript AST Analysis (Not Recommended)
Parse function bodies to extract transition targets:

**Pros**: None worth the cost

**Cons**:
- ❌ Extremely fragile
- ❌ Only works with simple functions
- ❌ Build-time complexity
- ❌ Won't work with imported helpers, complex logic, etc.

### Option 4: Constraint-Based (Hybrid)
Limit where functions can be used:

```typescript
// Top-level: only strings (for visualization)
const schema = defineMachine(
  activeStates,
  {
    Empty: {
      typed: "TextEntry",  // Static
      validate: "Suggesting" | "Empty"  // Static
    }
  }
);

// Implementation: augment with guards and actions
const machine = createMachineFrom(schema).setup({
  guards: {
    hasText: (ev) => ev.from.data.input.length > 0,
    hasSuggestions: (ev) => getSuggestions(...).length > 0
  },
  actions: {
    updateSuggestions: (ev) => ({ suggestions: getSuggestions(...) })
  }
});
```

Similar to XState's approach but may not fit Matchina's philosophy.

### Option 5: Typed Metadata Extension
Keep functions but require type-level metadata:

```typescript
const typed = transition<{
  from: ["Empty", "TextEntry", "Suggesting"],
  to: ["Empty", "TextEntry", "Suggesting"],
  event: "typed"
}>((value: string) => (ev) => {
  // Implementation
});

const comboboxDef = defineMachine(activeStates, {
  Empty: { typed },
  TextEntry: { typed },
  Suggesting: { typed }
});
```

Extract metadata at runtime via attached properties:
```typescript
if (typeof entry === 'function' && entry._transitionMeta) {
  // Use metadata for visualization
  const { to } = entry._transitionMeta;
  definition.states[fromKey].on[event] = to; // Array of possible targets
}
```

**Pros**:
- ✅ Keeps function flexibility
- ✅ Provides inspection capability
- ✅ Type-safe
- ✅ Minimal duplication

**Cons**:
- ❌ Metadata must be manually maintained
- ❌ Can drift from implementation

## Recommendation: Dual Representation with Validation

Combine Option 1 (Dual Representation) with runtime validation:

```typescript
interface MachineDefinitionWithSchema<S, T> {
  states: S;
  transitions: T;
  schema: TransitionSchema<S>;  // Static transition map
  initial: keyof S;
}

function defineMachineWithSchema<S, T, Schema>(
  states: S,
  transitions: T,
  schema: Schema,
  initial: string
) {
  // Runtime validation: check that transitions respect schema
  validateTransitionsAgainstSchema(transitions, schema);

  return {
    states,
    transitions,
    schema,  // Used for visualization
    initial
  };
}
```

### Benefits
1. **Visualization**: Use `schema` for complete transition graph
2. **Runtime**: Use `transitions` for actual behavior
3. **Safety**: Validation ensures they match
4. **Flexibility**: Functions can do anything, schema declares intent
5. **Tooling**: Schema enables static analysis, LSP features, etc.

## Action Items

1. **Document the tradeoff** (this doc) ✅
2. **Choose architecture**: Dual representation with validation
3. **Implement schema support** in `defineMachine`
4. **Update visualization** to use schema when available, fall back to runtime inspection
5. **Update examples**:
   - Combobox: Add schema alongside transitions
   - Traffic light: Show both patterns
   - Document when to use each
6. **Add validation**: Warn when schema and transitions diverge

## Migration Path

### Phase 1: Non-breaking addition
- Add optional `schema` parameter to `defineMachine`
- Visualization uses schema if present, else runtime inspection
- Examples show both with and without schema

### Phase 2: Encourage schema
- Document performance and tooling benefits
- Generate TypeScript types from schema
- LSP autocomplete for events based on schema

### Phase 3: Deprecate schema-less (optional)
- Warn when schema not provided for complex machines
- Provide CLI to generate schema from transitions (best-effort)

## Conclusion

The function vs. schema tension is fundamental and unavoidable. We must choose to:

1. **Accept duplication**: Maintain both for different purposes
2. **Constrain flexibility**: Limit functions, require declarative schemas
3. **Sacrifice visualization**: Accept that dynamic transitions can't be shown

**Recommendation**: Option 1 (Dual Representation) strikes the best balance for Matchina's philosophy of type-safe, flexible state machines with great DX.
