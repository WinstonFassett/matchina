import React, { useCallback } from "react";
import { StateMachine, TransitionConfig } from "../machine-types";
import { StatesFactory } from "../states";
import { onUpdate } from "./on-update";

export function useMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  return React.useSyncExternalStore(
    useCallback(
      (listener) =>
        onUpdate(machine, (commit, updater) => {
          commit(updater);
          listener();
        }),
      [machine],
    ),
    machine.getState,
  );
}
