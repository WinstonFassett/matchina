import { defineMachine } from "../machine";
import { defineStates } from "../states";
import { onLifecycle } from "../extras/lifecycle";
import { makeZen } from "../extras/zen";
import { MatchboxConfig } from "../matchbox-types";

type FetchConfig = {
  key: string;
  url: string;
  maxTries: number;
  fetch: typeof fetch;
};
type FetchContext = {
  tries: number;
  error: Error | undefined;
  data: any;
};

function defineStatesWithContext<StatesConfig extends MatchboxConfig, Context>(
  config: StatesConfig
) {
  const statesWithoutContext = defineStates(config)
  /* 
  Need to return something that:
  - has the same keys as states
  - somehow adds context to the keyed function args
  - or maybe there's an extra callback somewhere
  
  usage would be something like

  const statesWithContext = defineStatesWithContext({ tries: 0 }, {
    Idle: (context) => context,
    Pending: (context, tries) => ({ ...context, tries }),
    Rejected: (context, error) => ({ ...context, error }),
    Resolved: (context, data) => ({ ...context, data }),
  })

  */
}

export function createFetchMachine(
  config: Partial<FetchConfig> & Pick<FetchConfig, "url" | "key">,
  fetchContext: Partial<FetchContext> = {},
) {
  const fullConfig = {
    ...config,
    maxRetries: config.maxTries ?? 3,
    fetch: config.fetch ?? fetch,
  };
  const states = defineStates({
    Testy: undefined,
    Idle: (context: Partial<FetchContext>) => context,
    Pending: (context: Partial<FetchContext> & Pick<FetchContext, "tries">) =>
      context,
    Rejected: (context: Partial<FetchContext>, error: Error) => ({
      ...context,
      error,
    }),
    Resolved: (context: Partial<FetchContext>, data: any) => ({
      ...context,
      data,
      // always clear retries and error on success
      retries: 0,
      error: undefined,
    }),
    Cancelled: (context: Partial<FetchContext>) => context,
    CannotRetry: (context: Partial<FetchContext>) => context,
    TimedOut: (context: Partial<FetchContext>) => context,
    // would be nice to add Cancelled state
    // Invalid/Suspended state when retries exceeded? Or just back to idle?
  });
  const Machine = defineMachine(states, {
    Testy: { test: "Idle" },
    Idle: {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      execute: () => (from) => states.Pending({ tries: 0, ...from.data }),
    },
    Pending: {
      resolve: (data: any) => (from) => states.Resolved(from.data, data),
      reject: (error: Error) => (from) => states.Rejected(from.data, error),
    },
    Resolved: {},
    Rejected: {},
    Cancelled: {},
    CannotRetry: {},
    TimedOut: {}
  });
  const initialState = states.Idle(fetchContext);
  const machine = Machine.create(initialState);
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<any>,
    done: undefined as undefined | Promise<void>,
  });
  function execute(params: any) {
    const promise = fullConfig.fetch(config.url, params);
    promiseMachine.promise = promise;
    promiseMachine.done = promise
      .then(machine.event.resolve)
      .catch(machine.event.reject);
  }
  onLifecycle(promiseMachine, {
    Idle: {
      on: {
        execute: {
          guard: (context) => context.to.data.tries < fullConfig.maxRetries,
          handle(change) {
            execute(change.to.data);
            return change;
          },
        },
      },
    },
    Pending: {
      on: {
        reject: {
          guard: (context) => context.from.data.tries < fullConfig.maxRetries,
        },
      },
    },
  });

  // type PromiseMachine = typeof promiseMachine;
  // type PromiseTransitionExits = EventExitStatesIntersection<
  //   typeof promiseMachine.def.states,
  //   typeof promiseMachine.def.transitions
  // >;
  // type PromiseExitKeys = FlatExitStateKeys<
  //   typeof promiseMachine.def.states,
  //   typeof promiseMachine.def.transitions
  // >; // Idle. Should have everything
  // type PromiseTransitionFuncs = StateEventTransitionFuncs<
  //   typeof promiseMachine.def.states,
  //   typeof promiseMachine.def.transitions
  // >; // Idle. Should have everything
  // type IdleTransitionFuncs = PromiseTransitionFuncs["Idle"]; // Idle. Should have everything
  // type IdleExecute = ReturnType<IdleTransitionFuncs["execute"]>["key"]; // Pending
  // type X = PromiseTransitionExits["test"]["key"]; // Idle

  return promiseMachine;
}

function testFetchMachine() {
  const m = makeZen(
    createFetchMachine(
      {
        key: "test",
        url: "https://example.com",
        maxTries: 3,
      },
      { tries: 2 },
    ),
  );
  m.execute(); // meh this is not great. machine should manage this.
  // maybe this should be transition logic and not lifecycle?
  // m.reject(m.getState)
}
testFetchMachine();
