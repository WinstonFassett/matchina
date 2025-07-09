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

## Quick Start

```ts
import { matchina } from 'matchina';

const machine = matchina({
  initial: 'idle',
  states: {
    idle: { on: { START: 'running' } },
    running: { on: { STOP: 'idle' } },
  },
});

machine.send('START'); // => state: 'running'
```

- See [the docs site](https://winstonfassett.github.io/matchina/) for live examples, guides, and API reference.
- All examples in the docs are real, runnable code from the repo's `examples/` directory.


## Primitives & Features

### FactoryMachine (`matchina()`)
Create strongly-typed state machines with minimal config.

```ts
const m = matchina({ initial: 'a', states: { a: {}, b: {} } });
```

### Matchbox Factories
Composable state factory helpers.

```ts
import { matchbox } from 'matchina';
const box = matchbox({ a: {}, b: {} });
```

### State Machines & Pure Machines

```ts
import { machine, pure } from 'matchina';
machine({ ... }); // with effects
pure({ ... });    // pure transitions only
```

### States & Transitions

```ts
import { states } from 'matchina';
states({ idle: {}, active: {} });
```

### Actions, Effects, Guards

```ts
const machine = matchina({
  states: {
    idle: {
      on: { START: { target: 'running', action: () => {/*...*/} } },
    },
  },
});
```

### Promise Machine
Async state machines for promises.

```ts
import { promiseMachine } from 'matchina';
const pm = promiseMachine(() => fetch('/api'));
```

## Hooks & Extensions

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
