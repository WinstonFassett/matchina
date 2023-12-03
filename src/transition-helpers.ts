import { ChangeCommandEvent } from "./types";

export function updateState<E extends ChangeCommandEvent>(
  fn: (state: E["from"]["data"]) => Partial<E["to"]["data"]>,
) {
  return (previous: E) => {
    return { ...previous.from, data: fn(previous) };
  };
}
export function setInState<E extends ChangeCommandEvent>(
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
    return (ev: ChangeCommandEvent) => {
      return stateFunc(ev.from.data, getData(...params));
    };
  };
}
