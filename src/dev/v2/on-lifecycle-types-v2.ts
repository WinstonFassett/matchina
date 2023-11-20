import { Middleware } from "../../extras/middleware";
import {
  AnyStatesFactory,
  EventExitStatesIntersection,
  StateChangeMachineEvent,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateTransitionEvent,
  TransitionConfig,
} from "./machine-types-v2";

export type StateEventHookConfig<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  [SK in (keyof TC & keyof SF) | "*"]?: {
    on?: On<TC, SF, SK>;
  } & StateTransitionHookConfig<TC, SF, SK>;
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

export type StateTransitionHooks<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
  Event extends StateTransitionEvent<
    Transitions,
    States
  > = StateTransitionEvent<Transitions, States>,
> = {
  leave: Middleware<
    StateChangeMachineEvent<
      Event["type"],
      Event["to"],
      StateFromFactory<States, StateKey>,
      Event["params"]
    >
  >;
  enter: Middleware<
    StateChangeMachineEvent<
      Event["type"],
      StateFromFactory<States, StateKey>,
      Event["from"],
      Event["params"]
    >
  >;
};

export type TransitionHookExtensions<T> = {
  guard: Middleware<T>;
  before: Middleware<T>;
  handle: Middleware<T>;
  after: Middleware<T>;
};

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

type On<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  SK extends keyof TC | "*",
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>,
  EK extends E["type"] = E["type"],
> =
  // regular state
  SK extends keyof SF
    ? {
        [StateEventKey in keyof TC[SK] | "*"]?: StateEventKey extends EK //FlatEventKeys<E> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
            > extends StateFromFactory<SF>
            ? TransitionHookConfig<
                StateChangeMachineEvent<
                  StateEventKey,
                  // StateFromFactory<SF>,
                  ReturnType<
                    StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
                  >,
                  StateFromFactory<SF, SK>,
                  Parameters<
                    StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
                  >
                >
              >
            : never
          : TransitionHookConfig<
              StateChangeMachineEvent<
                EK,
                StateFromFactory<SF>,
                StateFromFactory<SF, SK>,
                any[]
              >
            >;
      }
    : {
        [AnyStateEvent in EK | "*"]?: TransitionHookConfig<
          StateChangeMachineEvent<
            AnyStateEvent extends "*" ? EK : AnyStateEvent,
            AnyStateEvent extends keyof EventExitStatesIntersection<TC, SF>
              ? EventExitStatesIntersection<
                  TC,
                  SF
                >[AnyStateEvent] extends StateFromFactory<SF>
                ? EventExitStatesIntersection<TC, SF>[AnyStateEvent]
                : StateFromFactory<SF>
              : StateFromFactory<SF>,
            StateFromFactory<
              SF,
              AnyStateEvent extends keyof TC[SK]
                ? Extract<SK, string>
                : Extract<keyof TC, string>
            >,
            any[]
          >
        >;
      };
