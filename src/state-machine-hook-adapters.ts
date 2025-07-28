import { abortable, tap } from "./ext";
import { AbortableEventHandler } from "./ext/abortable-event-handler";
import { Effect, Func, Funcware, Middleware } from "./function-types";
import { StateMachine, TransitionEvent } from "./state-machine";
import {
  combineGuards,
  composeHandlers,
  middlewareToFuncware,
} from "./state-machine-hooks";

export type Adapters<E extends TransitionEvent = TransitionEvent> = {
  [key: string]: Func;
} & {
  transition: (
    middleware: Middleware<E>
  ) => Funcware<StateMachine<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<StateMachine<E>["update"]>;
  resolveExit: <F extends StateMachine<E>["resolveExit"]>(
    resolveFn: F
  ) => Funcware<F>;
  guard: (
    guardFn: StateMachine<E>["guard"]
  ) => Funcware<StateMachine<E>["guard"]>;
  handle: (
    handleFn: StateMachine<E>["handle"]
  ) => Funcware<StateMachine<E>["handle"]>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;

export const HookAdapters = {
  transition: middlewareToFuncware,
  update: middlewareToFuncware,
  resolveExit: (resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortable(abortware),
  leave: tap,
  after: tap,
  enter: tap,
  effect: tap,
  notify: tap,
} as Adapters;
