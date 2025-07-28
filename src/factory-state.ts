export interface State {
  key: string;
}
export type StateFactory = Record<string, (...args: any[]) => State>;

export type FactoryState<
  States extends StateFactory,
  StateKey extends keyof States = keyof States
> = ReturnType<States[StateKey]>;
