import React, { useCallback } from "react";
import { EffectFunc } from "../function-types";

/**
 * React hook to subscribe a component to a machine's state changes.
 *
 * This hook uses React's useSyncExternalStore to efficiently subscribe to changes
 * from a state machine and trigger re-renders when the machine's state changes.
 *
 * @template Change - The type of change/event emitted by the machine.
 * @param machine - An object with `notify` and `getChange` methods for state updates.
 * @throws Error if the machine instance is invalid or missing required methods.
 */
export function useMachine<Change>(machine: {
  notify: (ev: Change) => void;
  getChange: () => Change;
}): void {
  if (!machine || !machine.getChange) {
    throw new Error("useMachine requires a machine instance");
  }
  const onSubscribe = useCallback(
    (listener: EffectFunc<Change>) => {
      const orig = machine.notify;
      const bound = orig.bind(machine);
      machine.notify = (ev) => {
        bound(ev);
        listener(ev);
      };
      return () => {
        machine.notify = orig;
      };
    },
    [machine]
  );
  const onGetChange = useCallback(() => machine.getChange(), [machine]);
  React.useSyncExternalStore(onSubscribe, onGetChange, onGetChange);
}
