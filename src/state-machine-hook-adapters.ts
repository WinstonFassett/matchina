import { abortable, tap } from "./ext";
import { Adapters } from "./state-machine-hook-adapter-types";
import { middlewareToFuncware, combineGuards, composeHandlers } from "./state-machine-hooks";


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
