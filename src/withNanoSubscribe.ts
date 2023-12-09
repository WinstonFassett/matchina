import { nanosubscriber } from "./extras/nanosubscriber";
import { onNotify } from "./machine-hooks";
import { StateMachinery } from "./state-machine";

export function withNanoSubscribe<T extends StateMachinery<any>>(target: T & Partial<{ subscribe: any; }>) {
  if (target.subscribe) {
    return target as T & { subscribe: typeof subscribe; };
  }
  const [subscribe, emit, listeners] = nanosubscriber<Parameters<T['notify']>[0]>();
  onNotify(target, emit as any);
  return Object.assign(target, {
    subscribe,
    emit,
    listeners,
  }); //as T & { subscribe: typeof subscribe };
}
