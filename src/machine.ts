import { RemainingProperties } from "../playground/builder.usage";
import {
  SendFunction,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateMachine,
  StateMachineContext,
  StateMachineDefinition,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
  UpdateEnhancer,
} from "./machine-types";
import { SwapFunc } from "./types";

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
    create: (initialState, enhancer) =>
      createMachine({ states, transitions, initialState, enhancer }),
  };
}

export function createMachineClass<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  C extends StateMachineContext<States, Transitions>,
  PC extends Partial<C>,
>(staticContext: PC) {
  type Machine = StateMachine<States, Transitions>;
  type State = StateFromFactory<States>;
  type Event = StateMachineEvent<States, Transitions>;

  function transition(
    from: State,
    event: Event["type"],
    args: any[],
    def: StateMachineContext<States, Transitions>,
    machine: Machine,
  ): State | undefined {
    return getExitState(
      machine.context.states,
      machine.context.transitions,
      from,
      event,
      args,
      def,
      machine,
    );
  }

  return class StateMachineImpl
    implements StateMachine<States, Transitions, C, Event>
  {
    static transition = transition;
    context: C;
    private lastChange: Event = undefined as any;
    constructor(context: RemainingProperties<C, PC> & Partial<C>) {
      this.context = Object.assign({}, staticContext, context) as unknown as C;
      this.initialize();
    }

    createInitialState() {
      const { states, initialState } = this.context;
      return typeof initialState === "string"
        ? states[initialState]()
        : initialState;
    }

    initialize() {
      this.update((change) => {
        return {
          ...change,
          from: change?.to,
          type: InitializeMachine,
          to: this.createInitialState(),
        };
      });
    }

    // // def,
    getState() {
      return this.lastChange.to;
    }

    getChange() {
      return this.lastChange;
    }

    // // event: events,
    send(type: string, ...params: any[]) {
      const { context, lastChange } = this;
      const from = lastChange?.to;
      const nextState = transition(from, type, params, context, this as any);
      if (nextState && nextState !== from) {
        return this.update((previous) => {
          const change = createChange({
            from,
            type,
            params,
            to: nextState,
          });
          return change;
        });
      }
    }

    reset() {
      this.initialize();
    }

    update(getUpdate: (ev: Event) => Event) {
      const { context, lastChange } = this;
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
        this.lastChange = change;
      }
    }
  };
}

export function createMachine<C extends StateMachineContext<any, any>>(
  context: C,
): StateMachine<C["states"], C["transitions"]> {
  const Machine = createMachineClass(context);
  return new Machine(context);
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
