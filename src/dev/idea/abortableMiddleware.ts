import { Middleware } from "../../types";
import { AbortableEventHandler } from "../../ext/types";

export function abortableMiddleware<E>(
  wares: AbortableEventHandler<E>,
): Middleware<E> {
  return (event, next) => {
    let aborted = false;
    wares(event, () => {
      aborted = true;
    });
    if (!aborted) next(event);
  };
}
