# Transition Discovery API

## The Insight
Instead of declaring targets upfront, provide a way to **call the handler with no params** to discover what it returns.

## API Design Options

### Option A: Separate Discovery Function
```typescript
function t(
  handler: (...args: any[]) => (ev: any) => any,
  discover: () => any[]  // Returns sample states
) {
  // Call discover to get possible states
  const samples = discover();
  const targets = samples.map(s => s.key);

  (handler as any)._targets = targets;
  (handler as any)._discover = discover;
  return handler;
}

// Usage
const typed = t(
  // Normal handler - takes params
  (value: string) => (ev) => {
    const suggestions = getSuggestions(value, ev.from.data.selectedTags);
    if (!value.trim()) return activeStates.Empty(ev.from.data.selectedTags);
    return suggestions.length > 0
      ? activeStates.Suggesting({...})
      : activeStates.TextEntry({...});
  },
  // Discovery - no params, returns all possible states
  () => [
    activeStates.Empty([]),
    activeStates.TextEntry({ input: "", selectedTags: [] }),
    activeStates.Suggesting({ input: "", selectedTags: [], suggestions: [] })
  ]
);
```

**Pros**:
- Clear separation of concerns
- Discovery is explicit
- Handler stays clean

**Cons**:
- Two functions (but that's okay?)

### Option B: Single Function with Overload Detection
```typescript
function t(
  handler: ((value?: string) => (ev: any) => any) | (() => any[])
) {
  // Detect: handler() returns array? Discovery mode
  // Otherwise: normal handler

  let actualHandler, targets;

  try {
    const result = (handler as any)();
    if (Array.isArray(result) && result[0]?.key) {
      // Discovery mode - result is array of states
      targets = result.map(s => s.key);
      // Need actual handler somehow... this doesn't work
    }
  } catch (e) {
    // Normal handler
    actualHandler = handler;
  }
}
```

**This doesn't work well** - can't distinguish handler vs discovery.

### Option C: Object Config (Your "exits" idea)
```typescript
function t(config: {
  exits: any[];  // State instances or constructors
  handle: (...args: any[]) => (ev: any) => any;
}) {
  const targets = config.exits.map(e =>
    typeof e === 'function' ? e.name : e.key
  );

  (config.handle as any)._targets = targets;
  return config.handle;
}

// Usage
const typed = t({
  exits: [
    activeStates.Empty([]),
    activeStates.TextEntry({ input: "", selectedTags: [] }),
    activeStates.Suggesting({ input: "", selectedTags: [], suggestions: [] })
  ],
  handle: (value: string) => (ev) => {
    const suggestions = getSuggestions(value, ev.from.data.selectedTags);
    if (!value.trim()) return activeStates.Empty(ev.from.data.selectedTags);
    return suggestions.length > 0
      ? activeStates.Suggesting({...})
      : activeStates.TextEntry({...});
  }
});
```

**Pros**:
- Self-documenting
- Clear intent

**Cons**:
- More verbose
- Nested object

### Option D: Fluent API
```typescript
function t(handler: (...args: any[]) => (ev: any) => any) {
  return {
    exits: (...states: any[]) => {
      const targets = states.map(s => s.key || s.name);
      (handler as any)._targets = targets;
      return handler;
    }
  };
}

// Usage
const typed = t((value: string) => (ev) => { /* logic */ })
  .exits(
    activeStates.Empty([]),
    activeStates.TextEntry({ input: "", selectedTags: [] }),
    activeStates.Suggesting({ input: "", selectedTags: [], suggestions: [] })
  );
```

**Pros**:
- Reads nicely
- Clean separation

**Cons**:
- Still constructing samples inline

## Recommendation: Option A with Shorthand

```typescript
// Full API
export function t(
  handler: (...args: any[]) => (ev: any) => any,
  discover?: () => any[]
) {
  if (discover) {
    const samples = discover();
    const targets = samples.map(s => s.key);
    (handler as any)._targets = targets;
  }
  return handler;
}

// Shorthand - pass state constructors directly
export function t(
  handler: (...args: any[]) => (ev: any) => any,
  exits: Function[] | (() => any[])
) {
  let targets;

  if (Array.isArray(exits)) {
    // Array of constructors or instances
    targets = exits.map(e =>
      typeof e === 'function'
        ? e.name || (e as any)._stateName  // Constructor
        : e.key  // Instance
    );
  } else {
    // Discovery function
    const samples = exits();
    targets = samples.map(s => s.key);
  }

  (handler as any)._targets = targets;
  return handler;
}
```

## Usage Examples

### Style 1: State Instances (Your idea!)
```typescript
const typed = t(
  (value: string) => (ev) => { /* actual logic */ },
  () => [
    activeStates.Empty([]),
    activeStates.TextEntry({ input: "", selectedTags: [] }),
    activeStates.Suggesting({ input: "", selectedTags: [], suggestions: [] })
  ]
);
```

### Style 2: State Constructors (Simpler)
```typescript
const typed = t(
  (value: string) => (ev) => { /* actual logic */ },
  [activeStates.Empty, activeStates.TextEntry, activeStates.Suggesting]
);
```

### Style 3: Just Strings (Simplest)
```typescript
const typed = t(
  (value: string) => (ev) => { /* actual logic */ },
  ["Empty", "TextEntry", "Suggesting"]
);
```

## Which API Feels Best?

Looking at real usage in combobox:

```typescript
Empty: {
  typed: t(
    (value: string) => (ev) => {
      const selectedTags = ev.from.data.selectedTags;
      if (!value.trim()) return activeStates.Empty(selectedTags);

      const suggestions = getSuggestions(value, selectedTags);
      return suggestions.length > 0
        ? activeStates.Suggesting({ input: value, selectedTags, suggestions })
        : activeStates.TextEntry({ input: value, selectedTags });
    },
    // Option 1: Discovery function
    () => [activeStates.Empty([]), activeStates.TextEntry({...}), activeStates.Suggesting({...})]

    // Option 2: Constructors
    // [activeStates.Empty, activeStates.TextEntry, activeStates.Suggesting]

    // Option 3: Strings
    // ["Empty", "TextEntry", "Suggesting"]
  )
}
```

**My take**: Option 2 (constructors array) is the sweet spot:
- No string literals
- No need to construct sample data
- Autocomplete works
- Very concise

What do you think?
