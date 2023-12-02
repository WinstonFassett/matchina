import { Func } from "../utility-types";
import { Funcware } from "./Funcware";

// export type Abortware<F extends (...args: any[]) => any> = (params: Parameters<F>, abort: () => void) => void;

export function abortableEventware<E>(
  wares: AbortableEventware<E>
): Funcware<Func<E, any>> {
  // console.log('abortableFuncware')
  return (inner) => {
    // console.log("abortableFuncware inner", { inner });
    return (ev) => {
      // console.log("abortableFuncware inner", { inner, ev });
      let aborted = false;
      wares(ev, () => {
        aborted = true;
      });
      if (!aborted) return inner(ev);
    };
  };
}


export type AbortableEventware<E> = (event: E, abort: () => void) => void;
