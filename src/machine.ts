import {
  StateFromFactory,
  StateMachine,
  StateMachineContext,
  StateMachineDefinition,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
  UpdateEnhancer,
} from "./machine-types";

export const InitializeMachine = "__init";

export function defineMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): StateMachineDefinition<States, Transitions> {
  return {
    states,
    transitions,
    create: (initialState, enhancer) => {
      return createMachine({ states, transitions, initialState, enhancer });
    },
  };
}

export function createMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(context: StateMachineContext<States, Transitions>) {
  const { states, transitions, initialState, enhancer } = context;
  type State = StateFromFactory<States>;
  type Event = StateMachineEvent<States, Transitions>;
  let lastChange: any;
  const transition = (
    from: State,
    event: Event["type"],
    args: any[],
    def: StateMachineContext<States, Transitions>,
    machine: StateMachine<States, Transitions>,
  ): State | undefined => {
    return getExitState(
      machine.config.states,
      machine.config.transitions,
      from,
      event,
      args,
      def,
      machine,
    );
  };
  const machine: StateMachine<States, Transitions> = {
    // def,
    getState: () => lastChange.to,
    getChange: () => lastChange,
    // event: events,
    send: (type, ...params) => {
      const from = lastChange?.to;
      const nextState = transition(from, type, params, context, machine);
      if (nextState && nextState !== from) {
        return machine.update((previous) => {
          const change = createChange({
            from,
            type,
            params,
            to: nextState,
          });
          return change;
        });
      }
    },
    update: (getUpdate) => {
      let change: undefined | Event;
      const { enhancer } = context;
      if (enhancer) {
        // console.log("using enhancer", lastChange);
        const changed = getUpdate(lastChange);
        // console.log("changed", changed);
        enhancer((enhancerChange) => {
          change = enhancerChange as any;
        }, changed as any);
      } else {
        change = getUpdate(lastChange);
      }
      if (change) {
        lastChange = change;
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
        from: context?.to,
        type: InitializeMachine,
        to: initialState,
      };
    });
  initialize();
  return machine;
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
  def: StateMachineContext<States, Transitions>,
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
