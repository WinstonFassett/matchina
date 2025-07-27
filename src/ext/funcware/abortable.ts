import { Func } from "../../function-types";
import { AbortableEventHandler } from "../abortable-event-handler";
import { Funcware } from "../../function-types";

export const abortable =
  <E>(abortable: AbortableEventHandler<E>): Funcware<Func<E, any>> =>
  (inner) =>
  (ev) => {
    let aborted = false;
    abortable(ev, () => {
      aborted = true;
    });
    if (!aborted) {
      return inner(ev);
    }
  };
