export interface State {
  key: string;
}

export interface StateMachineEvent<
  To extends State = State,
  From extends State = To,
> {
  type: string;
  params: any[];
  to: To;
  from: From;
  get machine(): StateMachine<StateMachineEvent<To, From>>;
}

export type ResolveEvent<C> = Omit<C, "to">;

export const EmptyTransform = <E>(event: E) => event;
export const EmptyEffect = <E>(event: E) => {};

export interface StateMachine<E extends StateMachineEvent = StateMachineEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: (type: E["type"], ...params: E["params"]) => void;
  resolve(ev: ResolveEvent<E>): E | undefined;
  transition(change: E): void;
  guard(ev: E): boolean;
  handle(ev: E): E | undefined;
  before(ev: E): E | undefined;
  update(ev: E): void;
  effect(ev: E): void;
  leave(ev: E): void;
  enter(ev: E): void;
  notify(ev: E): void;
  after(ev: E): void;
}
export type TransitionRecord = {
  [from: string]: {
    [type: string]: string | object;
  };
};
export interface TransitionContext {
  transitions: TransitionRecord;
}

export function getAvailableActions(
  transitions: TransitionRecord,
  state: string,
) {
  const entry = transitions[state];
  return entry ? Object.keys(entry) : [];
}

// export function getAutoTransition(entry: FactoryMachineTransition<any, any, any>) {
//   return transitions[state]['']
// }
