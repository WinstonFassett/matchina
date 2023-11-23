import { Middleware, composeMiddleware } from "../../extras/middleware";
import { when } from "../../extras/middleware/when";
import { KeyedChangeEventFilter } from "../../extras/typeguards";

type HookFunc<E> = (ev: E) => void | E;
export function hookware<E>(
  hook: HookFunc<E> | HookFunc<E>[],
  filter: KeyedChangeEventFilter<E> = {},
): Middleware<E> {
  return when(filter)(Array.isArray(hook) ? composeMiddleware(...hook) : hook);
}
