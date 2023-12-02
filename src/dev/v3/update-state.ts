import { MachineContextEvent } from "../v2/machine-types-v2";

export function updateState<E extends MachineContextEvent<any>>(
  fn: (state: E["from"]["data"]) => Partial<E["to"]["data"]>,
) {
  return (previous: E) => {
    return { ...previous.from, data: fn(previous) };
  };
}
export function setInState<E extends MachineContextEvent<any>>(
  state: Partial<E["to"]["data"]>,
) {
  return (ev: E) => {
    return { ...ev.from.data, ...state };
  };
}
export function forwardData<
  StateFunc extends (current: any, updates: any) => any,
  DataFunc extends (...args: any[]) => Parameters<StateFunc>[1],
>(stateFunc: StateFunc, getData: DataFunc) {
  return (...params: Parameters<DataFunc>) => {
    return (ev: MachineContextEvent<any>) => {
      return stateFunc(ev.from.data, getData(...params));
    };
  };
}
