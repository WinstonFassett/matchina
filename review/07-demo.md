# Matchina: Demo Review

## Demo as Validation Artifact

The demo site (`docs/`) serves as both documentation and validation of the library's capabilities. This review examines what the demos demonstrate, what they avoid, and any unrealistic patterns.

---

## Capabilities Demonstrated

### Core Features (Well Covered)

| Feature | Example | Validation |
|---------|---------|------------|
| Basic state machines | `traffic-light`, `toggle` | ✓ Simple transitions work |
| State data | `counter`, `stopwatch` | ✓ Data preserved across transitions |
| Pattern matching | All examples | ✓ `.match()` works for rendering |
| React integration | All examples | ✓ `useMachine` hook works |
| Lifecycle hooks | `stopwatch-*` variants | ✓ `enter`, `leave`, `effect` work |
| Promise machines | `fetcher-*`, `async-calculator` | ✓ Async state management works |
| Hierarchical machines | `hsm-checkout`, `hsm-combobox` | ✓ Child-first routing works |

### HSM Features (Partially Covered)

| Feature | Example | Validation |
|---------|---------|------------|
| `child.exit` transitions | `hsm-checkout` | ✓ Parent reacts to child completion |
| Event propagation | `hsm-combobox` | ✓ Events route to children |
| `submachine()` helper | Both HSM examples | ✓ Child embedding works |
| Flattening | `hsm-nested-vs-flattened` | ⚠️ Minimal - just shows it exists |

---

## What Demos Avoid or Work Around

### 1. Direct Source Imports

**Pattern observed** in HSM examples:
```typescript
// hsm-checkout/machine.ts
import { submachine } from "../../../../../src/nesting/submachine";
import { createHierarchicalMachine } from "../../../../../src/nesting/propagateSubmachines";

// hsm-combobox/machine.ts
import { defineMachine } from "../../../../../src/definitions";
```

**Issue**: These imports bypass the public API (`matchina` package) and reach directly into source files. This suggests:
- These APIs may not be properly exported
- Or the path aliases aren't configured for these modules

### 2. Type Annotations with `any`

**Pattern observed**:
```typescript
// hsm-checkout/machine.ts:86
setup(hierarchical)(
  effect((ev: any) => {  // ⚠️ any type
    if (ev.type === "restart") {
      const payment = getPayment();
      payment?.reset();
      return true;
    }
  })
);

// hsm-combobox/machine.ts:407
let combobox: any;
let hierarchical: any;
```

**Issue**: Type inference isn't working well enough for HSM, requiring `any` casts.

### 3. Duplicated Transition Logic

**Pattern observed** in `hsm-combobox/machine.ts`:
- `createActiveMachine()` (lines 93-238) 
- `createActiveForApp()` (lines 246-395)

Both contain nearly identical transition logic (~150 lines duplicated). This suggests:
- Difficulty parameterizing machine creation
- Or workaround for some limitation

### 4. Manual Child Access

**Pattern observed**:
```typescript
// hsm-checkout/machine.ts:80-83
const getPayment = () => {
  const state = hierarchical.getState();
  return state.is("Payment") ? state.data.machine : null;
};
```

**Issue**: No typed accessor for child machines. Users must manually check state and access `.data.machine`.

### 5. Visualization Workarounds

**Pattern observed**:
```typescript
// hsm-checkout/machine.ts:39
createPayment.def = paymentDef;

// hsm-combobox/machine.ts:241
createActiveMachine.def = activeDef;
```

**Issue**: Attaching `.def` for visualization is a manual workaround, not a built-in feature.

---

## Unrealistic Usage Patterns

### 1. Callback Injection for Side Effects

**Pattern** in `hsm-combobox/machine.ts`:
```typescript
function createActiveMachine({ onTagsChange }: { onTagsChange?: (tags: string[]) => void }) {
  // ...
  onTagsChange?.(newTags);
  // ...
}
```

**Reality**: This pattern works but isn't documented. Users might expect to use lifecycle hooks instead.

### 2. State Identity Checks

**Pattern** in `hsm-checkout/machine.ts`:
```typescript
return state.is("Payment") ? state.data.machine : null;
```

**Reality**: This is the correct pattern, but it's verbose. A typed accessor would be more ergonomic.

### 3. Effect Return Values

**Pattern**:
```typescript
effect((ev: any) => {
  if (ev.type === "restart") {
    // ...
    return true;  // ⚠️ What does this do?
  }
})
```

**Reality**: Effect return values aren't documented. The `return true` appears to be cargo-culted.

---

## Missing Demo Coverage

### Not Demonstrated

| Feature | Status |
|---------|--------|
| StoreMachine | No interactive example |
| Guard rejection | No example shows blocked transitions |
| Error handling | No example shows error recovery |
| Machine disposal | No example shows cleanup |
| Server-side usage | All examples are React-only |
| Validation integrations | Zod/Valibot only in usage files |
| Deep nesting (3+ levels) | Only 2-level hierarchy shown |
| Parallel transitions | Not supported, not shown |

### Partially Demonstrated

| Feature | Example | Gap |
|---------|---------|-----|
| Flattening | `hsm-nested-vs-flattened` | No interactive comparison |
| Effects system | `stopwatch-*` | No dedicated effects example |
| `onLifecycle` | `stopwatch-using-lifecycle` | Minimal usage |
| `transitionHooks` | `stopwatch-using-transition-hooks` | Minimal usage |

---

## Demo Quality Assessment

### Strengths

1. **Interactive examples**: All demos are runnable with source code
2. **Progressive complexity**: Simple → Complex progression
3. **Real-world scenarios**: Checkout, tag editor, fetcher are practical
4. **Multiple approaches**: Stopwatch variants show different patterns

### Weaknesses

1. **HSM examples bypass public API**: Direct source imports
2. **Type safety gaps**: `any` casts in HSM examples
3. **Code duplication**: `hsm-combobox` has ~150 lines duplicated
4. **Missing error cases**: No demos show failure handling
5. **No StoreMachine demo**: Major feature without interactive example

---

## Recommendations for Demo Improvement

1. **Export HSM APIs properly**: `submachine`, `defineMachine`, `createHierarchicalMachine` should be importable from `matchina`
2. **Add typed child accessors**: Reduce boilerplate for accessing child machines
3. **Create StoreMachine example**: Interactive counter or form state
4. **Add error handling example**: Show guard rejection and recovery
5. **Deduplicate hsm-combobox**: Extract shared transition logic
