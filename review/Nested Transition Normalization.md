# Nested State Transition Normalization

## Problem
The `Active.type` transition in the combobox is being rendered incorrectly because it's defined on the parent state but should be from the initial nested state.

## Machine Structure
```typescript
Active: {
  initial: 'Empty',           // ← Initial nested state
  states: {
    Empty: {},               // ← This is where the machine starts
    Suggesting: { on: { select: 'Empty' } }
  },
  on: { type: 'Suggesting', blur: '^Inactive' }  // ← Transition from parent state
}
```

## Current Issue
- **Before**: `Active.type: 'Suggesting'` (parent to nested)
- **After**: `Active_Empty.type: 'Active_Suggesting'` (nested to nested)

## What Needs to Be Fixed
1. Detect when a transition is from a parent state to a nested state
2. Change the `fromId` to be the initial nested state of that parent
3. For `Active`, the initial nested state is `Empty`, so `fromId` should be `Active_Empty`

## Current Bug
My normalization is creating a self-loop:
```
Active_Suggesting.type -> Active_Suggesting  // WRONG
```

Instead of:
```
Active_Empty.type -> Active_Suggesting       // CORRECT
```

## Solution
Fix the logic to properly use the initial nested state as the `fromId` when normalizing parent state transitions.
