import { AbortableEventHandler } from "./ext/abortable-event-handler";
import { Funcware } from "./function-types";
import {
  FactoryMachineContext,
  FactoryMachineEvent,
  FactoryMachineTransitionEvent
} from "./factory-machine-types";
import { StateMachine, StateMachineEvent } from "./state-machine-types";
import { Effect, Middleware } from "./function-types";

type TransitionHookExtensions<E extends StateMachineEvent> = {
  begin: AbortableEventHandler<E>;
  resolveExit: Funcware<(ev: Partial<E>) => E>;
  transition: Middleware<E>;
  guard: StateMachine<E>["guard"];
  handle: StateMachine<E>["handle"];
  before: AbortableEventHandler<E>;
  effect: Effect<E>;
  leave: Effect<E>;
  enter: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
  end: Effect<E>;
};

type StateTransitionHooks<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC["transitions"] | "*",
> = Partial<{
  leave: Middleware<
    FactoryMachineTransitionEvent<FC, StateKey extends "*" ? any : StateKey>
  >;
  enter: Middleware<
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

export type StateEventHookConfig<E extends StateMachineEvent<any, any>> =
  Partial<TransitionHookExtensions<E>>;

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
