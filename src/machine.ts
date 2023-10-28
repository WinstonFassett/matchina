import {
  StateMachine,
  StateMachineDefinition,
  StateMachineEvent,
  TransitionConfig,
} from "./machine-types";
import { StateFromFactory, StatesFactory } from "./states";

export const InitializeMachine = "__init";

export function defineMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): StateMachineDefinition<States, Transitions> {
  type State = StateFromFactory<States>;
  type Event = StateMachineEvent<States, Transitions>;

  function createChange({
    type,
    params,
    from,
    to,
  }: {
    type: Event["type"];
    params: Event["params"];
    from: State;
    to: State;
  }) {
    return {
      type,
      params,
      from,
      to,
      match(cases) {
        const handler = (cases as any)[type];
        if (handler) {
          return handler(...params);
        } else if (cases._) {
          return cases._(...params);
        }
      },
    } as Event;
  }

  function transition(
    lastChange: Event,
    type: Event["type"],
    params: Event["params"],
    def: StateMachineDefinition<States, Transitions>,
    machine?: StateMachine<States, Transitions>,
  ): Event | undefined {
    const targetFuncOrString =
      transitions[lastChange.to.key as any]?.[type as any];
    if (!targetFuncOrString) {
      return lastChange;
    }

    let targetState: State;

    if (typeof targetFuncOrString === "function") {
      const targetStateOrFunc = targetFuncOrString(...params);
      targetState =
        typeof targetStateOrFunc === "function"
          ? targetStateOrFunc(lastChange.to, type, def, machine)
          : targetStateOrFunc;
    } else {
      targetState = states[targetFuncOrString as keyof typeof states](
        ...params,
      ) as any;
    }
    return createChange({
      from: lastChange.to,
      type,
      params,
      to: targetState,
    });
  }

  const def: StateMachineDefinition<States, Transitions> = {
    states,
    transitions,
    transition,
    create: (initialState) => {
      let lastChange: any;
      const createSender =
        (eventKey: any) =>
        (...params: any[]) =>
          machine.send(eventKey, ...params);

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
      const machine: StateMachine<States, Transitions> = {
        def,
        getState: () => lastChange.to,
        getChange: () => lastChange,
        event: events,
        send: (type, ...params) => {
          const next = transition(lastChange, type, params, def, machine);
          if (next) {
            return machine.update(() => next);
          }
        },
        update: (updater) => {
          const change = updater(lastChange);
          if (change) {
            lastChange = change;
          }
        },
        reset: () => initialize(),
        config: {
          initialState,
        },
      };
      const initialize = () =>
        machine.update((context) => {
          return {
            ...context,
            type: InitializeMachine,
            to: initialState,
          };
        });
      initialize();
      return machine;
    },
  };
  return def;
}
