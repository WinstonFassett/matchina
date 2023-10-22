import { StateFromFactory, StatesFactory } from "./states";
import {
  MachineDefinition,
  StateMachine,
  StateMachineEvent,
  TransitionConfig,
} from "./types";

export const MachineSymbol = Symbol("Machine");

export const INITIALIZE_EVENT = "__init";

export function defineMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): MachineDefinition<States, Transitions> {
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
  const def: MachineDefinition<States, Transitions> = {
    states,
    transitions,
    create: (initialState) => {
      let currentState: StateFromFactory<States> = initialState;
      let lastChange: any;
      const createSender =
        (eventKey: any) =>
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
      function getChange(
        type: Event["type"],
        params: any[],
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
              ? targetStateOrFunc(type, machine)
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
      const machine: StateMachine<States, Transitions> = {
        def,
        states,
        getState: () => currentState,
        getLast: () => lastChange,
        do: events,
        send: (type, params) => {
          const next = machine.getChange(type, params);
          if (next) {
            return machine.update(() => next);
          }
        },
        getChange,
        update: (updater) => {
          const change = updater(lastChange);
          if (change) {
            lastChange = change;
            currentState = change.to;
          }
        },
        reset: () => initialize(),
        config: {
          states,
          transitions,
          initialState,
        },
      };
      const initialize = () =>
        machine.update((context) => {
          return {
            ...context,
            type: INITIALIZE_EVENT,
            to: initialState,
          };
        });
      initialize();
      return machine;
    },
  };
  return def;
}
