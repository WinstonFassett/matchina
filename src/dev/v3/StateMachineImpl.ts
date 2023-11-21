import { StateFromFactory } from "../v2/machine-types-v2";
import { ChangeCommandEvent, AnyStatesFactory, Resolver, TransitionRecord, ResolveEvent } from "./machine-types-v3";

// const {resolve} = {} as Resolver<T> & Eventware<T> & Usable<T> & Extender<T, T> & Transitioner<T>& Guarder<T>
export class StateMachineImpl<E extends ChangeCommandEvent, SF extends AnyStatesFactory>
  implements Resolver<E>
{
  public transitions: TransitionRecord;
  private lastChange: E;

  constructor(transitions: TransitionRecord, initialState: StateFromFactory<SF>) {
    this.transitions = transitions;
    this.lastChange = {
      type: 'init',
      to: initialState
    } as E;
  }

  getState() {
    return this.lastChange.to;
  }

  send(type: ResolveEvent<E> | E['type'], ...params: E['params']) {
    if (typeof type === 'string') {
      type = { params } as ResolveEvent<E>;
    }
    if (params) {
      type.params = (type.params ?? []).concat(params);
    }
    const resolved = this.resolve(type as ResolveEvent<E>);
    if (resolved) this.transition(resolved);
  }

  resolve(ev: ResolveEvent<E>) {
    const to = this.transitions[ev.from.key][ev.type];
    return { ...ev, to } as E;
  }

  guard(ev: E) {
    return true;
  }

  transition(ev: E) {
    if (!this.guard(ev)) return;
    const handled = this.handle(ev);
    if (handled) this.update(handled);
  }

  protected update(ev: E) {
    this.lastChange = ev;
    this.effect(ev);
  }

  handle(ev: E) {
    return ev;
  }

  effect(ev: E) {
    this.exit(ev);
    this.enter(ev);
    this.notify(ev);
  }

  exit(ev: E) { }
  enter(ev: E) { }
  notify(ev: E) { }

}
class ChangeMachineImpl<T> {
  v: T
  constructor(initial: T) {
    this.v = initial
  }
  getState() {
    return this.v
  }
  change(value: T) {
    this.update(value)
  }
  update(value: T) {
    this.v = value
    this.effect(value)
  }
  effect(value: T) { }
}

