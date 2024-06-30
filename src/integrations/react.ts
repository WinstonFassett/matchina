import React, { useCallback } from "react";

export type Listen<T> = (value: T) => void;

export function useMachine<Change>(machine: {
  notify: (ev: Change) => void;
  getChange: () => Change;
}) {
  const onSubscribe = useCallback(
    (listener: Listen<Change>) => {
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
    [machine],
  );
  const onGetChange = useCallback(() => machine.getChange(), [machine]);
  return [
    React.useSyncExternalStore(onSubscribe, onGetChange, onGetChange),
    machine,
  ] as const;
}
