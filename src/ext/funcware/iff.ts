import { Funcware } from "./funcware";

export const iff = <F extends (...params: any[]) => any>(
  test: (...params: Parameters<F>) => boolean | void,
  ware: Funcware<F>,
) => {
  return (inner: F) =>
    (...params: Parameters<F>) => {
      if (test(...params)) {
        return ware(inner)(...params);
      }
      return inner(...params);
    };
};
