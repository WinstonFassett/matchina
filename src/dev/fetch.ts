import { onLifecycle } from "../extras/lifecycle";
import { withEvents } from "../extras/with-events";
import { makeZen } from "../extras/zen";
import { defineMachine } from "../machine";
import {
  EventExitStatesIntersection,
  FlatExitStateKeys,
  StateEventTransitionFuncs,
} from "../machine-types";
import { defineStates } from "../states";

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

type ContextAwareStatesConfig<Context> = {
  [key: string]:
    | undefined
    | ((...args: any[]) => (context: Context) => any)
    | object;
};

type MatchboxConfigForContextAwareStatesConfig<
  Context,
  StatesConfig extends ContextAwareStatesConfig<Context>,
> = {
  [Key in keyof StatesConfig]: StatesConfig[Key] extends (
    ...args: infer A
  ) => (context: Context) => infer R
    ? (context: Context, ...args: A) => R
    : StatesConfig[Key] extends undefined
    ? (context: Context) => Context
    : (context: Context) => Context;
};
//  & { [key: string]: ((context: Context, ...args: any[]) => any) | undefined };

function defineStatesWithContext<
  Context,
  Config extends ContextAwareStatesConfig<Context>,
>(initialContext: Context, config: Config) {
  const matchboxConfig = {} as any; // ;
  for (const key of Reflect.ownKeys(config)) {
    const stateDef = config[key as any];
    matchboxConfig[key as any] =
      typeof stateDef === "function"
        ? (context: Context, ...args: any[]) => {
            return stateDef(...args)(context);
          }
        : stateDef;
  }
  return defineStates(
    matchboxConfig as MatchboxConfigForContextAwareStatesConfig<
      Context,
      Config
    >,
  );
}

type ContextualDataCreator<Context, P, T> = (
  context: Context,
  ...args: P[]
) => T;

function transitionWithPriorStateData<
  Context,
  Transitions extends Record<string, any>,
>(
  initialContext: Context,
  transitions: Transitions,
): {
  [Key in keyof Transitions]: Transitions[Key] extends ContextualDataCreator<
    infer Context,
    infer A,
    infer R
  >
    ? (args: A) => R
    : Transitions[Key];
} {
  const wrapped: any = {};
  for (const key of Object.keys(transitions)) {
    const transition = transitions[key];
    wrapped[key] =
      typeof transition === "function"
        ? (...args: any[]) =>
            ({ data: initialContext }: { data: Context }) =>
              transition(initialContext, ...args)
        : (context: Context) => context;
  }
  return wrapped;
}

export function createFetchMachine(
  config: Partial<FetchConfig> & Pick<FetchConfig, "url" | "key">,
  initialContext: Partial<FetchContext> = {},
) {
  const fullConfig = {
    ...config,
    maxRetries: config.maxTries ?? 3,
    fetch: config.fetch ?? fetch,
  };
  const states = defineStatesWithContext(
    { tries: 0, ...initialContext } as FetchContext,
    {
      Idle: undefined,
      // eslint-disable-next-line unicorn/consistent-function-scoping
      Pending: () => (context) => ({ ...context, tries: context.tries + 1 }),
      Rejected: (error: Error) => (context) => ({ ...context, error }),
      Resolved: (data: any) => (context) => ({ ...context, data, tries: 0 }),
      Cancelled: undefined,
      CannotRetry: undefined,
      TimedOut: undefined,
    },
  );

  const Machine = defineMachine(states, {
    // TwoPhaseTransitionFunc is not working
    Idle: {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      execute: (state) => (a, b, c) => {
        console.log({ b });
        return states.Pending({ tries: 2 });
      },
      // ({ data }) =>
      //   states.Pending(data),
    },
    // Pending: {
    //   resolve: (data: any) => ({ data: context }) => states.Resolved(context, data),
    //   reject: (error: Error) => ({ data: context }) => states.Rejected(context, error),
    //   another: (error: Error) => from => states.Rejected(from.data, error)
    // },
    Pending: transitionWithPriorStateData(initialContext, {
      resolve: states.Resolved,
      reject: states.Rejected,
      another: states.Rejected,
    }),
    Rejected: {},
    Resolved: {},
    Cancelled: {},
    CannotRetry: {},
    TimedOut: {},
  });
  const initialState = states.Idle({ tries: 0 });
  const machine = withEvents(Machine.create(initialState));
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
  /*
  Might be nice to abbreviate this to:
  guard(machine, '*', 'execute', (context) => context.tries < fullConfig.maxRetries)
  lifecycle(machine, {}).guard('Idle', 'execute', (context) => context.tries < fullConfig.maxRetries)
  before('*', '*', console.log)
  handle('Idle', 'execute', (change) => {})

  or

  const unguard = machine.guard.Idle.execute((context) => context.tries < fullConfig.maxRetries)
  const unhandle = handle.Idle.execute((change) => {})

  How would I implement this?

  If I want individual lifecycle methods, would each of them call onLifecycle?
  Seems wasteful
  Or should they find some place to register their lifecycle methods?
  like somewhere there is a lifecycle. and it can have multiple things
  this is just one way of registering, maybe there are others
  maybe they are easier, lol
  these guards are like machine-level
  machine.guards = [stateKey, eventKey, guardFn][]
  hey that's not bad.

  */

  onLifecycle(promiseMachine, {
    Idle: {
      on: {
        execute: {}, // undefined error
      },
    },
  });

  onLifecycle(promiseMachine, {
    Idle: {
      on: {
        // Idle on execute is undefined for some reason
        execute: {
          guard: (context) => context.to.data.tries < fullConfig.maxRetries,
          handle(change) {
            execute(change.to.data);
            return change;
          },
        },
      },
    },
    // Pending reject works
    Pending: {
      on: {
        reject: {
          guard: (context) => context.from.data.tries < fullConfig.maxRetries,
        },
      },
    },
  });
  return promiseMachine;
}

function testFetchMachine() {
  const machine = createFetchMachine(
    {
      key: "test",
      url: "https://example.com",
      maxTries: 3,
    },
    { tries: 2 },
  );

  const m = makeZen(machine);
  m.execute({ foo: "bar" });
  m.another(new Error("test"));
  // type PromiseMachine = typeof machine;
  // type PromiseTransitionExits = EventExitStatesIntersection<
  // typeof machine.context.states,
  // typeof machine.context.transitions
  // >;
  // type PromiseExitKeys = FlatExitStateKeys<
  //   typeof machine.context.states,
  //   typeof machine.context.transitions
  // >; // Idle. Should have everything
  // type PromiseTransitionFuncs = StateEventTransitionFuncs<
  //   typeof machine.context.states,
  //   typeof machine.context.transitions
  // >; // Idle. Should have everything
  // type IdleTransitionFuncs = PromiseTransitionFuncs["Idle"]; // Idle. Should have everything
  // type IdleExecute = ReturnType<IdleTransitionFuncs["execute"]>["key"]; // Pending
}
testFetchMachine();
