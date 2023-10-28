
This package contains a minimal, 1kb implementation of ~~[XState](https://github.com/statelyai/xstate) for~~ **finite state machines**.


## Features

|                             | **matchina** | **@xstate/fsm** | [XState](https://github.com/statelyai/xstate) |
| --------------------------- | :----------: | :-------------: | :-------------------------------------------: |
| Finite states               |      ✅      |       ✅        |                      ✅                       |
| Initial state               |      ✅      |       ✅        |                      ✅                       |
| Transitions (object)        |      ✅      |       ✅        |                      ✅                       |
| Transitions (string target) |      ✅      |       ✅        |                      ✅                       |
| Delayed transitions         |      ✅      |       ❌        |                      ✅                       |
| Eventless transitions       |     soon     |       ❌        |                      ✅                       |
| Wildcard transitions        |      ✅      |       ✅        |                      ✅                       |
| Nested states               |     soon     |       ❌        |                      ✅                       |
| Parallel states             |      ❌      |       ❌        |                      ✅                       |
| History states              |      ❌      |       ❌        |                      ✅                       |
| Final states                |      ❌      |       ❌        |                      ✅                       |
| Entry actions               |      ✅      |       ✅        |                      ✅                       |
| Exit actions                |      ✅      |       ✅        |                      ✅                       |
| Transition actions          |      ✅      |       ✅        |                      ✅                       |
| Parameterized actions       |      ✅      |       ❌        |                      ✅                       |
| Transition guards           |      ✅      |       ✅        |                      ✅                       |
| Parameterized guards        |      ✅      |       ❌        |                      ✅                       |


- Finite states ~~(non-nested)~~
- Initial state
- Transitions (object or strings)
- ~~Context~~ coming soon
- Entry actions
- Exit actions
- Transition actions

If you want to use statechart features such as parallel states, activities, invoked services, etc. [`XState`](https://github.com/statelyai/xstate) can do that.

## Quick start

### Installation

```bash
npm i matchina
```

### Usage (machine)

```js
import { defineStates, defineMachine } from 'matchina';

const states = defineStates({
  inactive: undefined,
  active: undefined
})
const ToggleMachine = defineMachine(
  states,
  {
    inactive: {  TOGGLE: 'active' },
    active: { TOGGLE: 'inactive' }
  }
);

const toggledState = ToggleMachine.transition(initialState, 'TOGGLE');
toggledState.key;
const untoggledState = ToggleMachine.transition(toggledState, 'TOGGLE');
untoggledState.key;

```

### Usage (service)

```js
import { createMachine, interpret } from 'matchina';

const toggleMachine = ToggleMachine(states.inactive());
const { initialState } = toggleMachine.config;

toggleMachine.send('TOGGLE');
toggleMachine.send('TOGGLE');

```
