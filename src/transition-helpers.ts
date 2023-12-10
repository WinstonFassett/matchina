import { StateMachineEvent } from "./state-machine";

const { assign } = Object



export const updateState = <E extends StateMachineEvent>(
  updater: (fromData: E['from']['data']) => any
) => (ev: {
  from: { data: { count: any; meta?: { name: string } } };
}) => ({ 
  ...ev.from.data as any, 
  ...updater(ev.from.data)
});

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
>(createState: StateFunc, getData: DataFunc) {
  return (...params: Parameters<DataFunc>) => {
    return (ev: StateMachineEvent) => {
      return createState(ev.from.data, getData(...params));
    };
  };
}
