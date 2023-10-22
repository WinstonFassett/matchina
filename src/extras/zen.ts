import { StateMachine } from "../types";

export function zen <M extends StateMachine<any,any>>(machine: M) {
  const wrapper = {
    ...machine.do,
    get machine() { return machine },
    get state () { return machine.getState() },
  }
  return wrapper
}