// primitive theoretical types. do not use lol

import { FlatMemberUnionToIntersection, Simplify } from "../utility-types";

// interface Change<T> {
//   from: T;
//   to: T;
// }

// interface ChangeEvent<
//   Type extends string = string,
//   To = any,
//   From = any,
// > {
//   type: Type;
//   to: To;
//   from: From;
// }

// interface CommandEvent<T, P extends any[]> {
//   type: T;
//   params: P;
// }

// type ChangeCommandEvent<
//   Type extends string = string,
//   Params extends any[] = any[],
//   To = any,
//   From = To,
// > = ChangeEvent<Type, To, From> & CommandEvent<Type, Params>;


// interface ChangeMachine<E extends Change<any>> {
//   getState(): E["to"] | E["from"];
//   getChange(): E;
//   update(change: E): void;
// }

// interface SimpleMachineContext<T> {  
//   transitions: TransitionRecord<T>;
// }

interface StateMachineEvent<To = any, From = To>  {
  type: string;
  params: any[];
  to: To;
  from: From;
}

interface StateMachinery<E extends StateMachineEvent = StateMachineEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: (type: E['type'], ...params: E['params']) => void;
  resolve(ev: ResolveEvent<E>): E | undefined;
  transition(change: E): void;
  guard(ev: E): boolean;
  handle(ev: E): E | undefined;
  before(ev: E): E | undefined;
  update(ev: E): void;
  effect(ev: E): void;
  leave(ev: E): void;
  enter(ev: E): void;
  notify(ev: E): void;
  after(ev: E): void;
}

interface FactoryMachineContext {
  states: AnyStatesFactory;
  transitions: TransitionRecord;
}

interface AltFactoryMachine<
    MC extends FactoryMachineContext,    
  > extends StateMachinery<FactoryMachineEvent<MC['transitions'], MC['states']>> {
    states: MC['states'];
    transitions: MC['transitions'];
  }
  
interface AltFactoryMachineEvent<FC extends FactoryMachineContext> {
  type: string & FlatEventKeys<FC['transitions']>;
  params: any[];
  from: AnyFactoryState<FC['states']>;
  to: AnyFactoryState<FC['states']>;
}

type FactoryMachineEvent<
  TC extends FactoryMachineTransitions<SF>,
  SF extends AnyStatesFactory,
> = 
  StateMachineEvent<
    AnyFactoryState<SF>, 
    AnyFactoryState<SF>
  >;


type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

type AnyFactoryState<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

type AnyStatesFactory = Record<string, (...params: any) => any>;

type FactoryMachineTransitions<SF extends AnyStatesFactory> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]?:
      | keyof SF
      | ((...params: any[]) => AnyFactoryState<SF>)
      | ((...params: any[]) => (
          ev: ResolveEvent<FactoryMachineEvent<any, SF>> & {
            from: AnyFactoryState<SF, FromStateKey>;
          },
        ) => AnyFactoryState<SF>);
  };
};

type  TransitionRecord<T = any> = Record<string, Record<string, T>>;

interface TransitionContext {
  transitions: TransitionRecord;
}


export function createStateMachine<E extends StateMachineEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
) {  
  let lastChange = {
    type: "init",
    to: initialState,
  } as E;
  const machine:  StateMachinery<E> & TransitionContext = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) {
        return { ...ev, to } as E;
      }
    },
    guard: (ev: E) => true,
    transition(change: E) {
      if (!machine.guard(change)) {
        return;
      }
      let update = machine.handle(change); // process change
      if (!update) {
        return;
      }
      update = machine.before(update); // prepare update
      if (!update) {
        return;
      }
      machine.update(update); // apply update
      machine.effect(update); // internal effects
      machine.notify(update); // notify consumers
      machine.after(update); // cleanup
    },
    handle: (change: E) => change,
    before: (update: E) => update,
    update: (update: E) => {
      lastChange = update;
    },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave(ev: E) {
      console.log("left", ev.from.key);
    },
    enter(ev: E) {
      console.log("entered", ev.to.key);
    },
    notify(ev: E) {},
    after(ev: E) {},
  };
  return machine;
}

export function createFactoryMachine<
  FC extends FactoryMachineContext,
  E extends AltFactoryMachineEvent<FC> = AltFactoryMachineEvent<FC>,
>(
  states: FC['states'],
  transitions: FC['transitions'],
  // initialState: AnyFactoryState<SF>,
  init: KeysWithZeroArgs<FC['states']> | AnyFactoryState<FC['states']>,
  // FunctionWithParameters<T> extends true
  //     ? { key: string }
  //     : keyof T | undefined
): AltFactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as AnyFactoryState<FC['states']>;
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState(transitions, states, ev);
      if (to) {
        return { ...ev, to } as E;
      }
    },
  });
  return machine as any;
}

export function nextFactoryState<
  SF extends AnyStatesFactory,
  TC extends FactoryMachineTransitions<SF>,
>(transitions: TC, states: SF, ev: ResolveEvent<FactoryMachineEvent<TC, SF>>) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) {
    return undefined;
  }
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

type KeysWithZeroArgs<T> = {
  [K in keyof T]: FunctionWithParameters<T[K]> extends true ? never : K;
}[keyof T];

type FunctionWithParameters<F> = F extends (...args: infer Args) => any
  ? Args extends []
    ? false
    : true
  : false;

type ResolveEvent<C> = Omit<C, 'to'>;

export type FactoryMachineState<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} //& MemberExtensions<Specs, "key">;

export type States<Specs extends UnionSpec> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

export type UnionSpec<Val = any> = {
  [k: string]: Val;
} & { _?: never };


type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => FactoryMachineState<Tag, Specs>
  : () => FactoryMachineState<Tag, Specs>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

type PromiseStates<F extends PromiseCallback, E = Error> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
}>;

const PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {},
  Rejected: {},
} as const;

type PromiseCallback = (...args: any[]) => Promise<any>;

const slowlyAddTwoNumbers = (
  x: number,
  y: number,
  duration = 1000,
  name = "unnamed",
) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));



const m : AltFactoryMachine<{
  states: {},
  transitions: {}
}> = {} as any;

function machineRelatedFunction(m: AltFactoryMachine<any>) {
  console.log('ok')
}

machineRelatedFunction(m)



export function createApi<
 M extends AltFactoryMachine<any>
>(machine: M): FactoryMachineApi<M> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return machine.send(eventKey, ...(params as any));
    };

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
  return events;
}

type FactoryMachineApi<
  FC extends FactoryMachineContext,
> = Simplify<object & FlatEventSenders<FC>>;

type WithApi<
  FC extends FactoryMachineContext
> = FC & {
  api: FactoryMachineApi<FC>;
};

export function withApi<M extends AltFactoryMachine<any>>(target: M) {
  const enhanced = target as WithApi<M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: createApi<M>(enhanced),
  }) as WithApi<M>;
}

export type FlatEventSenders<
  FC extends FactoryMachineContext,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<FC>
>;

export type StateEventTransitionSenders<
  FC extends FactoryMachineContext
> = {
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<FC>[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<FC>[StateKey][EventKey]
      >
    ) => void;
  };
};

export type StateEventTransitionFuncs<
  FC extends FactoryMachineContext
> = {
  [TransitionStateKey in keyof FC['transitions']]: StateEventTransitionFunc<
    FC,
    TransitionStateKey
  >;
};

export type StateEventTransitionFunc<
  FC extends FactoryMachineContext,
  TransitionStateKey extends keyof FC['transitions'],
  Transitions extends FC['transitions'] = FC['transitions'],
  States extends FC['states'] = FC['states'],
> = {
  [EventKey in keyof Transitions[TransitionStateKey] &
    string]: Transitions[TransitionStateKey][EventKey] extends keyof States
    ? // if state key
      (
        ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
      ) => AnyFactoryState<States, Transitions[TransitionStateKey][EventKey]>
    : Transitions[TransitionStateKey][EventKey] extends (
        ...args: infer A
      ) => (...innerArgs: any[]) => infer R
    ? // if 2-stage function
      (...args: A) => R
    : // if 1-stage function
    Transitions[TransitionStateKey][EventKey] extends (
        ...args: any[]
      ) => AnyFactoryState<States>
    ? (
        ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
      ) => AnyFactoryState<States> & {
        key: Transitions[TransitionStateKey][EventKey];
      }
    : never;
};
