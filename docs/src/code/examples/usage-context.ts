import { createApi, createFactoryMachine, createPromiseMachine, defineStates, updateState } from "matchina";

// ---cut---
const machine = createPromiseMachine(
  (x: number) => new Promise((resolve) => setTimeout(resolve, x)),
);
const api = createApi(machine);
machine.execute(1100);

type FetchContext = {
  url: string;
  tries: number;
  error?: Error | undefined;
  data?: any;
};

const assign = (...args: any[]) => Object.assign({}, ...args);

const { Idle, Pending, Rejected, Resolved } = defineStates({
  Idle: undefined,
  Pending: (context: FetchContext) => context,
  Rejected: (context: FetchContext, error: Error) => assign(context, { error }),
  Resolved: (context: FetchContext, data: any) => assign(context, { data }),
});

const m2 = createFactoryMachine(
  { Idle, Pending, Rejected, Resolved },
  {
    Idle: {
      execute: (url: string) => Pending({ url, tries: 0 }),
    },
    Pending: {
      resolve: (data) => (ev) => Resolved(ev.from.data, data),
      reject: (error: Error) => (ev) => Rejected(ev.from.data, error),
    },
    Rejected: {},
    Resolved: {},
  },
  Idle(),
);

const m2Api = createApi(m2);
m2Api.execute("https://google.com");
m2Api.reject(new Error("nope"));
m2Api.resolve(1);

const counterStates = defineStates({
  Idle: ({ count = 0 } = {}) => ({ count }),
});

const counter = createFactoryMachine(
  counterStates,
  {
    Idle: {
      increment:
        (inc = 1) =>
        (ev) =>
          counterStates.Idle({ count: ev.from.data.count + inc }),
      decrement:
        (dec = 1) =>
        (ev) =>
          counterStates.Idle({ count: ev.from.data.count - dec }),
    },
  },
  counterStates.Idle(),
);

const counterApi = createApi(counter);
counterApi.increment(2);
counterApi.decrement(1);

const oneState = defineStates({
  State: ({ count, meta }: { count: number; meta: { name: string } }) => ({
    count,
    meta,
  }),
});

const m5 = createFactoryMachine(
  oneState,
  {
    State: {
      increment: (inc = 1) => (ev) => updateState(({ count }) => ({ count: count+inc }))(ev),
      // increment2: (inc=1) => updateState(),
      decrement:
        (dec = 1) =>
        (ev) =>
          oneState.State({ ...ev.from.data, count: ev.from.data.count - dec }),
      setCount: (count: number) => (ev) =>
        oneState.State({ ...ev.from.data, count }),
    },
  },
  oneState.State({ count: 0, meta: { name: "howdy" } }),
);

const api5 = createApi(m5);
api5.increment(2);
console.log('state', m5.getState())

m5.send('increment', 2);
console.log('state', m5.getState())
