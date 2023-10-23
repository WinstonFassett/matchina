# matchina

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![Codecov][codecov-src]][codecov-href]

Itsa matchina

## Features

- Pattern-matching
  - Fully-typed state and effect "matchbox factories"
  - `match` on states, events and effects
- Fully-typed state machines
  - flexible transition configuration
    - string targets receive parameters of target state
    - function targets for full control
  - `send` accepts typed event and payload args
  - `event` provides typed event triggers
- Easy store integration with `onUpdate`
- Extras: lifecycle, guard, effects, promise, zen
- Coming soon: nested state machines

## Usage

Install package:

```sh
# npm
npm install matchina

# yarn
yarn add matchina

# pnpm
pnpm install matchina

# bun
bun install matchina
```

Import:

```js
// ESM
import {} from "matchina";

// CommonJS
const {} = require("matchina");
```

### Expressive State Machines in TypeScript

All of this is fully-typed!

```ts
  const states = defineStates({
    Idle: undefined,
    Pending: (...params: A[]) => params,
    Rejected: (error: E) => error,
    Resolved: (data: T) => data,
  });
  const Machine = defineMachine(states, {
    Idle: { execute: "Pending" },
    Pending: {
      resolve: "Resolved",
      reject: "Rejected",
    }
  });
  const initialState = states.Idle();
  const machine = Machine.create(initialState);
  
  machine.getState() // "Idle"
  machine.execute(a,b,c)
  machine.getState() // "Pending"
  
  machine.resolve({ someResult: 'ok' })
  machine.getState().data.someResult // "ok" 
  
  machine.reset()
  machine.getState() // "Idle"
  machine.execute(d,e,f)
  
  machine.reject(new Error("nope"))
  machine.getState().name // "Rejected"
  machine.getState().data // Error
  machine.getState().data.message // "nope"

```

### `createPromiseMachine`

For async, `createPromiseMachine`.

```ts
const fetchData = (id: number) => 
  fetch(`.data/${id}`).then((response) => response.json())

const fetchMachine = createPromiseMachine(fetchData)

// check state with fully-typed args
const logState = () => fetchMachine.getState().match({
  Resolved: (data) => console.log(data),
  Rejected: (error) => console.log(error.message),
  _: () => console.log('not yet'),
})

fetchMachine.event.execute(123)
logState() // not yet
await fetchMachine.done
logState() // result or error
```

### `defineEffects` and `bindEffects`

```ts
const myEffects = defineEffects({
  Error: undefined,
  Info: (msg: string) => ({ msg }),
});

const states = defineStates({
  Idle: undefined,
  Pending: undefined,
  Resolved: { effects: [myEffects.Info("done!")] },
  Rejected: (error) => ({ error, effects: [myEffects.Error]}),
});

// in your app code
const unbindLater = bindEffects(myContacts, 
  state => state.data.effects,
  {
  Info: console.log,
  Error: error => console.log('ERROR!', error.msg)  
});

```

### `onLifecycle`

```ts
const machine = createPromiseMachine<number, number>();
const unbindLater = onLifecycle(machine, {
  Idle: {
    on: {
      execute: {
        guard (({ params: [amount] }) => amount > 1,          
        handle: (({ params: [amount] })) => {
          machine.promise = makeThePromise(amount)
          machine.done = machine.promise
            .then(machine.event.resolve)
            .catch(machine.event.reject)            
          return event
        }
      },
    },
    leave: ({ type: event, from: { key: from }, to: { key: to } }) => {
      console.log(`leaving ${from} to ${event} to ${to}`)
    }
  },
});
```

### `makeZen`

```ts
const zenFetch = makeZen(fetchMachine)
zenFetch.execute(123)  
console.log(zenFetch.state)
```

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `bun install`
- Run interactive tests using `bun dev`

## Acknowledgements

- [timsy](https://github.com/christianalfoni/timsy)
- [safety-match](https://github.com/suchipi/safety-match)

## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/matchina?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/matchina
[npm-downloads-src]: https://img.shields.io/npm/dm/matchina?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/matchina
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/matchina/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/matchina
[bundle-src]: https://img.shields.io/bundlephobia/minzip/matchina?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=matchina
