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

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(event: E) => {};

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
export function createStateMachine<E extends StateMachineEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
) {
  let lastChange = {
    type: "__initialize",
    to: initialState,
  } as E;
  const machine: StateMachine<E> & TransitionContext = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) {
        return { ...ev, to } as E; // TODO: use Object.assign
      }
    },
    guard: (ev: E) => true,
    transition(change: E) {
      if (!machine.guard(change)) {
        return;
      }
      let update = machine.handle(change); // process change
      if (!update) {
        return;
      }
      update = machine.before(update); // prepare update
      if (!update) {
        return;
      }
      machine.update(update); // apply update
      machine.effect(update); // internal effects
      machine.notify(update); // notify consumers
      machine.after(update); // cleanup
    },
    handle: EmptyTransform<E>,
    before: EmptyTransform<E>,
    update: (update: E) => {
      lastChange = update;
    },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave: EmptyEffect<E>,
    enter: EmptyEffect<E>,
    notify: EmptyEffect<E>,
    after: EmptyEffect<E>,
  };
  return machine;
}
export type TransitionRecord = {
  [from: string]: {
    [type: string]: string | object
  } 
};
export interface TransitionContext {
  transitions: TransitionRecord;
}

export function getAvailableActions(transitions: TransitionRecord, state: string) {
  const entry = transitions[state]
  return entry ? Object.keys(entry) : []
}

// export function getAutoTransition(entry: FactoryMachineTransition<any, any, any>) {
//   return transitions[state]['']
// }