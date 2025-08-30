import { abortable, tap } from "./ext";
import { AbortableEventHandler } from "./ext/abortable-event-handler";
import { EffectFunc, Func, Funcware, MiddlewareFunc } from "./function-types";
import { StateMachine, TransitionEvent } from "./state-machine";
import { combineGuards, composeHandlers } from "./state-machine-hooks";
import { funcwareFromMiddleware } from "./ext/funcware/from-middleware";

export type Adapters<E extends TransitionEvent = TransitionEvent> = {
  [key: string]: Func;
} & {
  send: (funcware: Funcware<StateMachine<E>["send"]>) => Funcware<StateMachine<E>["send"]>;
  transition: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<StateMachine<E>["transition"]>;
  update: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<StateMachine<E>["update"]>;
  resolveExit: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<StateMachine<E>["resolveExit"]>;
  guard: (
    guardFn: StateMachine<E>["guard"]
  ) => Funcware<StateMachine<E>["guard"]>;
  handle: (
    handleFn: StateMachine<E>["handle"]
  ) => Funcware<StateMachine<E>["handle"]>;
  // before receives an AbortableEventHandler and returns a funcware that wraps an event handler
  before: (abortware: AbortableEventHandler<E>) => Funcware<Func<[E], any>>;
  // lifecycle hooks operate on EffectFunc<E> and their funcware wraps EffectFunc<E>
  leave: (fn: EffectFunc<E>) => Funcware<EffectFunc<E>>;
  after: (fn: EffectFunc<E>) => Funcware<EffectFunc<E>>;
  enter: (fn: EffectFunc<E>) => Funcware<EffectFunc<E>>;
  effect: (fn: EffectFunc<E>) => Funcware<EffectFunc<E>>;
  notify: (fn: EffectFunc<E>) => Funcware<EffectFunc<E>>;
};

export const HookAdapters = {
  send: <E extends TransitionEvent>(funcware: Funcware<StateMachine<E>["send"]>) => funcware,
  transition: funcwareFromMiddleware,
  update: funcwareFromMiddleware,
  resolveExit: funcwareFromMiddleware,
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortable(abortware),
  leave: tap,
  after: tap,
  enter: tap,
  effect: tap,
  notify: tap,
} as Adapters;
