import { AbortableEventHandler, Funcware } from "./ext";
import {
  FactoryMachineEventUnion,
  FactoryMachineEvent,
  FactoryMachineContext
} from "./factory-machine";
import { StateMachine, StateMachineEvent } from "./state-machine";
import { Effect, Middleware } from "./types";

type TransitionHookExtensions<E extends StateMachineEvent> = {
  begin: AbortableEventHandler<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: AbortableEventHandler<E>;
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
  leave: Middleware<FactoryMachineEvent<FC, StateKey extends '*' ? any : StateKey>>;
  enter: Middleware<FactoryMachineEvent<FC, any, any, StateKey extends '*' ? any : StateKey>>;
}>;

export type StateHookConfig<FC extends FactoryMachineContext> = {
  [StateKey in string & (keyof FC["transitions"] | "*")]?: {
    on?: On<FC, StateKey>;
  } & StateTransitionHooks<FC, StateKey>;
};

export type StateEventHookConfig<E extends StateMachineEvent<any, any>> =
  Partial<TransitionHookExtensions<E>>;

type On<
  FC extends FactoryMachineContext,
  FromStateKey extends keyof FC["transitions"] | "*",
> = {
  [Event in FactoryMachineEventUnion<FC>["type"] | "*"]?: StateEventHookConfig<
    FactoryMachineEvent<
      FC,
      FromStateKey extends FactoryMachineEventUnion<FC>["from"]["key"] ? FromStateKey : any,
      Event extends FactoryMachineEventUnion<FC>["type"] ? Event : FactoryMachineEventUnion<FC>["type"]
    >
  >;
};

