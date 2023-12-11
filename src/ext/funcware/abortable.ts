import { Func } from "../../utility-types";
import { AbortableEventHandler, Funcware } from "../types";

export const abortable = <E>(abortable: AbortableEventHandler<E>): Funcware<Func<E, any>> => (inner) => (ev) => {
  let aborted = false;
  abortable(ev, () => {
    aborted = true;
  });
  if (!aborted) {
    return inner(ev);
  }
};
