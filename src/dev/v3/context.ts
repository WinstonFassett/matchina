import { defineStates } from "../../states";
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
  Rejected: (pendingContext: FetchContext, error: Error) => ({...pendingContext, error}),
  Resolved: (pendingContext: FetchContext, data: any) => ({...pendingContext,  data }),
})

const m2 = createFactoryMachine(fetchStatesFromScratch, {
  Idle: {
    execute: 'Pending'
  },
  Pending: {
    // resolve: 'Resolved',
    resolve: (data: any) => (pending: FetchContext) => fetchStatesFromScratch.Resolved(pending, data),
    reject: 'Rejected',
  },
  Rejected: {},
  Resolved: {}
}, fetchStatesFromScratch.Idle())
const m2Api = createApi(m2)

// m2Api.reject({ tries: 12, url: ''}, new Error(''))
// m2Api.resolve({ data: 123, url: '', tries: 12 }, new Error('hi'))

const counterStates = defineStates({
  Idle: ({count = 0} = {}) => ({ count })
})

const counter = createFactoryMachine(counterStates, {
  Idle: {
    increment: (inc=1) => (state) => ({ ...state, count: state.count + inc }),
    decrement: (dec=1) => (state) => ({ ...state, count: state.count - dec }),
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
    increment: (inc = 1) => updateState(state => ({ count: state.count+inc })),
    decrement: (dec=1) => updateState(state => ({ count: state.count - dec })),
  }
}, oneState.State({ count: 0 }))

function updateState<T>(fn: (state: T) => Partial<T>) {
  return (target: T) => {
    return {...target, ...fn(target)}
  }
}
