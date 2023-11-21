import { StateFromFactory } from "../v2/machine-types-v2";
import { createStateMachine } from "./machine-funcs";
import {
  AnyStatesFactory,
  ChangeCommandEvent
} from "./machine-types-v3";


export function createFactoryMachine<
  E extends ChangeCommandEvent,
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
>(states: SF, transitions: TC, initialState: StateFromFactory<SF>) {
  const machine = createStateMachine<E>(transitions, initialState);  
  const factoryMachine = Object.assign(machine, {
    states,
    resolve (ev: E) {
      const to = factoryResolveNextState(transitions, states, ev);
      if (to) return { ...ev, to } as E;
    }
  })
  return factoryMachine
}

export type FactoryTransitionConfig<
  SF extends AnyStatesFactory,
  CP extends any[] = any[],
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (...context: CP) => StateFromFactory<SF>);
  };
};

function factoryResolveNextState<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
>(
  transitions: TC,
  states: SF,
  ev: ChangeCommandEvent,
) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) return undefined;
  if (typeof to === "function") {
    const targetStateOrFunc = to(...ev.params);
    return typeof targetStateOrFunc === "function"
      ? targetStateOrFunc(ev.from, ev.type, states, transitions)
      : targetStateOrFunc;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}