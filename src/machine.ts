import {
  MachineDefinition,
  MachineEvent,
  StateMachine,
  StateTransitionsConfig,
} from "./machine-types";
import { StateCreators } from "./states";

const INITIALIZE = "__init";

export function defineMachine<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
>(
  states: States,
  transitions: Transitions,
): MachineDefinition<States, Transitions> {
  type State = ReturnType<States[keyof States]>;
  type Event = MachineEvent<States, Transitions>;

  function createEvent({
    event,
    params,
    from,
    to,
  }: {
    event: Event["event"];
    params: Event["params"];
    from: State;
    to: State;
  }) {
    return {
      event,
      params,
      from,
      to,
      match(cases) {
        const handler = (cases as any)[event];
        if (handler) {
          return handler(...params);
        } else if (cases._) {
          return cases._(...params);
        }
      },
    } as Event;
  }
  return {
    states,
    transitions,
    create: (initialState) => {
      let currentState: ReturnType<States[keyof States]> = initialState;
      let lastEvent: any;
      const createSender =
        (eventKey: string) =>
        (...params: any[]) =>
          machine.send(eventKey, params);

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
      const machine: StateMachine<
        States,
        Transitions
      > = {
        states,
        getState: () => currentState,
        getLast: () => lastEvent,
        events,
        transitions: transitioners,
        send: (type, params) => {
          const next = machine.transition(type, params);
          if (next) {
            return machine.update(() => next);
          }
        },
        transition: (type, params) => {
          const toKey = transitions[lastEvent.to.state as any]?.[type as any];
          if (!toKey) {
            return lastEvent;
          }
          const to = states[toKey as any](...params);
          return createEvent({
            from: lastEvent.to,
            event: type,
            params,
            to: to as any,
          });
        },
        update: (updater) => {
          const event = updater(lastEvent);
          if (event) {
            lastEvent = event;
            currentState = event.to;
          }
        },
        reset: () => initialize(),
        config: {
          states,
          transitions,
        },
      };
      const initialize = () =>
        machine.update((context) => {
          return {
            ...context,
            event: INITIALIZE,
            to: initialState,
          };
        });
      initialize();
      return machine;
    },
  };
}
