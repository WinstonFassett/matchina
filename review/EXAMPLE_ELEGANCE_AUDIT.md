# Example Elegance Audit

**Date**: 2025-12-31
**Ticket**: matchina-9lxq

## Elegance Principles

1. **Elegant states** = no parameters, no data (`undefined`)
2. **Elegant transitions** = just state name strings
3. **Data lives in stores**, not states
4. **Conditional logic in hooks**, not transition functions
5. **No `any` types** in user-facing code

## Audit Results

### ✅ ELEGANT Examples (No Issues)

| Example | Notes |
|---------|-------|
| `hsm-combobox/machine-flat.ts` | Store-based, simple states, string transitions |
| `hsm-checkout/machine.ts` | Uses `undefined` states, string transitions, HSM pattern |
| `hsm-traffic-light/machine.ts` | Uses `() => ({})` but transitions are strings |
| `async-calculator/machine.ts` | Uses `createPromiseMachine` - specialized pattern |

### ⚠️ MINOR Issues (Acceptable but could improve)

| Example | Issue | Severity |
|---------|-------|----------|
| `toggle/machine.ts` | ✅ FIXED - Now uses `undefined` | Done |
| `traffic-light/machine.ts` | ✅ FIXED - Now uses `undefined` | Done |
| `hsm-checkout/machine.ts` | ✅ FIXED - Now uses `undefined` | Done |
| `hsm-traffic-light/machine.ts` | ✅ FIXED - Now uses `undefined` | Done |

### ❌ MAJOR Violations - ALL FIXED

#### 1. `counter/machine.ts` ✅ FIXED
- ~~States with data~~ → Now uses `undefined` state
- ~~Functional transition~~ → Now uses string transitions
- ~~Mutates state data~~ → Now uses store for count

#### 2. `stopwatch/machine.ts` ✅ FIXED
- ~~States with data~~ → Now uses `undefined` states
- ~~Mutates state data~~ → Now uses store for elapsed/at

#### 3. `auth-flow/machine.ts` ✅ FIXED
- ~~States with complex data~~ → Now uses `undefined` states
- ~~Functional transitions~~ → Now uses string transitions
- Error handling moved to effect hook, form data in store

#### 4. `checkout/machine.ts` + `checkout/states.ts` ✅ FIXED
- ~~States with complex data~~ → Now uses `undefined` states
- ~~Functional transition~~ → Now uses string transitions
- Cart/shipping/payment data in store

#### 5. `rock-paper-scissors/machine.ts` + `states.ts` ✅ FIXED
- ~~States with data~~ → Now uses `undefined` states
- ~~Functional transitions~~ → Now uses string transitions
- Game logic in store and effect hook

#### 6. `fetcher-advanced/machine.ts` - DEFERRED
- Advanced pattern with legitimate complexity
- Uses specialized fetch handling
- Lower priority - works correctly

#### 7. `hsm-combobox/machine.ts` (hierarchical version) - DEFERRED
- Has working flat version (`machine-flat.ts`) that follows elegance principles
- Hierarchical version kept for comparison/demonstration
- Lower priority - flat version is the recommended pattern

## Summary

| Category | Count |
|----------|-------|
| Elegant (no issues) | 4 |
| Minor issues (all fixed) | 4 |
| **Major violations fixed** | **5** |
| Deferred (advanced/specialized) | 2 |

## Commits

1. `c2b396a7` - fix ev.machine undefined in effects
2. `2532e0ee` - counter, toggle, traffic-light elegance
3. `3197de68` - hsm-checkout, hsm-traffic-light elegance
4. `bacd6ea5` - update audit doc
5. `3e077f41` - stopwatch elegance
6. `2025fdfc` - auth-flow elegance
7. `4a3a27d5` - checkout elegance
8. `b13b3a78` - rock-paper-scissors elegance

## Pattern Applied

For each remediated example:
1. Created store with `createStoreMachine` for data
2. Simplified states to `undefined`
3. Used string transitions only
4. Moved conditional logic to effect hooks
5. Removed `any` types where possible
