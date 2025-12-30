# HSM Combobox Refactor

## Philosophy: Transition Functions are Footguns

This refactor demonstrates a cleaner approach to state machines by:

1. **Minimizing transition functions** - They're only used for complex state logic, not simple store dispatches
2. **Using hooks for store updates** - Most state mutations happen in a dedicated hook
3. **Simplified machine definitions** - Transitions are just state-to-state mappings

## Before vs After

### Before (Transition Functions Everywhere)
```typescript
// Verbose transition functions that just dispatch to store
typed: (value: string) => {
  store.dispatch('setInput', value);
  return states["Active.Typing"]();
},
removeTag: (tag: string) => {
  store.dispatch('removeTag', tag);
  return states["Active.Empty"]();
},
```

### After (Clean State Transitions + Hook)
```typescript
// Machine: Simple state transitions
typed: "Active.Typing",
removeTag: "Active.Empty",

// Hook: Handles all store updates
export function createComboboxStoreHook(store: any) {
  return effect((ev: any) => {
    switch (ev.type) {
      case 'typed': store.dispatch('setInput', ev.params[0]); break;
      case 'removeTag': store.dispatch('removeTag', ev.params[0]); break;
    }
  });
}
```

## Benefits

- **Cleaner machine definitions** - No verbose transition functions
- **Centralized state logic** - All store mutations in one place
- **Better separation of concerns** - Machine handles flow, hook handles state
- **Type safety** - Proper StoreChange typing instead of `any`
- **Maintainability** - Easier to modify state logic without touching machine structure

## Usage Pattern

1. **Machine handles state flow** - Simple transitions between states
2. **Hook handles state mutations** - Store updates based on events
3. **Components dispatch events** - `machine.send('typed', value)`
4. **Store reflects current state** - Components read from store for UI

This approach treats transition functions as a feature to be used sparingly, not the default pattern.

## Comparison: Hierarchical vs Flat

The original `machine.ts` shows the **problematic approach** with complex transition functions:

```typescript
// Complex transition functions everywhere
const handleTyped = (value) => (ev) => {
  const { selectedTags } = ev.from.data;
  if (!value.trim()) return activeStates.Empty(selectedTags);
  const suggestions = getSuggestions(value, selectedTags);
  return suggestions.length > 0
    ? activeStates.Suggesting(value, selectedTags, suggestions, 0)
    : activeStates.TextEntry(value, selectedTags);
};
```

The refactored `machine-flat.ts` shows the **clean approach**:

```typescript
// Simple state transitions
typed: "Active.Typing",

// Store hook handles the logic
case 'typed':
  if (ev.params && ev.params[0] !== undefined) {
    store.dispatch('setInput', ev.params[0]);
  }
  break;
```
