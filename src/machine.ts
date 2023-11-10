import { RemainingProperties } from "./../playground/builder.usage";
import {
  StateFromFactory,
  StateMachine,
  StateMachineContext,
  StateMachineDefinition,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
} from "./machine-types";

export const InitializeMachine = "__init";

export function defineMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): StateMachineDefinition<Transitions, States> {
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
  C extends StateMachineContext<Transitions, States>,
  PC extends Partial<C>,
>(
  staticContext: PC,
): new (
  context: RemainingProperties<C, PC> & Partial<C>,
) => StateMachine<Transitions, States> {
  type Machine = StateMachine<Transitions, States>;
  type State = StateFromFactory<States>;
  type Event = StateMachineEvent<Transitions, States>;

  function transition(
    from: State,
    event: Event["type"],
    args: any[],
    context: StateMachineContext<Transitions, States>,
    machine: Machine,
  ): State | undefined {
    return transitionState(
      machine.context.states,
      machine.context.transitions,
      from,
      event,
      args,
      context,
      machine,
    );
  }

  return class StateMachineImpl implements Machine {
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

    getState() {
      return this.lastChange.to;
    }

    getChange() {
      return this.lastChange;
    }

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
        enhancer(
          (enhancerChange) => {
            change = enhancerChange as any;
          },
          getUpdate(lastChange) as any,
        );
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
): StateMachine<C["transitions"], C["states"]> {
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
  type: StateMachineEvent<Transitions, States>["type"];
  params: StateMachineEvent<Transitions, States>["params"];
  from: StateFromFactory<States>;
  to: StateFromFactory<States>;
}): StateMachineEvent<Transitions, States> {
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

function transitionState<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
  from: StateFromFactory<States>,
  type: StateMachineEvent<Transitions, States>["type"],
  params: StateMachineEvent<Transitions, States>["params"],
  context: StateMachineContext<Transitions, States>,
  machine?: StateMachine<Transitions, States>,
): StateFromFactory<States> | undefined {
  const targetFuncOrString = transitions[from.key as any]?.[type as any];
  if (!targetFuncOrString) {
    return from;
  }
  if (typeof targetFuncOrString === "function") {
    const targetStateOrFunc = targetFuncOrString(...params);
    return typeof targetStateOrFunc === "function"
      ? (targetStateOrFunc as any)(from, type, context, machine)
      : targetStateOrFunc;
  } else {
    return states[targetFuncOrString as keyof typeof states](...params) as any;
  }
}
