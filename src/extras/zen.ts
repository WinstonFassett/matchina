export function makeZen<
  M extends {
    getState(): any;
    do: any;
  },
  S,
>(machine: M) {
  return {
    ...machine.do,
    get state() {
      return machine.getState();
    },
    get machine() {
      return machine;
    },
  };
}
