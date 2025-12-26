# Matchina: Documentation & Examples Review

## Documentation Structure

### Root Level
- `README.md` — Comprehensive (875 lines), covers all features with code examples
- `CLAUDE.md` — AI assistant guidance, architecture overview
- `AGENTS.md` — Session workflow, beads usage

### Docs Site (`docs/src/content/docs/`)
- **Guides**: 15 MDX files covering concepts
- **Examples**: 27 MDX files with interactive demos
- **API Reference**: Auto-generated TypeDoc

### Code Examples (`docs/src/code/examples/`)
- 30+ example directories
- Each follows pattern: `machine.ts`, `*View.tsx`, `example.tsx`, `index.tsx`

---

## Drift Between Docs and Code

### 1. README vs Actual API

| README Says | Code Does | Issue |
|-------------|-----------|-------|
| `createHierarchicalMachine` wraps machines | Yes, but also calls `propagateSubmachines` internally | Not clear they're coupled |
| `child.exit` transitions when child reaches final state | Also triggers when child has empty transitions | Implicit behavior undocumented |
| `data.final` marks final states | Also checks for empty transitions object | Two mechanisms, one documented |

### 2. Lifecycle Diagram vs Implementation

**Docs (`lifecycle.mdx`)** shows:
```
send → resolveExit → guard → handle → before → update → effect → leave → enter → notify → after
```

**Code (`event-lifecycle.ts`)** shows:
```typescript
effect(ev: E) {
  lifecycle.leave(ev); // left previous
  lifecycle.enter(ev); // entered next
}
```

**Issue**: Docs show `leave` and `enter` as separate steps after `effect`, but code shows `effect` calls `leave` then `enter` internally.

### 3. Machines Guide vs API

**Docs (`machines.mdx:19`)** shows:
```ts
const {(getState, send)} = fsm(states, transitions, initialState)
```

**Issue**: `fsm` is not an exported function. Should be `createMachine` or `matchina`.

### 4. Hierarchical Docs vs Implementation

**Docs (`hierarchical-machines.mdx`)** says:
> "Child-first event routing: Events route to deepest child first"

**Code (`propagateSubmachines.ts`)** does:
1. Descend to deepest child
2. Try handling at each level going back up
3. First handler wins

**Issue**: Docs don't explain the "bubble up on failure" behavior.

---

## Missing Explanations

### 1. When to Use Which Machine Creation Function

| Function | Documented | Missing |
|----------|------------|---------|
| `createMachine` | ✓ | When to prefer over `matchina` |
| `matchina` | ✓ | Trade-offs vs `createMachine` |
| `createMachineFrom` | ✗ | Not documented |
| `createMachineFromFlat` | ✗ | Not documented |
| `defineMachine` | ✗ | Not documented |

### 2. Flattening vs Propagation

**Documented**: Both approaches exist
**Missing**: 
- When to choose flattening vs propagation
- Performance implications
- Type inference differences
- Migration path between approaches

### 3. Hook Registration Patterns

**Documented**: `setup(machine)(guard(...), enter(...))`
**Missing**:
- `transitionHook()` vs `transitionHooks()` vs `onLifecycle()`
- When to use which pattern
- Composition patterns

### 4. Store Machine

**Documented**: Basic usage in README
**Missing**:
- Dedicated guide page
- Comparison with FactoryMachine
- When to use StoreMachine vs FactoryMachine

### 5. Error Handling

**Missing entirely**:
- What happens when transitions fail
- Guard rejection behavior
- Promise machine error states
- Debugging strategies

---

## Examples That Misrepresent Behavior

### 1. Traffic Light Example

**Example shows**:
```ts
Red: { next: "Green" },
Yellow: { next: "Red" },
Green: { next: "Yellow" },
```

**Potential confusion**: Uses string shortcuts without explaining that parameters are auto-forwarded. A user might think data is lost on transition.

### 2. HSM Checkout Example

**Example shows**:
```ts
Payment: { 
  "child.exit": "Review"  // When payment completes, go to review
}
```

**Missing context**: Doesn't show how to access child's final state data in the transition. The `child.exit` handler receives params but this isn't demonstrated.

### 3. Promise Machine Examples

**Example shows**:
```ts
const adder = createPromiseMachine(
  (a: number, b: number) => new Promise<number>(...)
);
```

**Missing**: 
- What happens if you call `execute()` when not in `Idle` state (throws)
- How to reset to Idle after completion
- Error handling patterns

### 4. Lifecycle Hooks Example

**README shows**:
```ts
setup(counter)(
  guard((ev) => { ... }),
  enter((ev) => { ... }),
  leave((ev) => { ... }),
  bindEffects({ ... }),
);
```

**Issue**: `bindEffects` signature in example doesn't match actual API:
```ts
// Actual API
bindEffects(machine, getEffects, matchers, exhaustive?)
// Example shows
bindEffects({ Notify: (data) => { ... } })
```

---

## Documentation Quality Issues

### Broken Links (Verified)

| File | Invalid Link | Issue |
|------|--------------|-------|
| `traffic-light-extended.mdx` | `/matchina/guides/nested-states` | **No file** - should be `/matchina/guides/hierarchical-machines` |
| `traffic-light-extended.mdx` | `/matchina/guides/history` | **No file** - page doesn't exist |
| `traffic-light.mdx` | `/matchina/guides/matchbox-typescript-inference` | **No file** - might mean `machine-inference` |
| `fetcher-advanced.mdx` | `/matchina/guides/matchbox-typescript-inference` | **No file** - same as above |
| `machines.mdx` | `/matchina/lifecycle/` | **Missing path** - should be `/matchina/guides/lifecycle/` |
| `machines.mdx` | `/matchina/effects/` | **Missing path** - should be `/matchina/guides/effects/` |
| `machines.mdx` | `/matchina/promises/` | **Missing path** - should be `/matchina/guides/promises/` |
| `machines.mdx` | `/matchina/react/` | **Missing path** - should be `/matchina/guides/react/` |
| `machines.mdx` | `/matchina/matchbox/` | **Missing path** - should be `/matchina/guides/matchbox-factories/` |

### Inconsistent Terminology

| Term 1 | Term 2 | Context |
|--------|--------|---------|
| "Factory Machine" | "State Machine" | Used interchangeably |
| "matchbox" | "tagged union" | Same concept |
| "key" | "tag" | State identifier |
| "send" | "dispatch" | Event triggering |

### Outdated Content

**README duplicates**:
- "Philosophy & Inspiration" section appears twice (lines 13-24 and 20-24)
- "What is Matchina?" section appears twice (lines 2-11 and 26-28)
- "Installation" section appears twice (lines 54-58 and 674-678)

---

## Example Coverage

### Well-Covered Features
- Basic state machines (traffic light, toggle, counter)
- Promise machines (fetcher, async-calculator)
- Lifecycle hooks (stopwatch variants)
- React integration (all examples)

### Under-Covered Features
- Store machines (only `usage-store.ts`, no interactive example)
- Flattening (`hsm-nested-vs-flattened` exists but minimal)
- Effects system (no dedicated example)
- Validation integrations (Zod, Valibot — only usage files)

### Missing Examples
- Guard rejection handling
- Complex transition functions with event context
- Multiple hook composition
- Machine cleanup/disposal
- Server-side usage (non-React)

---

## Summary

### Strengths
- Interactive examples with source code
- Good coverage of basic use cases
- Clear quick start path

### Weaknesses
- Drift between README and actual API
- Missing documentation for advanced features
- Inconsistent terminology
- Broken internal links
- No dedicated StoreMachine guide
- Flattening API undocumented
