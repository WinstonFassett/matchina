/**
 * React integration for Matchina machines and stores.
 *
 * Provides a reusable pattern to create:
 *   - Context
 *   - Provider
 *   - Hook to consume machine/store
 *
 * Supports both:
 *   - PureStateMachine: { getState, send, notify }
 *   - Full StoreMachine: { getState, dispatch, notify }
 *
 * Hooks subscribe to machine state changes via `useMachine`.
 *
 * This module is intended to be used under `matchina/src/integrations/react/`
 */

import React, { createContext, useContext, useMemo, useState } from "react";
import { BindableMachine } from "./bindable";
import { useMachine } from "./use-machine";

/**
 * Generic factory to create a React module for a machine/store.
 * Returns Context, Provider, and useMachineContext.
 */
export function createMachineContext<TMachine extends BindableMachine, TMeta = unknown>(
  createMachine: () => TMachine,
  defaultMeta = undefined as TMeta
) {
  type ProviderProps = React.PropsWithChildren<{
    machine?: TMachine;
    meta?: TMeta;
  }>;

  const Context = createContext<
    { machine: TMachine; meta: TMeta } | undefined
  >(undefined);

  const Provider: React.FC<ProviderProps> = ({ children, machine: machineProp, meta: metaProp }) => {
    const [machine] = useState(() => machineProp ?? createMachine());
    const meta = metaProp ?? defaultMeta;
    const value = useMemo(() => ({ machine, meta }), [machine, meta]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  /**
   * Hook to consume the machine/store.
   * Returns: [state slice, meta]
   */
  function useMachineContext(selectState?: (state: ReturnType<TMachine["getState"]>) => any): [any, { machine: TMachine; meta: TMeta }] {
    const context = useContext(Context);
    if (!context) throw new Error("useHook must be used within its Provider");
    const state = useMachine(context.machine, selectState);
    return [state, context];
  }

  return { Context, Provider, useMachineContext } as const;
}
