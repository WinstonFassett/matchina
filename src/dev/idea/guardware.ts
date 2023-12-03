export function guardware<E>(fn: (ev: E) => boolean) {
  return (inner: (ev: E) => any) => (ev: E) => {
    if (fn(ev)) return inner(ev);
  };
}
type Guardware<F extends (...args: any) => any> = (
  test: (...params: Parameters<F>) => boolean,
) => (inner: F) => F;
