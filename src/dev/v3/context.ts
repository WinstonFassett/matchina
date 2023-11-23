import { defineStates } from "../../states";
import { createApi } from "./factory-event-api";
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
