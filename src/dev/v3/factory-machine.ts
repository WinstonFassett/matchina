import { StateMachinery, createStateMachine } from "./state-machine";
import {
  AnyStatesFactory,
  ChangeCommandEvent,
  ResolveEvent,
  StateFromFactory,
} from "./types";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
  E extends FactoryMachineEvent<TC, SF>,
>(
  states: SF,
  transitions: TC,
  initialState: StateFromFactory<SF>, // : FactoryMachine<TC,SF> &
): FactoryMachine<TC, SF> {
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState(transitions, states, ev);
      if (to) return { ...ev, to };
    },
  });
  return machine as any;
}

export function nextFactoryState<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
>(transitions: TC, states: SF, ev: ChangeCommandEvent) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) return undefined;
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function"
    // consider changing fn to accept AnyStateMachinery
    // from and type as separate, nah. use event
    // maybe only use event. event and machine if not on it
      ? stateOrFn(ev)
      : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

export type FactoryTransitionConfig<
  SF extends AnyStatesFactory,
  CP extends any[] = any[],
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: CP) => StateFromFactory<SF>)
      | ((...params: CP) => (ev: FactoryMachineEvent<any,SF> & { from: StateFromFactory<SF, FromStateKey> }) => StateFromFactory<SF>);
  };
};

export interface FactoryMachine<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
  E extends FactoryMachineEvent<TC, SF> = FactoryMachineEvent<TC, SF>,
> extends StateMachinery<E> {
  states: SF;
  transitions: TC;
}

type FactoryMachineEvent<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  type: string & FlatEventKeys<TC>;
  to: StateFromFactory<SF>;
  from: StateFromFactory<SF>;
  params: any[];
};
// ChangeCommandEvent<
//   string & FlatEventKeys<TC>,
//   any[],
//   StateFromFactory<SF>,
//   StateFromFactory<SF>
// >;

// export interface StateChangeMachineEvent<
//   Type extends string,
//   To extends State,
//   From extends State,
//   Params extends any[] = any[],
// > extends ChangeMachineEvent<Type, To, From, Params> {}

export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];
