# matchina

Lightweight state machines in TypeScript, powered by tagged unions and mapped types.

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

## Acknowledgements

Greatly inspired by:

- [timsy](https://github.com/christianalfoni/timsy)
- [safety-match](https://github.com/suchipi/safety-match)
- [XState](https://github.com/statelyai/xstate)

## License

Published under [MIT License](./LICENSE).
