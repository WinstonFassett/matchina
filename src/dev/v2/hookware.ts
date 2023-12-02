import { Middleware, composeMiddleware, when } from "../v1";
import { KeyedChangeEventFilter } from "../v1/extras/typeguards";

type HookFunc<E> = (ev: E) => void | E;
export function hookware<E>(
  hook: HookFunc<E> | HookFunc<E>[],
  filter: KeyedChangeEventFilter<E> = {},
): Middleware<E> {
  return when(filter)(Array.isArray(hook) ? composeMiddleware(...hook) : hook);
}
