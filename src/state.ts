export interface State {
  key: string;
}
export type StateFactory = Record<string, (...args: any[]) => State>;
