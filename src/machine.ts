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

  const def: StateMachineDefinition<States, Transitions> = {
    states,
    transitions,
    // transition: transition,
    create: (initialState) => {
      let lastChange: any;
      const transition = (
        from: State,
        event: Event["type"],
        args: any[],
        def: StateMachineDefinition<States, Transitions>,
        machine: StateMachine<States, Transitions>,
      ): State | undefined => {
        return getExitState(
          def.states,
          def.transitions,
          from,
          event,
          args,
          def,
          machine,
        );
      };
      const machine: StateMachine<States, Transitions> = {
        def,
        getState: () => lastChange.to,
        getChange: () => lastChange,
        // event: events,
        send: (type, ...params) => {
          console.log("in machine SEND", type);
          const from = lastChange.to;
          const nextState = transition(from, type, params, def, machine);
          console.log({ nextState });
          if (nextState) {
            return machine.update((previous) => {
              console.log("updating for", type, { previous });
              const change = createChange({
                from,
                type,
                params,
                to: nextState,
              });
              console.log({ change });
              return change;
            });
          }
        },
        update: (updater) => {
          const change = updater(lastChange);
          if (change) {
            console.log("updated", change.to.key);
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

function getExitState<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
  sourceState: StateFromFactory<States>,
  type: StateMachineEvent<States, Transitions>["type"],
  params: StateMachineEvent<States, Transitions>["params"],
  def: StateMachineDefinition<States, Transitions>,
  machine?: StateMachine<States, Transitions>,
): StateFromFactory<States> | undefined {
  const targetFuncOrString = transitions[sourceState.key as any]?.[type as any];
  if (!targetFuncOrString) {
    return sourceState;
  }

  let targetState: StateFromFactory<States>;

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
