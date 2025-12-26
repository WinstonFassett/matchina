import { abortable, tap } from "./ext";
import { AbortableEventHandler } from "./ext/abortable-event-handler";
import { EffectFunc, Func, Funcware, MiddlewareFunc } from "./function-types";
import { EventLifecycle } from "./event-lifecycle";
import { combineGuards, composeHandlers } from "./state-machine-hooks";
import { funcwareFromMiddleware } from "./ext/funcware/from-middleware";

export type Adapters<E = any> = {
  [key: string]: Func;
} & {
  // Note: "send" exists on StateMachine, not EventLifecycle. Keep it structural for consumers that have it.
  send: (funcware: Funcware<(...args: any[]) => void>) => Funcware<(...args: any[]) => void>;
  transition: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<EventLifecycle<E>["transition"]>;
  update: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<EventLifecycle<E>["update"]>;
  resolveExit: (
    middleware: MiddlewareFunc<E>
  ) => Funcware<(ev: E) => E | undefined>;
  guard: (
    guardFn: EventLifecycle<E>["guard"]
  ) => Funcware<EventLifecycle<E>["guard"]>;
  handle: (
    handleFn: EventLifecycle<E>["handle"]
  ) => Funcware<EventLifecycle<E>["handle"]>;
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
  send: <E>(funcware: Funcware<(...args: any[]) => void>) => funcware,
  transition: funcwareFromMiddleware,
  update: funcwareFromMiddleware,
  resolveExit: funcwareFromMiddleware,
  guard: (guardFn) => (inner) => combineGuards(inner as any, guardFn as any) as any,
  handle: (handleFn) => (inner) => composeHandlers(handleFn as any, inner as any) as any,
  before: (abortware) => abortable(abortware),
  leave: tap,
  after: tap,
  enter: tap,
  effect: tap,
  notify: tap,
} as Adapters;
