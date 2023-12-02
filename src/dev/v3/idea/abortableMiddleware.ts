import { Middleware } from "../../v1/middleware";
import { AbortableEventware } from "../../../ext/abortableEventware";


export function abortableMiddleware<E>(
  wares: AbortableEventware<E>
): Middleware<E> {
  return (event, next) => {
    let aborted = false;
    wares(event, () => { aborted = true; });
    if (!aborted) next(event);
  };
}
