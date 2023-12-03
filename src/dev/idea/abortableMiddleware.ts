import { Middleware } from "../../types";
import { AbortableEventware } from "../../ext/funcware/abortable";

export function abortableMiddleware<E>(
  wares: AbortableEventware<E>,
): Middleware<E> {
  return (event, next) => {
    let aborted = false;
    wares(event, () => {
      aborted = true;
    });
    if (!aborted) next(event);
  };
}
