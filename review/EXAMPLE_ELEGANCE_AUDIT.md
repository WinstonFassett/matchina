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
| `toggle/machine.ts` | States use `() => ({})` instead of `undefined` | Low |
| `traffic-light/machine.ts` | States have `message` data: `Red: () => ({ message: "Stop" })` | Low |
| `hsm-checkout/machine.ts` | Some states use `() => ({})` | Low |

### ❌ MAJOR Violations (Need Remediation)

#### 1. `counter/machine.ts`
- **States with data**: `Active: (count: number = 0) => ({ count })`
- **Functional transition**: `reset: () => () => states.Active(0)`
- **Mutates state data in effects**: `ev.to.data.count = ev.from.data.count + 1`
- **Should use**: Store for count, simple transitions

#### 2. `stopwatch/machine.ts`
- **States with data**: `Stopped: (elapsed = 0) => ({ elapsed })`
- **States with complex data**: `Ticking: (elapsed = 0) => ({ elapsed, at: Date.now() })`
- **Mutates state data in hooks**: `ev.to.data.elapsed = ...`
- **Should use**: Store for elapsed/at, simple states

#### 3. `auth-flow/machine.ts`
- **States with complex data**: `LoginForm`, `RegisterForm`, `LoggedIn` all have data
- **Functional transitions with conditionals**: 
  ```typescript
  failure: (error: string) => ({ from }) => states.LoginForm({...})
  ```
- **Should use**: Store for form data, simple states, error handling in hooks

#### 4. `checkout/machine.ts` + `checkout/states.ts`
- **States with complex data**: `Cart`, `Shipping`, `Payment` all have data
- **Functional transition**: `newOrder: () => states.Cart({...})`
- **Should use**: Store for cart/shipping/payment data

#### 5. `rock-paper-scissors/machine.ts` + `states.ts`
- **States with data**: All states have score/move data
- **Functional transitions with conditionals**:
  ```typescript
  selectMove: (move: Move) => ({ from }) => states.PlayerChose(...)
  nextRound: () => ({ from }) => { if (playerScore >= 5)... }
  ```
- **Should use**: Store for scores/moves, simple states, game logic in hooks

#### 6. `fetcher-advanced/machine.ts`
- **States with data**: `Fetching`, `ProcessingResponse`, `Resolved`, `Error` have data
- **Uses `any` type**: `Resolved: (data: any) => data`
- **Should use**: Store for fetch state, typed data

#### 7. `hsm-combobox/machine.ts` (hierarchical version)
- **States with data**: `activeStates` all have parameters
- **Functional transitions with conditionals**: `handleTyped`, `handleAddTag`
- **Uses `any` type**: `(ev: any)` in handlers
- **Note**: The flat version (`machine-flat.ts`) is correct

## Summary

| Category | Count |
|----------|-------|
| Elegant (no issues) | 4 |
| Minor issues | 3 |
| **Major violations** | **7** |

## Remediation Priority

### High Priority (Core examples users will copy)
1. `counter/machine.ts` - Simple example, should be perfect
2. `stopwatch/machine.ts` - Common use case
3. `auth-flow/machine.ts` - Real-world pattern

### Medium Priority
4. `checkout/machine.ts` - Complex but important
5. `rock-paper-scissors/machine.ts` - Game example

### Lower Priority (Advanced examples)
6. `fetcher-advanced/machine.ts` - Advanced pattern
7. `hsm-combobox/machine.ts` - Has working flat version

## Recommended Approach

For each example needing remediation:
1. Create a store for data (using `createStoreMachine`)
2. Simplify states to `undefined` or minimal markers
3. Use string transitions only
4. Move conditional logic to effect hooks
5. Remove `any` types
