import React, { useCallback } from "react";
import { withSubscribe } from "../../extras/with-subscribe";
import { BindableMachine } from "./bindable";

type Selector<TMachine, TState, TResult> = (state: TState, machine: TMachine) => TResult;

/**
 * React hook to subscribe a component to a machine's state changes.
 * Agnostic of change; always deals in state. Selector receives (state, machine).
 *
 * @param machine - Machine with notify and getState
 * @param selector - Optional selector for state, receives (state, machine)
 */
export function useMachine<
  TMachine extends BindableMachine,
  TResult = ReturnType<TMachine["getState"]>
>(
  machine: TMachine,
  selector?: Selector<TMachine, ReturnType<TMachine["getState"]>, TResult>
): TResult {
  const subMachine = withSubscribe(machine);

  const getSnapshot = useCallback(() => {
    const state = subMachine.getState();
    return selector ? selector(state, subMachine) : state;
  }, [subMachine, selector]);

  return React.useSyncExternalStore(
    subMachine.subscribe,
    getSnapshot,
    getSnapshot
  );
}
