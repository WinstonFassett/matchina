import { Funcware } from "../../function-types";

export const iff =
  <F extends (...params: any[]) => any>(
    test: (...params: Parameters<F>) => boolean | void,
    ware: Funcware<F>,
  ) =>
  (inner: F) =>
  (...params: Parameters<F>) =>
    test(...params) ? ware(inner)(...params) : inner(...params);
