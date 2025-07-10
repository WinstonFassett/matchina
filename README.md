# Matchina

## Philosophy & Inspiration

- **Nano-sized, opt-in primitives** for state machines and async logic.
- Inspired by [Timsy](https://github.com/streamich/timsy), [XState](https://xstate.js.org/), and Andre Sitnik’s nano library style.
- Each primitive is useful standalone or composable.

## What is Matchina?

A super lightweight, strongly-typed toolkit for building and extending state machines, factories, and async flows in TypeScript. Use only what you need.


## Features

- __State Machines__: 
  - Strongly-typed machines, states, events and api
  - `states` may have typed payloads, events may have typed parameters
  - Powerful and flexible `transitions` configuration with typed parameters and exit states
    - receive event with all parameters
    - transition by name OR use transition functions for full control
  - `send` and strongly typed `event` api accept typed event and payload args
- __Tagged Unions__: powerful, elegant `matchbox` factories for states, events and effects
- __Async__: use promise handler and promise machine for bulletproof async
- __Extensibility__: composable setup, enhancers, hooks, lifecycle
- __Extras__: effects, subscribe, when, reset
- __Integrations__: React

## Installation

```sh
npm install matchina
```

## Getting Started

- See [the docs site](https://winstonfassett.github.io/matchina/) for live examples, guides, and API reference.
- All examples in the docs are real, runnable code from the repo's `examples/` directory.

## Quick Start

```ts
import { matchina } from "../src/matchina";

export const player = matchina(
  // Define states as keys to optional values or creator functions
  {
    Idle: undefined,
    Playing: undefined,
    Paused: undefined,
    Stopped: undefined,
  },
  // Define transitions, typed by states and their parameters and values
  {
    Idle: { start: "Playing" },
    Playing: {
      pause: "Paused",
      stop: "Stopped",
    },
    Paused: {
      resume: "Playing",
      stop: "Stopped",
    },
    Stopped: { start: "Playing" },
  },
  "Idle"
);

// Usage:
player.start();      // Idle/Stopped -> Playing
console.log(player.state.key);  // "Playing"
player.pause();      // Playing -> Paused
player.resume();     // Paused -> Playing
player.stop();       // Playing/Paused -> Stopped

```

### Promise Machines
Async state machines for promises.

```ts
import { createPromiseMachine, setup, effect, guard, enter, leave } from "matchina";

// --- 1. Create a promise machine for async addition ---
const adder = createPromiseMachine(
  (a: number, b: number) => new Promise<number>(resolve => setTimeout(() => resolve(a + b), 500))
);

// Everything below here is strongly typed and checked by TypeScript

// --- 2. Add lifecycle hooks ---
setup(adder)(
  // Only allow non-negative numbers
  guard(ev => ev.type !== "executing" || ev.params[1][0] >= 0),
  // Log when addition starts
  enter(ev => ev.to.is("Pending") && console.log("Started addition:", ev.to.data)),
  // Log when leaving pending state
  leave(ev => ev.from.is("Pending") && console.log("Leaving pending state")),
  // Log when promise resolves
  effect(ev => ev.type === "resolve" && console.log("Promise resolved with:", ev.to.data))
);

// --- 3. Use the machine ---

// Trigger addition and await result
const done = adder.execute(2, 3);
await done;

// Alternative: Await promise from state (if currently pending)
const state = adder.getState();
if (state.is("Pending")) await state.data.promise;

// Pattern match on state for messaging
const message = adder.getState().match({
  Idle:    ()      => "Ready to add.",
  Pending: params  => `Adding: ${params}`,
  Resolved: result => `Result: ${result}`,
  Rejected: error  => `Error: ${error}`,
});

```

## Primitives & Features

### Matchbox Factories
Composable state factory helpers.

```ts
import { matchbox } from "matchina";

const stateFactory = matchbox({
  Idle: () => ({}),
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: () => ({}),
});

// Create state instances:
const playingState = stateFactory.Playing("track-123");
const pausedState = stateFactory.Paused("track-123");

// Pattern match on state:
const message = playingState.match({
  Playing: s => `Now playing: ${s.trackId}`,
  Paused: s => `Paused: ${s.trackId}`,
  Idle: () => "Idle",
  Stopped: () => "Stopped",
});

// Type-safe checks:
const isPlayingTrack123 =
  playingState.is("Playing") && playingState.data.trackId === "track-123"; // true

// Cast to a specific state:
if (playingState.is("Playing")) {
  // TypeScript knows playingState.data has trackId
  console.log(playingState.data.trackId);
}
```

### Factory Machines (`createFactoryMachine(states, transitions, init)`)
Create strongly-typed state machines with minimal config.

```ts
```

### Machine Extensions

- `createApi` = add `.api` property with methods to send events
- `zen` = `createApi` + convenience properties (`state`, `change`, `machine`)
- `matchina` = createFactoryMachine + mixin zen at top-level

### Hooks, Effects, Guards

// THIS GENERATED CODE WILL NOT WORK. THIS IS NOT XSTATE. READ THE lifecycle demo that has amazing typing.
```ts
const machine = matchina({
  states: {
    idle: {
      on: { START: { target: 'running', action: () => {/*...*/} } },
    },
  },
});
```


this is missing the fuckin usage.

### Machine Helpers and Pure Machines

TODO

## Extensions

### Nanosubscribe
Tiny event emitter for subscriptions.

```ts
import { nanosubscribe } from 'matchina';
const sub = nanosubscribe();
sub.subscribe(fn);
```

Make machines subscribable:

```ts
import { withSubscribe } from 'matchina';
const enhanced = withSubscribe(machine);
```


## Bundle Sizes

Sample bundle sizes, depending on what is imported:

| Primitive                   | Size (min+gz) |
|-----------------------------|---------------|
| all                         | 2.41 kB       |
| matchbox                    | 376 B         |
| states                      | 390 B         |
| machine                     | 300 B         |
| pure                        | 61 B          |
| factory-machine             | 595 B         |
| matchChange                 | 171 B         |
| promise-handle              | 155 B         |
| promise-machine             | 1.01 kB       |
| ext                         | 390 B         |
| setup                       | 235 B         |
| method enhancer             | 82 B          |
| machine hooks               | 400 B         |
| factory machine hooks       | 649 B         |
| factory machine lifecycle   | 760 B         |
| state machine transition helpers | 117 B    |
| react                       | 365 B         |
| nanosubscribe               | 70 B          |
| with-nanosubscribe          | 129 B         |

## FAQ & Troubleshooting

- **Is this production-ready?** TBD
- **How do I add custom logic?** 

## Contributing

PRs and issues welcome! Keep it tiny and type-safe.


## Acknowledgements

Greatly inspired by:

- [timsy](https://github.com/christianalfoni/timsy)
- [safety-match](https://github.com/suchipi/safety-match)
- [XState](https://github.com/statelyai/xstate)

## License

MIT
