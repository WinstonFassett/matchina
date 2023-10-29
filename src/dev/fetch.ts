import { defineMachine } from "../machine";
import { StateFromFactory, StatesFactory, defineStates } from "../states";
import { onLifecycle } from "../extras/lifecycle";
import { makeZen } from "../extras/zen";
import { MatchboxConfig, MatchboxSpec } from "../matchbox-types";
import { EventExitStatesIntersection, FlatExitStateKeys, StateEventTransitionFuncs } from "../machine-types";

type FetchConfig = {
  key: string;
  url: string;
  maxTries: number;
  fetch: typeof fetch;
};
type FetchContext = {
  tries: number;
  error?: Error | undefined;
  data?: any;
};

type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type ContextAwareStatesConfig<Context> = {
  [key: string]: undefined | ((...args: any[]) => (context: Context) => any) | object;
};

type MatchboxConfigForContextAwareStatesConfig<Context, StatesConfig extends ContextAwareStatesConfig<Context>> = {
  [Key in keyof StatesConfig]: StatesConfig[Key] extends (...args: infer A) => (context: Context) => infer R
    ? (context: Context, ...args: A) => R
    : StatesConfig[Key] extends undefined
    ? (context: Context) => Context
    : (context: Context) => Context;
}
//  & { [key: string]: ((context: Context, ...args: any[]) => any) | undefined };


function defineStatesWithContext<Context, Config extends ContextAwareStatesConfig<Context>>(
  initialContext: Context,
  config: Config
) {
  const matchboxConfig = {} as any //as MatchboxConfigForContextAwareStatesConfig<Context, Config>;
  for (const key of Reflect.ownKeys(config)) {
    const stateDef = config[key as any];
    matchboxConfig[key as any] = 
      typeof stateDef !== "function" ? stateDef :
      (context: Context, ...args: any[]) => {
        return stateDef(...args)(context);        
      };
  }
  return defineStates(matchboxConfig);
}


// function assign<States extends StatesFactory<any>, T>(key: keyof C) {
//   return (state: any) => (context: C, data: T) => state(context, data)[key];
// }
  
// const assigner = <T extends object, P, R>(key: keyof T) => {
//   return (fn: (...args: P[]) => R) =>{
//     return (...args: P[]) => (current: T) => Object.assign(current, { [key]: fn(...args)})
//   }
// }


export function createFetchMachine(
  config: Partial<FetchConfig> & Pick<FetchConfig, "url" | "key">,
  initialContext: Partial<FetchContext> = {},
) {
  const fullConfig = {
    ...config,
    maxRetries: config.maxTries ?? 3,
    fetch: config.fetch ?? fetch,
  };
  const states = defineStatesWithContext({ tries: 0, ...initialContext } as FetchContext, {
    Idle: undefined,
    Pending: () => context => ({ ...context, tries: context.tries+1 }),
    Rejected: (error: Error) => context => ({ ...context, error }),
    Resolved: (data: any) => context => ({ ...context, data, tries: 0 }),
    Cancelled: undefined,
    CannotRetry: undefined,
    TimedOut: undefined,  
  })
  
  function populate1<C, State extends (...args: any[]) => any, T extends keyof ReturnType<State>>(state: State, key: T) {
    return (context: C, ...args: Parameters<State>) => (context: any) => state(context, ...args)[key];
  }

  // function mergeData<C, R>(fn: (data: C, ...args: any[]) => R, ...args: any[]) {
  //   return ({ data }: { data: C }) => {
  //     return fn()
  //   }
  // }

  const Machine = defineMachine(states, {
    Idle: {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      execute: () => ({ data }) => states.Pending(data),
    },
    Pending: {     
      resolve: (data: any) => ({ data: context }) => states.Resolved(context, data),
      reject: (error: Error) => ({ data: context }) => states.Rejected(context, error),
      another: (error: Error) => from => states.Rejected(from.data, error) 
      // should have same effect as reject: (error: Error) => ({ data: context }) => states.Rejected(context, error),
      // should return type (...args: Parameters<States["Rejected"]>) => (StateFromFactory<States>) => states.Rejected(context, ...args)
      /*
      let's implement it

      function populate<States extends StatesFactory<any>, T extends keyof States>(state: States[T], key: T) {
      }
      */
    },
    Rejected: {},
    Resolved: {},
    Cancelled: {},
    CannotRetry: {},
    TimedOut: {}    
  });
  const initialState = states.Idle({ tries: 0 });
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
  return promiseMachine
}


function testFetchMachine() {
  const machine = createFetchMachine({
    key: "test",
    url: "https://example.com",
    maxTries: 3,
  }, { tries: 2 })

  const m = makeZen(machine);
  m.execute();
  m.another(new Error("test"));
  type PromiseMachine = typeof machine;
  type PromiseTransitionExits = EventExitStatesIntersection<
    typeof machine.def.states,
    typeof machine.def.transitions
  >;
  type PromiseExitKeys = FlatExitStateKeys<
    typeof machine.def.states,
    typeof machine.def.transitions
  >; // Idle. Should have everything
  type PromiseTransitionFuncs = StateEventTransitionFuncs<
    typeof machine.def.states,
    typeof machine.def.transitions
  >; // Idle. Should have everything
  type IdleTransitionFuncs = PromiseTransitionFuncs["Idle"]; // Idle. Should have everything
  type IdleExecute = ReturnType<IdleTransitionFuncs["execute"]>["key"]; // Pending
  
}
testFetchMachine();
