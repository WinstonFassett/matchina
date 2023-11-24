import { defineStates } from "../../states";
import { MachineContextEvent } from "../v2/machine-types-v2";
import { createApi } from "./factory-event-api";
import { createFactoryMachine } from "./factory-machine";
import { createPromiseMachine } from "./promise";

type Context = any;

const states = defineStates({});

function defineContext<C, K extends string = "context">(initialContext: C) {
  return {
    defineStates() {},
    defineTransitions() {},
  };
}


const machine = createPromiseMachine((x: number) => new Promise(resolve => setTimeout(resolve, x)))
const api = createApi(machine)
api.execute(1100)


type FetchContext = {
  url: string;
  tries: number;
  error?: Error | undefined;
  data?: any;
};

const fetchStatesFromScratch = defineStates({
  Idle: undefined,
  Pending: (context: FetchContext) => context,
  Rejected: (context: FetchContext, error:Error) => ({...context, error}),
  Resolved: (context: FetchContext, data: any) => ({...context, data }),
})

const m2 = createFactoryMachine(fetchStatesFromScratch, {
  Idle: {
    execute: (url: string) => fetchStatesFromScratch.Pending({ url, tries: 0 })
  },
  Pending: {
    resolve: (data: any) => (ev) => fetchStatesFromScratch.Resolved(ev.from.data, data),
    reject: forwardData(fetchStatesFromScratch.Rejected, (error: Error) => error),
  },
  Rejected: {},
  Resolved: {}
}, fetchStatesFromScratch.Idle())

function forwardData<
  StateFunc extends (current: any, updates: any) => any,
  DataFunc extends (...args: any[]) => Parameters<StateFunc>[1],
>(stateFunc: StateFunc, getData: DataFunc) {
  return (...params: Parameters<DataFunc>) => {
    return (ev: MachineContextEvent<any>) => {
      return stateFunc(ev.from.data, getData(...params))
    }
  }
}
const m2Api = createApi(m2)
m2Api.execute('https://google.com')
m2Api.reject(new Error(''))
m2Api.resolve(1)

const counterStates = defineStates({
  Idle: ({count = 0} = {}) => ({ count })
})

const counter = createFactoryMachine(counterStates, {
  Idle: {
    increment: (inc=1) => (ev) => counterStates.Idle({ ...ev.to, count: ev.from.data.count + inc }),
    decrement: (dec=1) => (ev) => counterStates.Idle({ ...ev.to, count: ev.from.data.count - dec }),
  }
}, counterStates.Idle())

const counterApi = createApi(counter)
counterApi.increment(2)
counterApi.decrement(1)

const oneState = defineStates({
  State: ({ count } : { count: number }) => ({ count })
})

const m5 = createFactoryMachine(oneState, {
  State: {
    increment: (inc = 1) => updateState(({ count }) => ({ count: count+inc })),
    decrement: (dec=1) => updateState(({ count }) => ({ count: count-dec })),
    setCount: (count: number) => setInState({ count })
  }
}, oneState.State({ count: 0 }))

function updateState<E extends MachineContextEvent<any>>(fn: (state: E['from']['data']) => Partial<E['to']['data']>) {
  return (previous: E) => {
    return {...previous.from, data: fn(previous)}
  }
}

function setInState<
  E extends MachineContextEvent<any>
>(state: Partial<E['to']['data']>) {
  return (ev: E) => {
    return {...ev.from.data, ...state}
  }
}
