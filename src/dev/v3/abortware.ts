import { Middleware } from "../../extras/middleware";
import { Func } from "../../types";
import { Funcware } from "./method";

// export type Abortware<F extends (...args: any[]) => any> = (params: Parameters<F>, abort: () => void) => void;
export type AbortableEventware<E> = (event: E, abort: () => void) => void;
export function abortableEventware<E>(
  wares: AbortableEventware<E>
): Funcware<Func<E, any>> {
  console.log('abortableFuncware')
  return (inner) => {
    console.log("abortableFuncware inner", { inner });
    return (ev) => {
      console.log("abortableFuncware inner", { inner, ev });
      let aborted = false;
      wares(ev, () => {
        aborted = true;
      });
      if (!aborted) return inner(ev);
    };
  };
}

export function makeAbortable<
  F extends (...params: any[]) => any
>(fw: Funcware<F>) {
  return (aw: AbortableEventware<Parameters<F>[0]>) => {
    return (inner: F) => {
      return (...params: Parameters<F>) => {
        let aborted = false;
        aw(params[0], () => { aborted = true; });
        if (!aborted) return fw(inner)(...params);
      }
    }
  }
}

export function abortableMiddleware<E>(
  wares: AbortableEventware<E>
): Middleware<E> {
  return (event, next) => {
    let aborted = false;
    wares(event, () => { aborted = true; });
    if (!aborted) next(event);
  };
}
export function composeAbortware<E>(
  wares: AbortableEventware<E>[]
): AbortableEventware<E> {
  return (event, abort) => {
    let aborted = false;
    for (const listener of wares) {
      listener(event, () => { aborted = true; });
      if (aborted) break;
    }
    if (aborted) abort();
  };
}
