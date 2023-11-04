import {
  FlatEventSenders,
  StateMachine,
  TransitionConfig,
} from "../machine-types";
import { MatchboxFromStatesFactory, StatesMatchboxFactory } from "../states";
import { onUpdate } from "./on-update";

export function withEvents<M extends StateMachine<any, any>>(machine: M) {
  type State = MatchboxFromStatesFactory<M["def"]["states"]>;
  const { states, transitions } = machine.def;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      console.log("SEND", eventKey, params);
      return machine.send(eventKey, ...(params as any));
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
        console.log("sender", eventKey);
      }
    }
  }
  console.log({ events });
  return Object.assign(machine, {
    event: events,
  }) as MachineWithEvents<typeof machine>;
}
export type MachineWithEvents<M extends StateMachine<any, any>> = M & {
  event: FlatEventSenders<M["def"]["states"], M["def"]["transitions"]>;
};
