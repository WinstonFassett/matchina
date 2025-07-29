# Matchina

## What is Matchina?

Matchina is a TypeScript-first, lightweight toolkit for building type-safe state machines, with powerful pattern matching and async handling. It provides:

- **Strongly-typed state machines** with full type inference
- **Tagged unions** via the `matchbox` pattern for discriminated types
- **Type-safe transitions** with smart parameter inference
- **Promise integration** for handling async operations safely

## Philosophy & Inspiration

- **TypeScript-first design** with powerful type inference
- **Nano-sized, opt-in primitives** for state machines and async logic
- **Composable APIs** that work together or standalone
- Inspired by [suchipi/safety-match](https://github.com/suchipi/safety-match), [christianalfoni/timsy](https://github.com/christianalfoni/timsy), [pelotom/unionize](https://github.com/pelotom/unionize), and [XState](https://xstate.js.org/)

## Philosophy & Inspiration

- **Nano-sized, opt-in primitives** for state machines and async logic.
- Inspired by [Timsy](https://github.com/streamich/timsy), [XState](https://xstate.js.org/), and Andre Sitnik’s nano library style.
- Each primitive is useful standalone or composable.

## What is Matchina?

A super lightweight, strongly-typed toolkit for building and extending state machines, factories, and async flows in TypeScript. Use only what you need.

## Features

- **Type-Safe State Factories**:

  - Create discriminated union types with `matchbox` for powerful pattern matching
  - Build factory machines with complete type inference for states and transitions
  - Enjoy automatic type narrowing with `.is()` and `.as()` type guards

- **Smart Transitions**:

  - Define transitions with TypeScript inferring parameter types from destination states
  - Trigger transitions with fully typed parameters based on target state requirements
  - Handle complex transition logic with guards and side effects

- **Async Handling**:

  - `createPromiseMachine` for type-safe async state management
  - Lifecycle hooks for promises with appropriate typing
  - Safe error handling for rejected promises

- **React Integration**:
  - React hooks for consuming state machines
  - Type-safe component rendering based on state

## Installation

```sh
npm install matchina
```

## Getting Started

- See [the docs site](https://winstonfassett.github.io/matchina/) for live examples, guides, and API reference.
- All examples in the docs are real, runnable code from the repo's `examples/` directory.

## Quick Start

```ts
import { matchina } from "matchina";

// Define states with their associated data types
const player = matchina(
  {
    Idle: undefined,
    Playing: (trackId: string) => ({ trackId }),
    Paused: (trackId: string) => ({ trackId }),
    Stopped: undefined,
  },
  // Define transitions - TypeScript infers parameter types based on destination states
  {
    Idle: {
      start: (trackId: string) => "Playing", // Parameter type matches Playing state
    },
    Playing: {
      pause: "Paused", // State transition will preserve trackId
      stop: "Stopped",
    },
    Paused: {
      resume: "Playing", // State transition will preserve trackId
      stop: "Stopped",
    },
    Stopped: {
      start: (trackId: string) => "Playing", // Parameter type matches Playing state
    },
  },
  "Idle",
);

// Usage with full type safety:
player.start("song-123"); // TypeScript knows this needs a trackId
console.log(player.state.key); // "Playing"

// TypeScript knows player.state.data has trackId when in Playing state
if (player.state.is("Playing")) {
  console.log(player.state.data.trackId); // "song-123"
}

player.pause(); // TypeScript knows no parameter needed
player.resume(); // TypeScript knows no parameter needed

// Pattern matching with exhaustive checking
const message = player.state.match({
  Playing: ({ trackId }) => `Now playing: ${trackId}`,
  Paused: ({ trackId }) => `Paused: ${trackId}`,
  Idle: () => "Ready to play",
  Stopped: () => "Playback stopped",
});
```

### Promise Machines

Type-safe state machines for managing asynchronous operations:

```ts
import {
  createPromiseMachine,
  setup,
  effect,
  guard,
  enter,
  leave,
} from "matchina";

// Create a promise machine for async addition with full type inference
const adder = createPromiseMachine(
  (a: number, b: number) =>
    new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 500)),
);

// All hooks are strongly typed and TypeScript checked
setup(adder)(
  // Type-safe guard to validate parameters
  guard((ev) => {
    // TypeScript knows ev.params exists and contains our parameters
    if (ev.type !== "executing") return true;
    const [a, b] = ev.params[1];
    return a >= 0 && b >= 0; // Only allow non-negative numbers
  }),

  // Type-safe hooks for state transitions
  enter((ev) => {
    if (ev.to.is("Pending")) {
      // TypeScript knows ev.to.data has promise and params when in Pending state
      console.log("Started addition:", ev.to.data.params);
    }
  }),

  // Log when leaving pending state
  leave((ev) => {
    if (ev.from.is("Pending")) {
      console.log("Leaving pending state");
    }
  }),

  // Log when promise resolves
  effect((ev) => {
    if (ev.type === "resolveExit") {
      // TypeScript knows ev.to.data contains the result when in Resolved state
      console.log("Promise resolved with:", ev.to.data);
    }
  }),
);

// --- Usage with type safety ---

// Execute with properly typed parameters
const done = adder.execute(2, 3);
await done; // TypeScript knows this is Promise<number>

// Pattern match on state for messaging
const message = adder.getState().match({
  Idle: () => "Ready to add.",
  Pending: (params) => `Adding: ${params.params.join(" + ")}`,
  Resolved: (result) => `Result: ${result}`,
  Rejected: (error) => `Error: ${error.message}`,
});
```

## Core Concepts

### Matchbox: Type-Safe Tagged Unions

The foundation of Matchina is the `matchbox` pattern for creating type-safe tagged unions:

```ts
import { matchbox } from "matchina";

// Create a state factory with typed data for each state
const PlayerState = matchbox({
  Idle: () => ({}),
  Playing: (trackId: string, startTime: number = Date.now()) => ({
    trackId,
    startTime,
  }),
  Paused: (trackId: string, position: number) => ({
    trackId,
    position,
  }),
  Stopped: () => ({}),
});

// Type-safe state creation:
const playingState = PlayerState.Playing("track-123");
const pausedState = PlayerState.Paused("track-123", 45);

// Exhaustive pattern matching with access to state data:
const message = playingState.match({
  Playing: ({ trackId, startTime }) =>
    `Now playing: ${trackId} (started at ${new Date(startTime).toLocaleTimeString()})`,
  Paused: ({ trackId, position }) =>
    `Paused: ${trackId} at ${position} seconds`,
  Idle: () => "Ready to play",
  Stopped: () => "Playback stopped",
});

// Type-safe guards with type narrowing:
if (playingState.is("Playing")) {
  // TypeScript knows playingState.data has trackId and startTime
  console.log(
    `Playing ${playingState.data.trackId} since ${playingState.data.startTime}`,
  );
}

// Type-safe casting:
try {
  const playing = pausedState.as("Playing"); // Will throw at runtime
  console.log(playing.data.startTime); // Wouldn't reach this line
} catch (e) {
  console.error("Can't cast Paused state to Playing");
}
```

The `matchbox` factory provides the foundation for Matchina's state machines, offering:

- **Type-safe state creation** with proper parameter inference
- **Exhaustive pattern matching** for handling all possible states
- **Type guards** that narrow types for precise type checking
- **Type-safe casting** for advanced use cases

### Factory Machines: Type-Safe State Transitions

Factory Machines combine state factories with transitions for complete type safety:

```ts
import { defineStates, createMachine, setup, guard, enter } from "matchina";

// Define your state factory with proper types
const TaskStates = defineStates({
  Idle: () => ({}),
  Loading: (query: string) => ({ query }),
  Success: (query: string, results: string[]) => ({ query, results }),
  Error: (query: string, message: string) => ({ query, message }),
});

// Create a factory machine with type-safe transitions
const taskMachine = createMachine(
  TaskStates,
  {
    Idle: {
      // Parameter types are inferred from the destination state
      search: (query: string) => "Loading",
    },
    Loading: {
      // Parameter types are inferred from the destination state
      success: (results: string[]) => (state) => {
        // TypeScript knows state.data has query from Loading state
        return TaskStates.Success(state.data.query, results);
      },
      // Parameter types are inferred from the destination state
      error: (message: string) => (state) => {
        // TypeScript knows state.data has query from Loading state
        return TaskStates.Error(state.data.query, message);
      },
    },
    Success: {
      // Return to idle state
      reset: "Idle",
      // Start a new search
      search: (query: string) => "Loading",
    },
    Error: {
      // Return to idle state
      reset: "Idle",
      // Retry the same query
      retry: (state) => {
        // TypeScript knows state.data has query from Error state
        return TaskStates.Loading(state.data.query);
      },
    },
  },
  TaskStates.Idle(),
);

// Add hooks with proper typing
setup(taskMachine)(
  // Guard to prevent empty searches
  guard((ev) => {
    if (ev.type !== "search") return true;
    return ev.params[0].length > 0;
  }),

  // Log state transitions
  enter((ev) => {
    console.log(`Entering ${ev.to.key} state`, ev.to.data);
  }),
);

// Usage with full type safety
taskMachine.send("search", "typescript");

// When in Loading state, we can send success with results
if (taskMachine.getState().is("Loading")) {
  // Simulate API response
  setTimeout(() => {
    taskMachine.send("success", ["result1", "result2"]);
  }, 1000);
}

// Pattern match on current state for UI rendering
const ui = taskMachine.getState().match({
  Idle: () => "Enter a search term",
  Loading: ({ query }) => `Searching for "${query}"...`,
  Success: ({ query, results }) =>
    `Found ${results.length} results for "${query}": ${results.join(", ")}`,
  Error: ({ query, message }) => `Error searching for "${query}": ${message}`,
});
```

The Factory Machine provides:

- **Type-safe state transitions** with parameter inference
- **State data preservation** when transitioning between states
- **Lifecycle hooks** for intercepting and reacting to state changes
- **Pattern matching** for exhaustive state handling

### Lifecycle Hooks & Effects

Matchina provides powerful hooks for intercepting and reacting to state transitions:

```ts
import {
  matchina,
  setup,
  guard,
  enter,
  leave,
  effect,
  bindEffects,
} from "matchina";

// Create a counter machine with effects
const counter = matchina(
  {
    Idle: () => ({ count: 0 }),
    Counting: (count: number) => ({ count }),
    // Define an effect state that has a specific effect type
    Milestone: (count: number) => ({ count, effect: "Notify" as const }),
  },
  {
    Idle: {
      start: "Counting",
    },
    Counting: {
      increment: (state) => {
        const newCount = state.data.count + 1;
        // Create a Milestone effect state when count is multiple of 10
        if (newCount % 10 === 0) {
          return "Milestone";
        }
        return { ...state, data: { count: newCount } };
      },
      reset: "Idle",
    },
    Milestone: {
      acknowledge: "Counting",
    },
  },
  "Idle",
);

// Add lifecycle hooks with type safety
setup(counter)(
  // Guard - prevent incrementing past 100
  guard((ev) => {
    if (ev.type !== "increment") return true;
    if (!ev.from.is("Counting")) return true;
    return ev.from.data.count < 100;
  }),

  // Enter hook - log entering Milestone state
  enter((ev) => {
    if (ev.to.is("Milestone")) {
      console.log(`Milestone reached: ${ev.to.data.count}`);
    }
  }),

  // Leave hook - log leaving states
  leave((ev) => {
    console.log(`Leaving ${ev.from.key} state`);
  }),

  // Effect handler - handle the Notify effect
  bindEffects({
    Notify: ({ data }) => {
      // Show notification
      alert(`Milestone reached: ${data.count}`);
    },
  }),
);

// Usage
counter.start();
counter.increment(); // count: 1
counter.increment(); // count: 2

// When count reaches 10, Milestone effect will trigger
```

Lifecycle hooks provide:

- **Guards** to prevent invalid transitions
- **Enter/Leave hooks** to react to state changes
- **Effect handlers** for handling side effects
- **Type-safe API** that enforces correct usage

### React Integration

Matchina provides React hooks for integrating state machines with React components:

```tsx
import React from "react";
import { matchina, useLifecycle } from "matchina/react";

// Create a todo machine
const todoMachine = matchina(
  {
    Empty: () => ({}),
    Active: (todos: string[]) => ({ todos }),
    Saving: (todos: string[]) => ({ todos }),
    Error: (message: string) => ({ message }),
  },
  {
    Empty: {
      add: (todo: string) => "Active",
    },
    Active: {
      add: (todo: string, state) => ({
        ...state,
        data: { todos: [...state.data.todos, todo] },
      }),
      remove: (index: number, state) => {
        const newTodos = [...state.data.todos];
        newTodos.splice(index, 1);
        return newTodos.length === 0
          ? "Empty"
          : { ...state, data: { todos: newTodos } };
      },
      save: "Saving",
    },
    Saving: {
      success: "Active",
      error: (message: string) => "Error",
    },
    Error: {
      dismiss: (state) =>
        state.from?.is("Saving")
          ? { key: "Active", data: state.from.data }
          : "Empty",
    },
  },
  "Empty",
);

// Todo component using the machine
const TodoApp: React.FC = () => {
  const [newTodo, setNewTodo] = React.useState("");
  const [machine, lifecycle] = useLifecycle(todoMachine);

  // Register lifecycle hook for the Saving state
  lifecycle.onEnter("Saving", ({ data }) => {
    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.8) {
        machine.error("Failed to save todos");
      } else {
        machine.success();
      }
    }, 1000);
  });

  return (
    <div>
      <h1>Todo App</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newTodo.trim()) {
            machine.add(newTodo);
            setNewTodo("");
          }
        }}
      >
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New todo"
        />
        <button type="submit">Add</button>
      </form>

      {machine.state.match({
        Empty: () => <p>No todos yet. Add one to get started!</p>,
        Active: ({ todos }) => (
          <>
            <ul>
              {todos.map((todo, index) => (
                <li key={index}>
                  {todo}
                  <button onClick={() => machine.remove(index)}>Remove</button>
                </li>
              ))}
            </ul>
            <button onClick={machine.save}>Save</button>
          </>
        ),
        Saving: () => <p>Saving todos...</p>,
        Error: ({ message }) => (
          <div className="error">
            <p>Error: {message}</p>
            <button onClick={machine.dismiss}>Dismiss</button>
          </div>
        ),
      })}
    </div>
  );
};
```

The React integration provides:

- **`useLifecycle` hook** for machine state and lifecycle hooks
- **Type-safe event handlers** that match your machine's API
- **Pattern matching for rendering** based on machine state

## Installation

```sh
npm install matchina
```

## Documentation

For detailed documentation, examples, and API reference, visit:

- [Getting Started](https://winstonfassett.github.io/matchina/guides/quickstart)
- [Matchbox Tutorial](https://winstonfassett.github.io/matchina/guides/union-machines)
- [Factory Machines](https://winstonfassett.github.io/matchina/guides/machines)
- [Promise Handling](https://winstonfassett.github.io/matchina/guides/promises)
- [Lifecycle Hooks](https://winstonfassett.github.io/matchina/guides/lifecycle)
- [React Integration](https://winstonfassett.github.io/matchina/guides/integrations)
- [Full Examples](https://winstonfassett.github.io/matchina/examples)

## FAQ

### How does Matchina compare to other state machine libraries?

Matchina focuses on TypeScript type inference and composable, lightweight primitives. Unlike XState, it doesn't use a declarative JSON-based configuration. Instead, it provides functional APIs with strong typing. Compared to Timsy, it offers more flexible state transitions and enhanced pattern matching via Matchbox.

### Do I need to use the entire library?

No. Matchina is designed to be modular. You can use only the parts you need:

- Use `matchbox` alone for type-safe tagged unions
- Use `createMachine` for state machines
- Use `createPromiseMachine` for async operations
- Use React integrations if you're working with React

### How small is the library?

Matchina is very lightweight:

| Feature           | Size (min+gz) |
| ----------------- | ------------- |
| matchbox          | 376 B         |
| factory-machine   | 595 B         |
| promise-machine   | 1.01 kB       |
| react integration | 365 B         |
| full library      | 2.41 kB       |

## Contributing

Contributions are welcome! Feel free to:

- Report issues and bugs
- Suggest new features or improvements
- Submit pull requests

## License

MIT
