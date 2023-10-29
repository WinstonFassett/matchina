import { F } from "vitest/dist/reporters-5f784f42";
import { defineMachine } from "../machine";
import { defineStates } from "../states";
import { onLifecycle } from "./lifecycle";
import { makeZen } from "./zen";

type FetchConfig = {
  key: string;
  url: string;
  maxRetries: number;
  fetch: typeof fetch;
}
type FetchContext = {
  retries: number;
  error: Error | undefined;
  data: any;
}

// rough attempt at implementing context without having it as a built-in feature
export function createFetchMachine1 (config: Partial<FetchConfig> & Pick<FetchConfig, "url" | "key">, fetchContext: Partial<FetchContext>={}) {
  const fullConfig = {
    ...config,
    maxRetries: config.maxRetries ?? 3,
    fetch: config.fetch ?? fetch,
  }
  const states = defineStates({
    Idle: (context: Partial<FetchContext>) => context,
    Pending: (      
      context: Partial<FetchContext> & Pick<FetchContext, | "retries">,
    ) => context,
    Rejected: (
      context: Partial<FetchContext>,
      error: Error,
    ) => ({ ...context, error }),
    Resolved: (
      context: Partial<FetchContext>,
      data: any,
    ) => ({ ...context, data }),
    // would be nice to add Cancelled state
    // Invalid/Suspended state when retries exceeded? Or just back to idle?
  });
  const Machine = defineMachine(states, {
    Idle: { execute: "Pending" },
    Pending: {
      resolve: "Resolved",
      reject: "Rejected",
    },
    Resolved: {},
    Rejected: {},
  });
  const initialState = states.Idle(fetchContext);  
  const machine = Machine.create(initialState);
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<any>,
    done: undefined as undefined | Promise<void>,
  });
  function execute(params: any) {
    const promise = config.fetch!(config.url, params);
    promiseMachine.promise = promise;
    promiseMachine.done = promise
      .then(result => {        
        machine.event.resolve(
          machine.getState().match({
            Pending: (c) => c
          }, false),
          result
        )
      })
      .catch(error => {
        machine.event.reject(
          machine.getState().match({
            Pending: (c) => c
          }, false),
          error
        )      
      });
  }
  // onLifecycle(promiseMachine, {
  //   "*": {
  //     on: {
  //       execute: {
  //         guard: (context) => context.to.data.retries < fullConfig.maxRetries,
  //         handle(change) {
  //           execute(change.to.data)
  //           return change
  //         },
  //       },
  //     }
  //   },
  //   'Pending': {
  //     on: {
  //       reject: {
  //         guard: (context) => context.from.data.retries < fullConfig.maxRetries,
  //       },
  //       resolve: {
  //         handle: (context) => {
  //           return Object.assign(context,
  //             { 
  //               data: context.to.data.data,
  //               retries: 0,
  //             },
  //           )
  //         }
  //       }  
  //     }
  //   }
  // })
  return promiseMachine;
}


export function createFetchMachine (config: Partial<FetchConfig> & Pick<FetchConfig, "url" | "key">, fetchContext: Partial<FetchContext>={}) {
  const fullConfig = {
    ...config,
    maxRetries: config.maxRetries ?? 3,
    fetch: config.fetch ?? fetch,
  }
  const states = defineStates({
    Idle: (context: Partial<FetchContext>) => context,
    Pending: (      
      context: Partial<FetchContext> & Pick<FetchContext, | "retries">,
    ) => context,
    Rejected: (
      context: Partial<FetchContext>,
      error: Error,
    ) => ({ ...context, error }),
    Resolved: (
      context: Partial<FetchContext>,
      data: any,
    ) => ({ ...context, data }),
    // would be nice to add Cancelled state
    // Invalid/Suspended state when retries exceeded? Or just back to idle?
  });
  const Machine = defineMachine(states, {
    Idle: { execute: () => (from) => states.Pending({ retries: 0, ...from.data }) },
    Pending: {
      resolve: (data: any) => from => states.Resolved(from.data, data),
      reject: (error: Error) => from => states.Rejected(from.data, error)
    },
    Resolved: {},
    Rejected: {},
  });
  const initialState = states.Idle(fetchContext);  
  const machine = Machine.create(initialState);
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<any>,
    done: undefined as undefined | Promise<void>,
  });
  function execute(params: any) {
    const promise = config.fetch!(config.url, params);
    promiseMachine.promise = promise;
    promiseMachine.done = promise
      .then(machine.event.resolve)
      .catch(machine.event.reject);
  }
  onLifecycle(promiseMachine, {
    "*": {
      on: {
        execute: {
          guard: (context) => context.to.data.retries < fullConfig.maxRetries,          
        },
      }
    },
    'Pending': {
      on: {
        reject: {
          guard: (context) => context.from.data.retries < fullConfig.maxRetries,
        },
      }
    }
  })
  return promiseMachine;
}

function testFetchMachine() {
  const m = makeZen(createFetchMachine({
    key: 'test',
    url: 'https://example.com',
    maxRetries: 3,
  }, { retries: 2 }))
  m.execute() // meh this is not great. machine should manage this.
  // maybe this should be transition logic and not lifecycle?
  // m.reject(m.getState)
}


export function createFetchMachine2 () {
  const states = defineStates({
    Idle: undefined,
    Pending: () => undefined,
    Rejected: (error: Error) => error,
    Resolved: (data: any) => data,
  });
  const Machine = defineMachine(states, {
    Idle: { execute: "Pending" },
    Pending: {
      resolve: "Resolved",
      reject: "Rejected",
    },
    Resolved: {},
    Rejected: {},
  });
  const initialState = states.Idle();
  const machine = Machine.create(initialState);
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<any>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}