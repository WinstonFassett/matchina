import { AbortableEventware } from "../../ext/funcware/abortable";

export function composeAbortware<E>(
  wares: AbortableEventware<E>[],
): AbortableEventware<E> {
  return (event, abort) => {
    let aborted = false;
    for (const listener of wares) {
      listener(event, () => {
        aborted = true;
      });
      if (aborted) break;
    }
    if (aborted) abort();
  };
}
