import { createMachine, defineStates, addEventApi } from "matchina";

const states = defineStates({
  Idle: undefined,
  Loading: undefined,
  Success: (data: unknown) => data,
  Error: (err: Error) => err,
});

export function createLandingFetcherMachine() {
  return addEventApi(
    createMachine(
      states,
      {
        Idle:    { fetch:   "Loading" },
        Loading: { resolve: "Success", reject: "Error" },
        Success: { reset:   "Idle"    },
        Error:   { retry:   "Loading" },
      },
      "Idle"
    )
  );
}

export type LandingFetcherMachine = ReturnType<typeof createLandingFetcherMachine>;
