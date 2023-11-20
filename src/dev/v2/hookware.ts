import { Middleware, composeMiddleware } from "../../extras/middleware";
import { when } from "../../extras/middleware/when";
import { KeyedChangeEventFilter } from '../../extras/typeguards';

type HookFunc<E> = (ev: E) => void | E;
export function hookware<E>(
  hook: HookFunc<E> | HookFunc<E>[],
  filter: KeyedChangeEventFilter<E> = {}
): Middleware<E> {
  const runHook = Array.isArray(hook) ? composeMiddleware(...hook) : hook;

  // console.log('composing', hook.length)
  if (hook.length === 6) {
    throw new Error("wtf!!");
  }
  console.log({ filter });
  return when(filter)(runHook);
}
