import { Middleware } from "../../extras/middleware";
import { Func } from "../../types";
import { Funcware } from "./method";

export type Abortware<E> = (event: E, abort: () => void) => void;
function abortableFuncware<E>(
  wares: Abortware<E>
): Funcware<Func<E, any>> {
  return (inner) => (ev) => {
    let aborted = false;
    wares(ev, () => { aborted = true; });
    if (!aborted) return inner(ev);
  };
}
function abortableMiddleware<E>(
  wares: Abortware<E>
): Middleware<E> {
  return (event, next) => {
    let aborted = false;
    wares(event, () => { aborted = true; });
    if (!aborted) next(event);
  };
}
function composeAbortware<E>(
  wares: Abortware<E>[]
): Abortware<E> {
  return (event, abort) => {
    let aborted = false;
    for (const listener of wares) {
      listener(event, () => { aborted = true; });
      if (aborted) break;
    }
    if (aborted) abort();
  };
}
