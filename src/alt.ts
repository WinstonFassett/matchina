import { abortableEventware, functionTap } from "./ext";
import { AbortableEventHandler, Funcware } from './ext/types';
import { Resolver } from "./transition-machine";
import { ChangeCommandEvent, Effect, Guard, Handle, Middleware, Transitioner, Updater } from "./types";
import { Func } from "./utility-types";

export const HookAdapters = {
  transition: (middleware) => (next) => (ev) => { middleware(ev, next); },
  update: (middleware) => (next) => (ev) => { middleware(ev, next); },
  resolve: (resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortableEventware(abortware),
  leave: functionTap,
  after: functionTap,
  enter: functionTap,
  effect: functionTap,
  notify: functionTap,
} as Adapters;

export function composeHandlers<E extends ChangeCommandEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

export function combineGuards<E extends ChangeCommandEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    console.log("combined guards", res);
    return res;
  };
}

type Transform<I, O = I> = (source: I) => O;

export type Adapters<E extends ChangeCommandEvent = ChangeCommandEvent> = 
{
  [key: string]: Func
} &
{
  transition: (middleware: Middleware<E>) => Funcware<Transitioner<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<Updater<E>["update"]>;
  resolve: <F extends Resolver<E>["resolve"]>(resolveFn: F) => Funcware<F>;
  guard: (guardFn: Guard<E>) => Funcware<Guard<E>>;
  handle: (handleFn: Handle<E>) => Funcware<Handle<E>>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};