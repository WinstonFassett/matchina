import React, { useCallback } from "react";
import { Effect } from "../function-types";

export function useMachine<Change>(machine: {
  notify: (ev: Change) => void;
  getChange: () => Change;
}): void {
  if (!machine || !machine.getChange) {
    throw new Error("useMachine requires a machine instance");
  }
  const onSubscribe = useCallback(
    (listener: Effect<Change>) => {
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
