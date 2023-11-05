import React, { useCallback } from "react";

export function useMachine<T>(machine: {
  subscribe: (listener: (value: T) => void) => () => void;
  getState: () => T;
}) {
  return [
    React.useSyncExternalStore(
      useCallback(machine.subscribe, [machine]),
      machine.getState,
      () => machine.getState(),
    ),
    machine,
  ] as const;
}
