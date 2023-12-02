import { Middleware } from "../../v1/middleware";
import { Func } from "../../types";
import { Funcware } from "../../../ext/Funcware";

function funcwareFromMiddleware<E>(
  middleware: Middleware<E>,
): Funcware<Func<[E], any>> {
  return (inner) => (ev) => {
    let result = VOID as E;
    middleware(ev, (ev) => {
      result = inner(ev);
    });
    if (result !== VOID) return result;
  };
}
function middlewareFromFuncware<E, P extends any[], R>(
  fw: Funcware<Func<[...P], R>>,
): Middleware<[params: P, result: R]> {
  return ([params, _], next) => {
    return fw(([...args]) => {
      const invocation = [args, undefined as R] as [P, R];
      next([args, invocation[1]]);
      return invocation[1];
    })([...params]);
  };
}
type FuncMiddleware<F extends (...args: any) => any> = Middleware<
  [params: Parameters<F>, result: ReturnType<F>]
>;
const VOID = {};
