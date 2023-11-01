// @ts-nocheck
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
type AnyEventKey = keyof any;
interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
type CreateFunc<T, P = any> = (...args: P[]) => T;
type SwapFunc<T> = (updater: (event: T) => T) => void;
type Members<T> = T[keyof T];
type MemberReturnType<
  F extends {
    [key: keyof any]: (...args: any[]) => any;
  },
  K extends keyof F,
> = ReturnType<F[K]>;
type FlatMemberUnion<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];
type TUnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never;
type FlatMemberUnionToIntersection<T> = TUnionToIntersection<
  FlatMemberUnion<T>
>;

type MatchboxConfig = {
  [key: string | number | symbol]: MatchboxSpec;
};
type MatchboxSpec = ((...args: any[]) => any) | undefined | any;
type MatchboxCreator<B extends MatchboxSpec> = B extends (...args: any[]) => any
  ? B
  : B extends undefined
  ? () => object
  : () => B;
type MatchboxConfigValues<Config extends MatchboxConfig> = {
  [BoxKey in keyof Config]: MatchboxCreator<Config[BoxKey]> extends (
    ...args: any
  ) => infer R
    ? R
    : never;
};
type Matchbox<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
  K extends
    keyof MatchboxConfigValues<Config> = keyof MatchboxConfigValues<Config>,
  D extends MatchboxConfigValues<Config>[K] = MatchboxConfigValues<Config>[K],
> = {
  data: D;
} & {
  [Key in TagKey as Extract<TagKey, string>]: Extract<K, string>;
};
type MatchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = {
  [BoxKey in keyof Config]: MatchboxCreator<Config[BoxKey]> extends (
    ...args: any[]
  ) => any
    ? (
        ...args: Parameters<MatchboxCreator<Config[BoxKey]>>
      ) => Matchbox<Config, TagKey, BoxKey>
    : never;
};
type MatchboxFactoryValues<Config extends MatchboxFactory<any, any>> = {
  [BoxKey in keyof Config]: ReturnType<Config[BoxKey]>;
};
type MatchboxFromConfig<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
> = Matchbox<Config, TagKey>;
type MatchboxFromFactory<
  F extends MatchboxFactory<any, any>,
  K extends keyof F = keyof F,
> = MemberReturnType<F, K>;

declare function matchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
>(config: Config, tagKey?: TagKey): MatchboxFactory<Config, TagKey>;
declare function matchbox<
  Config extends MatchboxConfig,
  Tag extends keyof Config,
  TagKey extends string = "tag",
  D = any,
>(
  tag: Tag,
  data: D,
  tagKey?: TagKey,
): MatchboxImpl<Config, TagKey, keyof Config>;
declare class MatchboxImpl<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
  Tag extends keyof Config = keyof Config,
> {
  tag: Tag;
  data: any;
  [tagKey: string]: any;
  constructor(tag: Tag, data: any, tagKey: TagKey);
}

/**
 * This is MyType description
 */
type StatesFactory<StatesConfig extends MatchboxConfig = any> = MatchboxFactory<
  StatesConfig,
  "key"
>;
type StateFromFactory<
  States extends StatesFactory,
  K extends keyof States = keyof States,
> = MatchboxFromFactory<States, K>;
declare function defineStates<StatesConfig extends MatchboxConfig = any>(
  config: StatesConfig,
): MatchboxFactory<StatesConfig, "key">;

type TransitionConfig<States extends StatesFactory> = {
  [SourceState in keyof States]: {
    [EventKey: AnyEventKey]:
      | keyof States
      | CreateFunc<StateFromFactory<States>>
      | TwoPhaseTransitionToStateFunc<States, SourceState>;
  };
};
type TwoPhaseTransitionToStateFunc<
  States extends StatesFactory,
  SourceStateKey extends keyof States = keyof States,
  StateEventKey extends AnyEventKey = AnyEventKey,
  P = any,
  ExitState extends StateFromFactory<States> = StateFromFactory<States>,
> = (
  ...args: P[]
) => (
  sourceState: StateFromFactory<States, SourceStateKey>,
  eventType: StateEventKey,
  def: StateMachineDefinition<States, any>,
  machine?: StateMachine<States, any>,
) => ExitState;
interface StateMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> {
  def: StateMachineDefinition<States, Transitions>;
  config: {
    initialState: StateFromFactory<States>;
  };
  getState: () => StateFromFactory<States>;
  send: SendFunction<States, Transitions>;
  event: FlatEventSenders<States, Transitions>;
  getChange: () => StateMachineEvent<States, Transitions>;
  reset(): void;
  update: SwapFunc<StateMachineEvent<States, Transitions>>;
}
type SendFunction<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = <
  E extends S extends keyof Transitions
    ? keyof StateEventTransitionSenders<States, Transitions>[S]
    : Event["type"],
  S extends keyof Transitions = keyof States,
  P = Exclude<
    S extends keyof Transitions
      ? Parameters<StateEventTransitionSenders<States, Transitions>[S][E]>[0]
      : Parameters<
          StateEventTransitionSenders<States, Transitions>[keyof States][E]
        >[0],
    undefined
  >,
>(
  event: E,
  ...params: P[]
) => void;
type StateMachineCreator<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: StateFromFactory<States>,
) => StateMachine<States, Transitions>;
type StateMachineDefinition<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  Event extends StateMachineEvent<States, Transitions> = StateMachineEvent<
    States,
    Transitions
  >,
> = {
  create: StateMachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
  transition(
    sourceState: StateFromFactory<States>,
    type: Event["type"],
    params: Event["params"],
    def: StateMachineDefinition<States, Transitions>,
    machine?: StateMachine<States, Transitions>,
  ): StateFromFactory<States> | undefined;
};
type StateMachineEvent<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlatEventKeys<States, Transitions> = FlatEventKeys<
    States,
    Transitions
  >,
  From extends StateFromFactory<States> = StateFromFactory<States>,
  To extends StateFromFactory<States> = StateFromFactory<States>,
  Params = any[],
> = ChangeEvent<EventKey, From, To> & {
  params: Params;
};

type StateEventTransitionFuncs<States extends StatesFactory, Transitions> = {
  [StateKey in keyof Transitions]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (
          ...args: Parameters<States[Transitions[StateKey][EventKey]]>
        ) => StateFromFactory<States, Transitions[StateKey][EventKey]>
      : Transitions[StateKey][EventKey] extends TwoPhaseTransitionToStateFunc<
          States,
          StateKey,
          EventKey
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => ReturnType<ReturnType<Transitions[StateKey][EventKey]>>
      : Transitions[StateKey][EventKey] extends CreateFunc<
          StateFromFactory<States>
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & {
          key: Transitions[StateKey][EventKey];
        }
      : never;
  };
};
type StateEventTransitionSenders<States extends StatesFactory, Transitions> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
      >
    ) => void;
  };
};
type FlatEventSenders<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;
type FlatEventKeys<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<
    States,
    Transitions
  >]: keyof StateEventTransitionFuncs<States, Transitions>[StateKey];
}[keyof StateEventTransitionFuncs<States, Transitions>];
type FlatExitStates<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<States, Transitions>[StateKey]];
}>;

declare const InitializeMachine = "__init";
declare function defineMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(
  states: States,
  transitions: Transitions,
): StateMachineDefinition<States, Transitions>;

declare function createPromiseMachine<
  T,
  A extends any[],
  E extends Error = Error,
>(
  makePromise?: (...args: A) => Promise<T>,
): StateMachine<
  MatchboxFactory<
    {
      Idle: undefined;
      Pending: (...params: A[]) => A[];
      Rejected: (error: E) => E;
      Resolved: (data: T) => T;
    },
    "key"
  >,
  {
    Idle: {
      execute: "Pending";
    };
    Pending: {
      resolve: "Resolved";
      reject: "Rejected";
    };
    Resolved: {};
    Rejected: {};
  }
> & {
  promise: Promise<T> | undefined;
  done: Promise<void> | undefined;
};

// const machine = createPromiseMachine((x: number, y: string) => new Promise(resolve => setTimeout(() => resolve(`${x} ${y}`), 1000)));
const machine = createPromiseMachine(async (x: number) => {
  return "hi";
});
