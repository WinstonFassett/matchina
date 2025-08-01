import { AbortableEventHandler } from "./ext/abortable-event-handler";
import {
  FactoryMachineContext,
  FactoryMachineEvent,
  FactoryMachineTransitionEvent,
} from "./factory-machine-types";
import { EffectFunc, Funcware, MiddlewareFunc } from "./function-types";
import { StateMachine, TransitionEvent } from "./state-machine";

export type TransitionHookExtensions<E extends TransitionEvent> = {
  begin: AbortableEventHandler<E>;
  resolveExit: Funcware<(ev: Partial<E>) => E>;
  transition: MiddlewareFunc<E>;
  update: MiddlewareFunc<E>;
  guard: StateMachine<E>["guard"];
  handle: StateMachine<E>["handle"];
  before: AbortableEventHandler<E>;
  effect: EffectFunc<E>;
  leave: EffectFunc<E>;
  enter: EffectFunc<E>;
  notify: EffectFunc<E>;
  after: EffectFunc<E>;
  end: EffectFunc<E>;
};

type StateTransitionHooks<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
> = Partial<{
  leave: MiddlewareFunc<
    FactoryMachineTransitionEvent<FC, StateKey extends "*" ? any : StateKey>
  >;
  enter: MiddlewareFunc<
    FactoryMachineTransitionEvent<
      FC,
      any,
      any,
      StateKey extends "*" ? any : StateKey
    >
  >;
}>;

export type StateHookConfig<FC extends FactoryMachineContext> = {
  [StateKey in string & (keyof FC["states"] | "*")]?: {
    on?: On<FC, StateKey>;
  } & StateTransitionHooks<FC, StateKey>;
};

export type StateEventHookConfig<E extends TransitionEvent<any, any>> =
  | Partial<TransitionHookExtensions<E>>
  | EffectFunc<E>;

type On<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] | "*",
> = {
  [Event in FactoryMachineEvent<FC>["type"] | "*"]?: StateEventHookConfig<
    FactoryMachineTransitionEvent<
      FC,
      FromStateKey extends FactoryMachineEvent<FC>["from"]["key"]
        ? FromStateKey
        : any,
      Event extends FactoryMachineEvent<FC>["type"]
        ? Event
        : FactoryMachineEvent<FC>["type"]
    >
  >;
};

export type HookKey = keyof TransitionHookExtensions<any>;
