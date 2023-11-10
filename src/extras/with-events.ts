import { FlatEventSenders, StateMachine } from "../machine-types";

export function withEvents<M extends StateMachine<any, any>>(machine: M) {
  const { states, transitions } = machine.context;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
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
      }
    }
  }
  return Object.assign(machine, {
    event: events as FlatEventSenders<
      M["context"]["transitions"],
      M["context"]["states"]
    >,
  });
}
