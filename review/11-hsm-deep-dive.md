# Matchina: HSM Deep Dive

This document explores hierarchical state machine approaches in depth to inform Decision 1.

---

## The Core Question

**How should Matchina support machine composition?**

Developers want to compose machines. The "how" is flexible, but we need to decide on an approach that:
1. Works reliably
2. Can be visualized as hierarchy
3. Has good type safety
4. Fits the "static is good for FSM" philosophy

---

## Current Approaches

### Approach A: Flattening (Compile-Time)

**Location**: `src/definitions.ts`

**Mechanism**: Transform nested machine definitions into flat dot-separated keys at definition time.

```typescript
// Input: Nested definition
{
  Working: defineSubmachine(lightStates, { Red: { tick: "Green" }, ... }, "Red"),
  Broken: undefined
}

// Output: Flattened keys
{
  "Working": ...,
  "Working.Red": ...,
  "Working.Green": ...,
  "Working.Yellow": ...,
  "Broken": ...
}
```

**Implementation Size**: ~150 lines in `definitions.ts`

**Current Status**: Marked "EXPERIMENTAL", less used in demos

### Approach B: Propagation (Runtime)

**Location**: `src/nesting/propagateSubmachines.ts`

**Mechanism**: Wire parent and child machines at runtime for event routing.

```typescript
// Child embedded in state data
const states = defineStates({
  Working: submachine(() => createLightMachine()),
  Broken: undefined
});

// Propagation wires event routing
const hierarchical = createHierarchicalMachine(machine);
```

**Implementation Size**: 375 lines in `propagateSubmachines.ts`

**Current Status**: Used in demos, but described as "PITA"

---

## Detailed Comparison

### Complexity

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| Implementation LOC | ~150 | ~375 |
| Recursive logic | At definition time | At runtime |
| State representation | Single flat machine | Nested machine instances |
| Event routing | Standard (flat keys) | Custom descent/bubble logic |

**Winner**: Flattening (simpler implementation)

### Type Safety

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| State keys | Template literal types | Duck-typed `state.data.machine` |
| Transitions | Standard transition types | Requires `any` casts |
| Child access | Direct by key | Manual `.is()` + `.data.machine` |
| IDE support | Good (flat keys) | Poor (dynamic structure) |

**Winner**: Flattening (better type inference potential)

### Flexibility

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| Dynamic children | No (static structure) | Yes (created on demand) |
| Shared children | No (each instance separate) | Possible |
| Late binding | No | Yes |
| Independent child lifecycle | No | Yes |

**Winner**: Propagation (more flexible)

### Visualization

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| Structure available | At definition time | At runtime only |
| Hierarchy visible | Via dot-notation parsing | Via machine traversal |
| Static analysis | Possible | Difficult |

**Winner**: Flattening (static structure easier to visualize)

### Philosophy Fit

| Aspect | Flattening | Propagation |
|--------|------------|-------------|
| "Static is good for FSM" | ✓ Aligns | ✗ Dynamic |
| Predictability | High | Medium |
| Debugging | Easier (flat) | Harder (nested) |

**Winner**: Flattening (aligns with FSM philosophy)

---

## Use Cases Analysis

### Use Case 1: Checkout Flow

**Scenario**: Cart → Shipping → Payment (with substates) → Review → Confirmation

**With Flattening**:
```typescript
// States become:
"Cart", "Shipping", "Payment", "Payment.MethodEntry", "Payment.Authorizing", 
"Payment.Authorized", "Review", "Confirmation"

// Transitions reference flat keys
Payment: { "child.exit": "Review" }  // or just: "Payment.Authorized": { next: "Review" }
```

**With Propagation**:
```typescript
// Separate machines
const paymentMachine = createPaymentMachine();
const checkoutMachine = createCheckoutMachine(); // embeds payment

// Event routing handled at runtime
```

**Analysis**: Flattening works well here. The structure is static and known at design time.

### Use Case 2: Dynamic Form Wizard

**Scenario**: Steps determined at runtime based on user choices

**With Flattening**: Difficult — structure must be known at definition time

**With Propagation**: Natural — child machines created based on context

**Analysis**: Propagation needed for truly dynamic structures.

### Use Case 3: Plugin System

**Scenario**: Third-party machines plugged into host application

**With Flattening**: Impossible — can't flatten unknown definitions

**With Propagation**: Possible — loose coupling allows runtime composition

**Analysis**: Propagation needed for plugin architectures.

---

## The Key Question

**Are dynamic/plugin use cases important for Matchina?**

If the answer is "no" or "rarely", flattening is the better choice:
- Simpler implementation
- Better type safety
- Aligns with FSM philosophy
- Easier visualization

If the answer is "yes", we need propagation or a hybrid approach.

---

## Alternative Approaches to Explore

### Alternative 1: Flattening Only

Remove propagation entirely. Accept that dynamic composition isn't supported.

**Pros**: Simplest, best types, easiest to maintain
**Cons**: Loses flexibility for edge cases

### Alternative 2: Flattening Primary, Propagation Escape Hatch

Flattening is the recommended approach. Propagation exists but is documented as "advanced/escape hatch" for dynamic cases.

**Pros**: Best of both worlds
**Cons**: Two mental models, maintenance burden

### Alternative 3: Improved Flattening with Runtime Helpers

Flattening for structure, but add runtime helpers for common patterns:
- `getActiveLeafState(machine)` — returns deepest active state
- `isInState(machine, "Working.Red")` — hierarchical state check
- `getStateStack(machine)` — returns path from root to leaf

**Pros**: Static structure with ergonomic runtime access
**Cons**: Need to design and implement helpers

### Alternative 4: Definition-Based Composition

Instead of runtime propagation, allow composing definitions:

```typescript
const paymentDef = defineMachine(paymentStates, paymentTransitions, "MethodEntry");
const checkoutDef = defineMachine(checkoutStates, {
  ...checkoutTransitions,
  Payment: { ...paymentDef }  // Embed definition, not instance
});

// Single machine created from composed definition
const checkout = createMachineFromDef(checkoutDef);
```

**Pros**: Static, composable, good for viz
**Cons**: New API pattern, may be complex to implement

---

## Visualization Requirements

Regardless of approach, we need:

1. **Definition access at runtime**: For visualizers to render structure
2. **Hierarchy representation**: Either nested objects or parseable dot-keys
3. **Current state indication**: Which states are active

### Flattening Visualization Strategy

```typescript
// Dot-keys can be parsed into hierarchy
const keys = ["Working", "Working.Red", "Working.Green", "Broken"];

// Parse into tree
{
  Working: { Red: {}, Green: {}, Yellow: {} },
  Broken: {}
}

// Current state: "Working.Red"
// Highlight path: Working → Red
```

This is straightforward and doesn't require runtime machine traversal.

---

## Recommendation

**Primary**: Flattening with improved visualization

**Rationale**:
1. Simpler implementation (150 vs 375 lines)
2. Better type safety potential
3. Aligns with "static is good for FSM"
4. Easier to visualize (static structure)
5. User feedback: "flattening worked almost immediately"

**For dynamic cases**: Document as unsupported or provide minimal escape hatch

---

## Open Questions

1. **Can we improve flattening's type inference?** Need to investigate the template literal type issues.

2. **What visualization format do we need?** JSON tree? Mermaid? Custom format?

3. **Should we keep propagation at all?** Or remove it entirely?

4. **How do other libs handle this?**
   - XState: Nested states in single machine definition
   - Robot: Flat states only
   - Stately: Visual editor produces nested definitions

---

## Next Steps

1. Prototype improved flattening types
2. Build visualization from dot-keys
3. Decide: keep propagation as escape hatch or remove?
4. Update demos to use flattening if we proceed
