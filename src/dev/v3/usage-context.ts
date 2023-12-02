import { defineStates } from "../../states";
import { createApi } from "./factory-event-api";
import { createFactoryMachine } from "./factory-machine";
import { forwardData, updateState, setInState } from "./update-state";
import { createPromiseMachine } from "./promise";

const machine = createPromiseMachine(
  (x: number) => new Promise((resolve) => setTimeout(resolve, x)),
);
const api = createApi(machine);
api.execute(1100);

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
      resolve: forwardData(Resolved, (data: any) => data),
      reject: forwardData(Rejected, (error: Error) => error),
    },
    Rejected: {},
    Resolved: {},
  },
  Idle(),
);

const m2Api = createApi(m2);
m2Api.execute("https://google.com");
m2Api.reject(new Error(""));
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
          counterStates.Idle({ ...ev.to, count: ev.from.data.count + inc }),
      decrement:
        (dec = 1) =>
        (ev) =>
          counterStates.Idle({ ...ev.to, count: ev.from.data.count - dec }),
    },
  },
  counterStates.Idle(),
);

const counterApi = createApi(counter);
counterApi.increment(2);
counterApi.decrement(1);

const oneState = defineStates({
  State: ({ count }: { count: number }) => ({ count }),
});

const m5 = createFactoryMachine(
  oneState,
  {
    State: {
      increment: (inc = 1) =>
        updateState(({ count }) => ({ count: count + inc })),
      decrement: (dec = 1) =>
        updateState(({ count }) => ({ count: count - dec })),
      setCount: (count: number) => setInState({ count }),
    },
  },
  oneState.State({ count: 0 }),
);
