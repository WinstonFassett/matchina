export const MATCHINA_STORE = Symbol("matchina.store");

export function brandStoreMachine(target: object) {
  Object.defineProperty(target, MATCHINA_STORE, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

export function isStoreMachine(x: any): boolean {
  return !!x && x[MATCHINA_STORE] === true;
}
