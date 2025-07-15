import { type StateMatchbox, type Disposer, disposers } from "@lib/src";
import { useEffect } from "react";
import type { Effect } from "./types";


export function useStateEffects<S extends StateMatchbox<string, any>>(
  state: S,
  getEffects = (state: StateMatchbox<string, any>): Effect<S>[] | undefined => (state.data as any).effects
) {
  useEffect(() => {
    const effects = getEffects(state);
    if (!effects) return;
    const unsubs = [] as Disposer[];
    for (const fn of effects) {
      const unsub = fn(state);
      if (unsub) {
        unsubs.push(unsub);
      }
    }
    return disposers(unsubs);
  }, [state]);
}
function useEffectMap<Deps extends unknown[]>(
  key: string,
  effects: Record<string, (...deps: Deps) => void>,
  deps = [] as unknown as Deps
) {
  useEffect(() => effects[key]?.apply(effects, deps), deps.concat(key));
}

export function useEventTypeEffect<E extends { type: string; }>(
  event: E,
  effects: Record<string, (event: E) => void>
) {
  useEffectMap(event.type, effects, [event]);
}
