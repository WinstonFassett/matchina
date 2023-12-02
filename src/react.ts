import React, { useCallback } from "react";
import { Listen } from "./nanosubscriber";

// prefer a lightweight subscriber for this machine
// just use notify or something
// may be as easy as const unsub = notify(listener)(machine);
// or setupMachine(machine)(notify(listener));

export function useMachine<Change>(machine: {
  subscribe: (listener: Listen<Change>) => () => void;
  getChange: () => Change;
}) {
  const onSubscribe = useCallback(
    (listener: Listen<Change>) => machine.subscribe(listener),
    [machine],
  );
  const onGetChange = useCallback(() => machine.getChange(), [machine]);
  return [
    React.useSyncExternalStore(onSubscribe, onGetChange, onGetChange),
    machine,
  ] as const;
}
