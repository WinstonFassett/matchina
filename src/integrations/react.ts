import React, { useCallback } from "react";
import { EffectFunc } from "../function-types";
// Global no-op subscribe used when a machine is absent.
// Signature matches useSyncExternalStore's expected subscribe shape.
const noopSubscribe: (onStoreChange: () => void) => () => void = () => () => {};

// Weak map to track listener lists for machines
// Allows multiple components to subscribe to the same machine without interfering
const machineListeners = new WeakMap<
  any,
  {
    listeners: Set<EffectFunc<any>>;
    original: (ev: any) => void;
  }
>();

/**
 * React hook to subscribe a component to a machine's state changes.
 *
 * This hook uses React's useSyncExternalStore to efficiently subscribe to changes
 * from a state machine and trigger re-renders when the machine's state changes.
 *
 * Handles multiple simultaneous subscriptions by maintaining a listener set
 * rather than wrapping the notify method multiple times.
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

      // Get or create the listener set for this machine
      let machineData = machineListeners.get(machine);
      if (!machineData) {
        const original = machine.notify;
        const listeners = new Set<EffectFunc<any>>();

        // Replace notify with one that calls all listeners
        machine.notify = (ev) => {
          original(ev);
          listeners.forEach((l) => l(ev));
        };

        machineData = { original, listeners };
        machineListeners.set(machine, machineData);
      }

      // Add this component's listener to the set
      machineData.listeners.add(listener);

      // Return cleanup function that removes this listener
      return () => {
        machineData.listeners.delete(listener);
        // If no more listeners, restore original notify
        if (machineData.listeners.size === 0) {
          machine.notify = machineData.original;
          machineListeners.delete(machine);
        }
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

