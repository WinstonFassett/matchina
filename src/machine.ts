import { Middleware } from "./extras/middleware";
import {
  ChangeEventMatchers,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateMachine,
  StateMachineContext,
  StateMachineDefinition,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
} from "./machine-types";
import { RemainingProperties } from "./types";
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
    create: (initialState) =>
      createMachine({ states, transitions, initialState }),
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

  return class StateMachineImpl implements Machine {
    context: C;
    private lastChange: Event = undefined as any;
    constructor(context: RemainingProperties<C, PC> & Partial<C>) {
      this.context = Object.assign({}, staticContext, context) as unknown as C;
      this.lastChange = {
        type: InitializeMachine,
        to: this.createInitialState(),
      } as any;
    }

    createInitialState() {
      const { states, initialState } = this.context;
      return typeof initialState === "string"
        ? states[initialState]()
        : initialState;
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
      const nextState = transitionState(
        context.states,
        context.transitions,
        from,
        type,
        params,
        context,
        this as any,
      );
      if (nextState && nextState !== from) {
        return this.update((previous) => {
          const change = new MachineChangeImpl<States, Transitions>(
            type,
            params,
            from,
            nextState,
          );
          return change;
        });
      }
    }

    reset() {
      this.update((change) => {
        return {
          ...change,
          from: change?.to,
          type: InitializeMachine,
          to: this.createInitialState(),
        };
      });
    }

    use(enhancer: Middleware<Event>) {
      const origUpdate = this.update;
      console.log("USE");
      this.update = (updater) => {
        origUpdate.call(this, (current: any) => {
          let enhancedResult: any;
          enhancer(updater(current), (result) => {
            enhancedResult = result;
          });
          return enhancedResult ?? current;
        });
      };
      return () => {
        this.update = origUpdate;
      };
    }

    // TODO: factor out public method
    update(getUpdate: (ev: Event) => Event) {
      const change = getUpdate(this.lastChange);
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

class MachineChangeImpl<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> implements StateMachineEvent<Transitions, States>
{
  constructor(
    public type: StateMachineEvent<Transitions, States>["type"],
    public params: StateMachineEvent<Transitions, States>["params"],
    public from: StateFromFactory<States>,
    public to: StateFromFactory<States>,
  ) {
    Object.assign(this, { type, params, from, to });
  }

  // <M extends ChangeEventMatchers<Transitions, States>>(cases: M) => M[keyof M] extends (...args: any) => infer R ? R : never;
  match(cases: ChangeEventMatchers<Transitions, States>) {
    const handler = (cases as any)[this.type];
    if (handler) {
      return handler(...this.params);
    } else if (cases._) {
      return cases._(...this.params);
    }
  }
}

function transitionState<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  // drop states and transitions, use context instead
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
