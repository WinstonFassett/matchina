import { makeZen } from "./extras/zen";
import { createMachine } from "./machine";
import { StateMachineContext } from "./machine-types";

export function matchina(context: StateMachineContext<any, any>) {
  const machine = createMachine(context)
  return makeZen(machine)
}