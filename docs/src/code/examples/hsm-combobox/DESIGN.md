# HSM Combobox Design Document

## STATE MACHINE RETHINK (In Progress)

### The Problem
We've been coding in circles because the state design is confused. Let's step back and think about what states ACTUALLY make sense.

### What We Know Works
- **Inactive / Active** - focus state. Makes total sense.

### When Active - What's Actually Happening?

User flow:
1. Focus input → now Active
2. Input is empty, waiting → **Idle**
3. User types something → brief moment of **Typing** (transitional)
4. System checks for suggestions:
   - Found matches → **Suggesting** (show dropdown)
   - No matches → back to **Idle** (just has text, no dropdown)
5. User selects suggestion OR presses Enter → add tag, back to **Idle**
6. User blurs → **Inactive**

### Proposed States

```
Inactive
Active
  ├── Idle        (empty OR has-text-no-matches, no dropdown)
  ├── Typing      (transitional - hook determines next state)
  └── Suggesting  (showing dropdown with matches)
```

### Questions to Resolve

**Q1: Is "Typing" even a real state?**
- It's transitional - you enter it, hook fires, immediately leave
- Maybe it's just a transition trigger, not a state?
- OR it's the state while async lookup happens (future: debounce, API call)

**Q2: Do we need "TextEntry" (has text, no suggestions)?**
- Currently we have: Empty, Typing, TextEntry, Suggesting
- TextEntry = Idle with text in the input
- Is that meaningfully different from Empty?
- UI-wise: both show just the input, no dropdown
- Maybe collapse Empty + TextEntry → **Idle**

**Q3: What triggers what?**

| User Action | Store Change | State Transition |
|-------------|--------------|------------------|
| Focus | - | Inactive → Active.Idle |
| Blur | - | Active.* → Inactive |
| Type char | setInput, compute suggestions | Idle → Typing → (Suggesting or Idle) |
| Arrow keys | highlight change | (only in Suggesting) |
| Enter | addTag or selectHighlighted | Suggesting → Idle |
| Escape | clear | Suggesting → Idle |

### API Design - RETHINK

**Problem with "coordinated methods":**
```typescript
// This is doubleminded bullshit:
type: (value: string) => {
  store.api.setInput(value);  // Do store thing
  machine.api.type();         // Do machine thing
}
```

Why is this bad? Because it means the store and machine are coupled but doing separate things. Doubleminded.

**What should focus() do?**
- Machine transitions: Inactive → Active
- That's it. Why would store need `activate()`?
- Store has `isActive` boolean - WHY? Machine already knows this!
- **Answer: Store should NOT have `isActive`. Redundant.**

**What should type(value) do?**
- Store: setInput, recompute suggestions
- Machine: transition based on suggestions?

Wait. The machine transition depends on store state (has suggestions or not). That's the coupling.

**Options:**
1. Guard checks store state (current - tight coupling)
2. Store notifies machine (callback/event)
3. Machine doesn't care - UI checks both machine state AND store state

**Option 3 is cleanest:**
- Machine just tracks: are we showing a dropdown or not?
- Store just tracks: data
- UI decides when to show dropdown based on BOTH

But then... what triggers the machine to go to Suggesting?

**Actually, maybe we're overcomplicating this.**

What if the machine state is JUST about focus, and "Suggesting" is purely a derived condition?

```
Machine states: Inactive, Active
Store data: input, tags, suggestions, highlightedIndex
UI shows dropdown when: isActive AND suggestions.length > 0
```

No need for Empty vs Suggesting states at all! The dropdown visibility is just:
```typescript
const showDropdown = machine.is('Active') && store.suggestions.length > 0;
```

**HSM States (this is an HSM example, motherfucker):**
```
Inactive
Active
  ├── Empty      (no dropdown)
  └── Suggesting (dropdown visible)
```

The hierarchy is the whole fucking point. Active has child states.

### Machine Responsibilities (Corrected)

Machine tracks UI MODE, not just focus:
- **Inactive** - not focused
- **Active.Empty** - focused, no dropdown
- **Active.Suggesting** - focused, dropdown visible

### Transitions

| From | Event | To | Trigger |
|------|-------|-----|---------|
| Inactive | focus | Active.Empty | input focused |
| Active.* | blur | Inactive | input blurred |
| Active.Empty | type | Active.Suggesting | user typed, has suggestions |
| Active.Empty | type | Active.Empty | user typed, no suggestions (guard blocks) |
| Active.Suggesting | type | Active.Suggesting | more typing |
| Active.Suggesting | select | Active.Empty | picked suggestion |
| Active.Suggesting | dismiss | Active.Empty | escape pressed |

### The Guard

When typing in Empty state, transition to Suggesting ONLY if there are suggestions:

```typescript
guard((ev) => {
  if (ev.type === 'type' && ev.from.is('Empty')) {
    return store.getState().suggestions.length > 0;
  }
  return true;
});
```

This is the store→machine coupling point. Guard checks store to decide transition.

---

## COMPONENT API (Proper Encapsulation)

Treat this as a fucking component. Consumer doesn't care about internals.

### What Consumer Needs to READ:
```typescript
// The model (store) is exposed directly
const { model } = combobox;
model.getState().input
model.getState().selectedTags
model.getState().suggestions
model.getState().highlightedIndex

// Derived state on combobox
combobox.isActive        // machine is not Inactive
combobox.isSuggesting    // machine is in Suggesting state
```

### What Each Action Does (COMPLETE)

**focus()**
- Trigger: input element receives focus
- Machine: Inactive → Active.Empty
- Store: nothing
- Propagation: machine notifies

**blur()**
- Trigger: input element loses focus
- Machine: Active.* → Inactive
- Store: clear()
- Propagation: both notify

**setInput(value)** (this is the tricky one)
- Trigger: user types in input
- Store FIRST: setInput(value) - recomputes suggestions
- Machine THEN: send('type') - guard checks suggestions, transitions accordingly
  - If in Empty and has suggestions → Suggesting
  - If in Empty and no suggestions → stays Empty (guard blocks)
  - If in Suggesting → stays Suggesting
- Propagation: store notifies, then machine notifies (if transition)

**selectSuggestion()**
- Trigger: Enter while in Suggesting, or click suggestion
- Store: selectHighlighted() - adds tag, clears input
- Machine: send('select') - Suggesting → Empty
- Propagation: both notify

**addTag(tag)**
- Trigger: Enter with custom text (not in Suggesting or no suggestions)
- Store: addTag(tag), clear()
- Machine: nothing (already in Empty)
- Propagation: store notifies

**removeTag(tag)**
- Trigger: click X on tag, or backspace when input empty
- Store: removeTag(tag)
- Machine: nothing
- Propagation: store notifies

**highlightNext()**
- Trigger: ArrowDown while in Suggesting
- Store: highlight('next')
- Machine: nothing (stays in Suggesting)
- Propagation: store notifies

**highlightPrev()**
- Trigger: ArrowUp while in Suggesting
- Store: highlight('prev')
- Machine: nothing (stays in Suggesting)
- Propagation: store notifies

**dismiss()**
- Trigger: Escape
- Store: clear()
- Machine: send('dismiss') - Suggesting → Empty (or no-op if already Empty)
- Propagation: both notify

---

### Derived State

**isOpen** (not stored, computed)
```typescript
get isOpen() {
  return machine.is('Active') && store.suggestions.length > 0;
}
```

---

### Responsibility Summary

| Action | Machine | Store |
|--------|---------|-------|
| focus | ✓ Inactive→Active.Empty | - |
| blur | ✓ Active.*→Inactive | ✓ clear |
| setInput | ✓ type event (guard decides) | ✓ setInput (FIRST) |
| selectSuggestion | ✓ Suggesting→Empty | ✓ selectHighlighted |
| addTag | - | ✓ addTag + clear |
| removeTag | - | ✓ removeTag |
| highlightNext | - | ✓ highlight |
| highlightPrev | - | ✓ highlight |
| dismiss | ✓ Suggesting→Empty | ✓ clear |

**Machine tracks UI mode (Inactive, Empty, Suggesting). Store tracks data.**

---

### Update Propagation

**Problem:** Machine and store are separate. React shouldn't need to subscribe to both.

**Options:**

1. **Component provides unified subscribe**
   - Component internally subscribes to both machine and store
   - Re-emits to its own subscribers on any change
   - React just does `useMachine(combobox)`

2. **Store contains everything (no machine)**
   - Just use store with `isActive` boolean
   - Single source of truth
   - But then this isn't an HSM example anymore...

3. **Machine wraps store**
   - Store is inside machine state
   - Machine notifies on any change
   - More complex wiring

**Decision: Option 1 (unified subscribe)**

Component is the subscribable thing:

```typescript
function createCombobox() {
  const machine = ...;
  const store = ...;

  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach(fn => fn());

  // Wire up: any change → notify subscribers
  machine.subscribe(notify);
  store.subscribe(notify);

  return {
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    // ... rest of API
  };
}
```

React usage:
```typescript
useMachine(combobox);  // single subscription, catches all changes
```

---

### Implementation Approach

```typescript
function createCombobox() {
  const machine = createHSM();  // Inactive, Active.Empty, Active.Suggesting
  const store = addStoreApi(createComboboxStore());

  // Guard: block Empty→Suggesting when no suggestions
  setup(machine)(
    guard((ev) => {
      if (ev.type === 'type' && ev.from.is('Empty')) {
        return store.getState().suggestions.length > 0;
      }
      return true;
    })
  );

  // Unified subscription
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach(fn => fn());
  machine.subscribe(notify);
  store.subscribe(notify);

  return {
    // Expose model (store) directly - consumers can subscribe to it
    model: store,

    // For useMachine compatibility on the combobox itself
    subscribe: (fn: () => void) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    notify,
    getChange: () => store.getChange(),

    // Derived state
    get isActive() { return !machine.getState().is('Inactive'); },
    get isSuggesting() { return machine.getState().is('Suggesting'); },

    // Pure store actions (just delegate)
    addTag: store.api.addTag,
    removeTag: store.api.removeTag,
    highlight: store.api.highlight,

    // Coordinated actions (store + machine)
    focus: () => machine.send('focus'),
    blur: () => {
      store.api.clear();
      machine.send('blur');
    },
    setInput: (value: string) => {
      store.api.setInput(value);  // FIRST - recomputes suggestions
      machine.send('type');        // THEN - guard checks suggestions
    },
    selectSuggestion: () => {
      store.api.selectHighlighted();
      machine.send('select');
    },
    dismiss: () => {
      store.api.clear();
      machine.send('dismiss');
    },
  };
}
```

**Key points:**
- Store updates FIRST, machine transitions SECOND (for setInput)
- Guard checks store state to decide transitions
- Unified subscribe for React
- Pure store actions just delegate, no wrapper logic
- Coordinated actions handle the store→machine ordering

---

## USER INTERACTIONS (Complete)

### Keyboard Events (when focused)

| Key | Condition | Action | Result |
|-----|-----------|--------|--------|
| Any char | - | setInput(current + char) | suggestions update |
| Backspace | input not empty | setInput(current - 1 char) | suggestions update |
| Backspace | input empty, has tags | removeTag(lastTag) | last tag removed |
| Enter | suggestions visible | selectSuggestion() | highlighted added as tag |
| Enter | no suggestions, has input | addTag(input.trim()) | custom tag added |
| Enter | no suggestions, no input | nothing | - |
| Escape | - | dismiss() | clears input, closes dropdown |
| ArrowDown | suggestions visible | highlightNext() | highlight moves down |
| ArrowUp | suggestions visible | highlightPrev() | highlight moves up |
| Tab | - | blur() (browser default) | loses focus |

### Mouse Events

| Event | Target | Action | Result |
|-------|--------|--------|--------|
| Click | input | focus() | activates |
| Click | suggestion | addTag(suggestion) | tag added |
| Click | tag X button | removeTag(tag) | tag removed |
| Click | outside | blur() | deactivates |

### Focus Events

| Event | Action | Result |
|-------|--------|--------|
| focus | focus() | machine → Active |
| blur | blur() | machine → Inactive, clears data |

---

### For React:
```typescript
combobox.subscribe(fn)   // returns unsubscribe
```

### Internal Implementation (consumer doesn't see):
- Machine handles focus state: Inactive / Active
- Store handles data: input, tags, suggestions, highlight
- `isOpen` is derived from machine state + store data

### Key Principle:
Each action does ONE thing. No "coordinated" bullshit.
- `focus()` → machine.send('focus')
- `setInput(value)` → store.setInput(value)
- `selectSuggestion()` → store.selectHighlighted()

If an action needs both, it's the component's internal concern, not the API's job to coordinate.

### Store Responsibility

Store holds field data and computes derived state:

```typescript
{
  input: string,
  selectedTags: string[],
  suggestions: string[],      // computed from input
  highlightedIndex: number
}
```

NO `isActive` - that's machine's job.

Store operations:
- setInput(value) - also recomputes suggestions
- addTag(tag)
- removeTag(tag)
- selectHighlighted() - adds highlighted suggestion as tag, clears input
- highlight(direction)
- clear()

---

## DESIGN DECISIONS

### Decision 1: Empty/HasText is NOT a state
- Whether input has text is a **property**, not a state
- UI can check `store.input.length > 0` if needed
- States represent mutually exclusive modes, not data qualities

### Decision 2: Two Active States (Simplified)

We don't need a Typing state. Use a guard instead.

**Final States:**
```
Inactive
Active
  ├── Empty      (no dropdown)
  └── Suggesting (dropdown visible - loading or results)
```

**What varies by state (UI perspective):**
| State | Input | Dropdown |
|-------|-------|----------|
| Inactive | hidden/disabled | no |
| Empty | editable | no |
| Suggesting | editable | yes (loading or results) |

That's it. Super simple.

### Transition Map

```typescript
Inactive: {
  focus: 'Active'
},
Active: {
  blur: '^Inactive',
  initial: 'Empty',
  states: {
    Empty: {
      type: 'Suggesting'    // typing goes to suggesting
    },
    Suggesting: {
      type: 'Suggesting',   // more typing, stay here
      select: 'Empty',      // picked an item
      dismiss: 'Empty'      // escape/cancel
    }
  }
}
```

### Guard (Matchina Style)

Guards are hooks, not transition properties:

```typescript
setup(machine)(
  guard((ev) => {
    // Block Empty→Suggesting if no input
    if (ev.type === 'type' && ev.from.key === 'Empty') {
      return store.getState().input.length > 0;
    }
    return true;
  })
)
```

### Cases (Not States)

These are conditions the UI checks, NOT state machine events:

| Case | Check | UI Behavior |
|------|-------|-------------|
| `hasInput` | `input.length > 0` | Guard allows transition |
| `hasSuggestions` | `suggestions.length > 0` | Show results vs "no matches" |
| `hasHighlight` | `highlightedIndex >= 0` | Highlight styling |
| `hasTags` | `tags.length > 0` | Show tag pills |
| `canDeleteTag` | `!hasInput && hasTags` | Backspace deletes last tag |

### Promise Machine for Async (Future)

```typescript
Suggesting: {
  data: promiseMachine(fetchSuggestions),
  // Loading/Success/Error handled by promise machine
  // HSM just knows "we're suggesting"
}
```

---

## NEXT STEPS

1. Finalize state design in this doc
2. Update machine definitions to match
3. Update views to use semantic API
4. Tests should use semantic API too

