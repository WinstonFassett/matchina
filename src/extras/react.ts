import React, { useCallback } from "react";
import type { StateMachine, TransitionConfig } from "../machine-types";
import type { StatesFactory } from "../states";
import type { SubscribableMachine } from "./with-subscribe";

export function useMachine<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
>(machine: SubscribableMachine<StateMachine<States, Transitions>>) {
  return [
    React.useSyncExternalStore(
      useCallback(machine.subscribe, [machine]),
      machine.getState,
      () => machine.getState(),
    ),
    machine,
  ] as const;
}
