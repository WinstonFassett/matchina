import { AbortableEventHandler, Funcware } from "../../ext/types";

export function makeAbortable<F extends (...params: any[]) => any>(
  fw: Funcware<F>,
) {
  return (aw: AbortableEventHandler<Parameters<F>[0]>) => {
    return (inner: F) => {
      return (...params: Parameters<F>) => {
        let aborted = false;
        aw(params[0], () => {
          aborted = true;
        });
        if (!aborted) return fw(inner)(...params);
      };
    };
  };
}
