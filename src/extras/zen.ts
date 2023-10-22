export function makeZen<
  M extends {
    getState(): any;
    do: any;
  },
>(machine: M) {
  return {
    ...machine.event,
    get state() {
      return machine.getState();
    },
    get machine() {
      return machine;
    },
  };
}
