import { Func } from "../../utility-types";
import { AbortableEventHandler } from "../types";
import { Funcware } from "../types";

export function abortableEventware<E>(
  abortable: AbortableEventHandler<E>,
): Funcware<Func<E, any>> {
  return (inner) => {
    return (ev) => {
      let aborted = false;
      abortable(ev, () => {
        aborted = true;
      });
      if (!aborted) {
        return inner(ev);
      }
    };
  };
}
