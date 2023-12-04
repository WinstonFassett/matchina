import { Funcware } from "../../ext/types";
import { composeFuncware } from "./composeFuncware";

export function extendFunction<F extends (...params: any[]) => any>(
  inner: F,
  fns: Funcware<F>[],
): F {
  return composeFuncware(fns)(inner) as F;
}

export function functionExtender<F extends (...params: any[]) => any>(
  fns: Funcware<F>[],
): Funcware<F> {
  return (inner) => extendFunction(inner, fns);
}
