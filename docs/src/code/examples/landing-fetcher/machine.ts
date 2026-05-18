import { createMachine, defineStates, addEventApi } from "matchina";

export const createLandingFetcherMachine = () => addEventApi(machine);
export type LandingFetcherMachine = ReturnType<typeof createLandingFetcherMachine>;

// ---cut-before---
const states = defineStates({
  Idle:    undefined,
  Loading: undefined,
  Success: (data: unknown) => data,
  Error:   (err: Error)    => err,
});

const machine = createMachine(
  states,
  {
    Idle:    { fetch:   'Loading' },
    Loading: { resolve: 'Success', reject: 'Error' },
    Success: { reset:   'Idle'    },
    Error:   { retry:   'Loading' },
  },
  'Idle'
);
// ---cut-after---
