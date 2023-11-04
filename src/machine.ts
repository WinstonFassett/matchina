import {
  StateMachine,
  StateMachineDefinition,
  StateMachineEvent,
  TransitionConfig,
  StatesFactory,
  StateFromFactory,
} from "./machine-types";

export const InitializeMachine = "__init";

export function defineMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): StateMachineDefinition<States, Transitions> {
  type State = StateFromFactory<States>;
  type Event = StateMachineEvent<States, Transitions>;

  // Todo: lift this up

  function transition(
    sourceState: State,
    type: Event["type"],
    params: Event["params"],
    def: StateMachineDefinition<States, Transitions>,
    machine?: StateMachine<States, Transitions>,
  ): State | undefined {
    const targetFuncOrString =
      transitions[sourceState.key as any]?.[type as any];
    if (!targetFuncOrString) {
      return sourceState;
    }

    let targetState: State;

    if (typeof targetFuncOrString === "function") {
      const targetStateOrFunc = targetFuncOrString(...params);
      targetState =
        typeof targetStateOrFunc === "function"
          ? (targetStateOrFunc as any)(sourceState, type, def, machine)
          : targetStateOrFunc;
    } else {
      targetState = states[targetFuncOrString as keyof typeof states](
        ...params,
      ) as any;
    }
    return targetState;
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
          machine.send(eventKey, ...(params as any));

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
          const nextState = transition(
            lastChange.to,
            type,
            params,
            def,
            machine,
          );
          if (nextState) {
            return machine.update(() =>
              createChange({
                from: lastChange.to,
                type,
                params,
                to: nextState,
              }),
            );
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
            from: context?.to,
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


function createChange<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>({
  type,
  params,
  from,
  to,
}: {
  type: StateMachineEvent<States, Transitions>["type"];
  params: StateMachineEvent<States, Transitions>["params"];
  from: StateFromFactory<States>;
  to: StateFromFactory<States>;
}): StateMachineEvent<States, Transitions> {
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
  };
}
