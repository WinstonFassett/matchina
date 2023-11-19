import {
  AnyStatesFactory,
  FlatEventKeys,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateTransitionEvent,
  StateChangeMachineEvent,
  TransitionConfig,
  FlatExitStates,
  EventExitStatesIntersection,
  StateMachine
} from "./machine-v2";
import { Middleware } from "../extras/middleware";

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<T> = {
  guard: Middleware<T>;
  before: Middleware<T>;
  handle: Middleware<T>;
  after: Middleware<T>;
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

export type StateTransitionHooks<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
  Event extends StateTransitionEvent<Transitions, States> = StateTransitionEvent<Transitions, States>,
> = {
  leave: Middleware<
    StateChangeMachineEvent<
      Event['type'],
      Event['to'],
      StateFromFactory<States, StateKey>,
      Event['params']
    >
  >;
  enter: Middleware<
  StateChangeMachineEvent<
      Event['type'],
      StateFromFactory<States, StateKey>,
      Event['from'],
      Event['params']
    >
  >;
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

type On<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  SK extends keyof TC | "*",
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>, // HMM DUNNO
  EK extends E['type'] = E['type'],
> =
  // regular state
  SK extends keyof SF
    ? // specific state
      {
        [StateEventKey in
          | keyof TC[SK]
          | "*"]?: 
          StateEventKey extends EK //FlatEventKeys<E> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<
                TC,
                SF
              >[SK][StateEventKey]
            > extends StateFromFactory<SF>
            ? TransitionHookConfig<
                StateChangeMachineEvent<
                  StateEventKey,
                  // StateFromFactory<SF>,
                  ReturnType<
                    StateEventTransitionFuncs<
                      TC,
                      SF
                    >[SK][StateEventKey]
                  >,
                  StateFromFactory<SF, SK>,
                  Parameters<
                    StateEventTransitionFuncs<
                      TC,
                      SF
                    >[SK][StateEventKey]
                  >
                >
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              StateChangeMachineEvent<
                EK,
                StateFromFactory<SF>,
                StateFromFactory<SF, SK>,
                any[]
              >
            >;
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | EK
          | "*"]?: TransitionHookConfig<

          StateChangeMachineEvent<
            AnyStateEvent extends '*' ? EK : AnyStateEvent,
            AnyStateEvent extends keyof EventExitStatesIntersection<TC,SF>
              ? EventExitStatesIntersection<TC,SF>[AnyStateEvent] extends StateFromFactory<SF>
                ? EventExitStatesIntersection<TC,SF>[AnyStateEvent]
                : StateFromFactory<SF>
              : StateFromFactory<SF>,
            StateFromFactory<SF,
              AnyStateEvent extends keyof TC[SK]
                ? Extract<SK, string>
                : Extract<keyof TC, string>
            >,
            any[]
          >
        >;
      };

export type StateEventHookConfig<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  [SK in keyof TC & keyof SF | "*"]?: {
    on?: On<TC, SF, SK>;
  } & StateTransitionHookConfig<TC, SF, SK>;
};


export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: StateMachine<Transitions, States>,
  config: StateEventHookConfig<Transitions, States>,
) {
}