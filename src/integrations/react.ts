import React, { useCallback } from "react";
import { EffectFunc } from "../function-types";
// Global no-op subscribe used when a machine is absent.
// Signature matches useSyncExternalStore's expected subscribe shape.
const noopSubscribe: (onStoreChange: () => void) => () => void = () => () => {};

/**
 * React hook to subscribe a component to a machine's state changes.
 *
 * This hook uses React's useSyncExternalStore to efficiently subscribe to changes
 * from a state machine and trigger re-renders when the machine's state changes.
 *
 * @template Change - The type of change/event emitted by the machine.
 * @param machine - Optional machine with `notify` and `getChange` methods.
 *
 * Notes:
 * - If `machine` is undefined, this hook subscribes to nothing and returns undefined.
 * - When `machine` becomes defined later, the hook begins subscribing and returns the current change snapshot.
 */
export function useMachineMaybe<Change>(
  machine:
    | {
        notify: (ev: Change) => void;
        getChange: () => Change;
      }
    | undefined
): Change | undefined {
  const onSubscribe = useCallback(
    (listener: EffectFunc<Change>) => {
      if (!machine) return () => {};
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

  const getSnapshot = useCallback<() => Change | undefined>(
    () => (machine ? machine.getChange() : undefined),
    [machine]
  );

  return React.useSyncExternalStore(
    machine ? onSubscribe : noopSubscribe,
    getSnapshot,
    getSnapshot
  );
}

/** Strict variant that requires a machine and never returns undefined. */
export function useMachine<Change>(
  machine: { notify: (ev: Change) => void; getChange: () => Change }
): Change {
  if (!machine || !machine.getChange) {
    throw new Error("useMachine requires a machine instance");
  }
  return useMachineMaybe(machine) as Change;
}

