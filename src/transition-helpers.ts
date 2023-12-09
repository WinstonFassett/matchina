import { StateMachineEvent } from "./state-machine";

export function updateState<E extends StateMachineEvent>(
  fn: (state: E["from"]["data"]) => Partial<E["to"]["data"]>,
) {
  return (previous: E) => {
    return { ...previous.from, data: fn(previous) };
  };
}
export function setInState<E extends StateMachineEvent>(
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
    return (ev: StateMachineEvent) => {
      return stateFunc(ev.from.data, getData(...params));
    };
  };
}
