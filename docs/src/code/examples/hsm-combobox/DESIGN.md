# HSM Combobox Design Document

## Overview

This example demonstrates two different approaches to building hierarchical state machines (HSMs) in matchina:

1. **Flat Machine** (`machine-flat.ts`) - Uses `describeHSM` for declarative hierarchical definition
2. **Nested Machine** (`machine.ts`) - Uses `submachine` + `makeHierarchical` for true nested machines

## Core Behaviors & Principles

### What We're Demonstrating

#### 1. Hierarchical State Management
- **Parent State**: `Active` (combobox is focused)
- **Child States**: `Empty`, `Typing`, `TextEntry`, `Suggesting`
- **State Inheritance**: Child states inherit parent transitions (like `deactivate`)

#### 2. Auto-Transitions Based on Data
- **Empty** → **Typing**: When user starts typing
- **Typing** → **Suggesting**: When suggestions are available
- **Typing** → **TextEntry**: When input exists but no suggestions
- **Typing** → **Empty**: When input is cleared

#### 3. Store-First Architecture
- **Machine**: Controls state transitions only
- **Store**: Manages all data (input, suggestions, selected tags)
- **UI**: Uses store data directly, never machine state data

#### 4. Event Handling Patterns
- **UI Events**: Trigger store updates and machine transitions
- **Auto-Transitions**: Hook monitors store state and triggers transitions
- **User Actions**: Keyboard navigation, selection, deactivation

## Design Principles

### ✅ Do's (Elegant Design)

1. **Separation of Concerns**
   - Machine: State transitions only
   - Store: Data management only  
   - Hook: Bridge between store and machine
   - UI: Store consumption only

2. **Minimal Static Transitions**
   - Use simple string transitions: `typed: "Typing"`
   - Avoid functional transitions with logic
   - Let hooks handle dynamic behavior

3. **Proper HSM Structure**
   - Parent states contain child states
   - Children inherit parent transitions
   - Use `^Inactive` for parent transitions (flat) or inherited transitions (nested)

4. **Store API Exposure**
   - Machine exposes store methods: `machine.addTag()`, `machine.removeTag()`
   - UI calls store directly: `machine.store.dispatch()`
   - Never access data from machine state

### ❌ Don'ts (Anti-Patterns)

1. **Data in Machine State**
   - ❌ `machine.state.data.input`
   - ✅ `machine.store.getState().input`

2. **Functional Transitions**
   - ❌ `typed: () => { /* complex logic */ }`
   - ✅ `typed: "Typing"`

3. **UI Event Transitions in Machine**
   - ❌ `machine.onKeyDown()`
   - ✅ UI handles events, calls machine/store

4. **Manual Flattening**
   - ❌ `Active_Typing`, `Active_Suggesting`
   - ✅ True hierarchical structure

## Machine Comparison

### Flat Machine (`describeHSM`)

**Pros:**
- Declarative hierarchical definition
- Automatic flattening to single machine
- Simple hook logic (handles standard events)
- No propagation complexity

**Cons:**
- Less explicit about nested structure
- Limited to declarative patterns

**Structure:**
```typescript
describeHSM({
  initial: 'Inactive',
  states: {
    Inactive: { on: { focus: 'Active' } },
    Active: {
      initial: 'Empty',
      states: {
        Empty: { on: { typed: 'Typing', deactivate: '^Inactive' } },
        Typing: { on: { toSuggesting: 'Suggesting', /* ... */ } },
        // ...
      },
      on: { deactivate: '^Inactive' }
    }
  }
})
```

### Nested Machine (`submachine` + `makeHierarchical`)

**Pros:**
- Explicit nested machine instances
- True hierarchical structure
- More flexible for complex scenarios
- Clear separation of parent/child

**Cons:**
- Requires propagation (`makeHierarchical`)
- More complex event handling (`child.change`)
- Hook needs to handle submachine events

**Structure:**
```typescript
const activeMachine = submachine(createActiveMachine, { id: "active" });
const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachine
});
const hierarchical = makeHierarchical(matchina(appStates, transitions));
```

## Hook Design Analysis

### Current Hook Problems

#### 1. Repetitive Boilerplate
```typescript
// UGLY - repeated everywhere
if (currentMachine && typeof currentMachine.send === 'function') {
  currentMachine.send("toSuggesting");
}
```

#### 2. Complex Event Switch
```typescript
// UGLY - massive switch statement
switch (ev.type) {
  case 'typed': /* 20 lines */ break;
  case 'highlight': /* 10 lines */ break;
  case 'selectHighlighted': /* 5 lines */ break;
  // ...
}
```

#### 3. Mixed Responsibilities
```typescript
// UGLY - hook doing too much
store.dispatch('typed', ev.params[0]);           // Store update
currentMachine.send("toSuggesting");          // Machine transition
store.dispatch('highlightNext');               // Store update
currentMachine.send("highlightNext");         // Machine transition
```

### Elegant Hook Design

#### Core Responsibilities
1. **Store Updates**: Dispatch store actions
2. **Auto-Transitions**: Monitor store, trigger machine transitions
3. **Event Delegation**: Forward events to appropriate targets

#### Clean Pattern
```typescript
function createComboboxHook(store) {
  let machine = null;
  
  return effect((ev) => {
    if (ev.machine) machine = ev.machine;
    
    // Store updates
    if (ev.type === 'typed') store.dispatch('typed', ev.params[0]);
    if (ev.type === 'highlight') store.dispatch('highlightNext');
    
    // Auto-transitions
    if (ev.type === 'typed') {
      setTimeout(() => {
        const state = store.getState();
        machine.send(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
      }, 0);
    }
  });
}
```

#### Key Improvements
1. **Eliminate Repetitive Checks**: `machine?.send?.()` instead of verbose checks
2. **Separate Concerns**: Store updates first, auto-transitions second
3. **Reduce Boilerplate**: Use ternary operators, early returns
4. **Single Responsibility**: Each event type does one thing

## Event Flow Architecture

### Flat Machine Flow
```
UI Event → Hook → Store Update → Auto-Transition → Machine → UI Update
```

### Nested Machine Flow  
```
UI Event → Hook → Store Update → Child Change → Hook → Auto-Transition → Machine → UI Update
```

### Key Differences
- **Flat**: Direct event handling
- **Nested**: Additional `child.change` propagation step

## Implementation Guidelines

### For Flat Machines
1. Use `describeHSM` for hierarchical definition
2. Use `^Inactive` for parent transitions
3. Hook handles standard events (`typed`, `highlight`, etc.)
4. Auto-transitions based on store state

### For Nested Machines
1. Use `submachine` + `makeHierarchical`
2. Parent states inherit transitions automatically
3. Hook handles `child.change` events for auto-transitions
4. More complex event propagation

### Store Design
1. **Single Source of Truth**: All data in store
2. **Action-Based Updates**: `store.dispatch('action', payload)`
3. **Computed State**: Suggestions derived from input + selected tags
4. **No Machine Data**: Never store data in machine state

### UI Design
1. **Store Consumption**: Use `machine.store.getState()`
2. **Event Triggering**: Call machine actions, not store directly
3. **State Rendering**: Based on store state, not machine state
4. **Keyboard Handling**: UI responsibility, not machine

## Testing Strategy

### Unit Tests
- **Machine Transitions**: Test state changes
- **Store Logic**: Test data updates
- **Hook Behavior**: Test event handling

### Integration Tests
- **User Workflows**: Type → Suggestions → Select
- **Keyboard Navigation**: Arrow keys, enter, escape
- **State Consistency**: Store vs UI sync

### Browser Tests
- **Visual Regression**: Ensure UI renders correctly
- **Interaction Testing**: Real user behavior
- **Cross-Browser**: Compatibility testing

## Common Pitfalls

### 1. Mixing Data and State
```typescript
// ❌ WRONG - data in machine
machine.state.data.input

// ✅ RIGHT - data in store
machine.store.getState().input
```

### 2. Functional Transitions
```typescript
// ❌ WRONG - logic in transitions
typed: () => { /* complex logic */ }

// ✅ RIGHT - static transitions
typed: "Typing"
```

### 3. UI Events in Machine
```typescript
// ❌ WRONG - UI logic in machine
machine.onKeyDown = (e) => { /* ... */ }

// ✅ RIGHT - UI handles events
<input onKeyDown={(e) => machine.typed(e.target.value)} />
```

### 4. Manual State Management
```typescript
// ❌ WRONG - manual state tracking
const [input, setInput] = useState();

// ✅ RIGHT - store manages state
const input = machine.store.getState().input;
```

## Future Improvements

### Hook Abstraction
- Create reusable hook patterns
- Reduce boilerplate with helper functions
- Standardize event handling patterns

### Type Safety
- Strong typing for store actions
- Machine state type inference
- Event parameter validation

### Performance
- Optimize store subscriptions
- Reduce unnecessary re-renders
- Memoize expensive computations

## Conclusion

The key to elegant HSM design is:

1. **Clear Separation**: Machine = transitions, Store = data, Hook = bridge
2. **Minimal Transitions**: Static strings, no functional logic
3. **Proper Hierarchy**: Parent contains children, inheritance works
4. **Store-First**: All data in store, machine only controls flow

Both flat and nested approaches are valid - choose based on complexity needs. Flat for simple cases, nested for complex hierarchical scenarios.
