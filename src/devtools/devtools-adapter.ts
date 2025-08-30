// Adapter that normalizes machines for devtools/reporters.
// Provides a minimal { getState, send } shape so devtools code can treat
// stores (dispatch) and state-machines (send) uniformly.

export function adaptForDevtools(machine: any) {
  const hasSend = !!(machine && typeof machine.send === "function");
  const hasDispatch = !!(machine && typeof machine.dispatch === "function");

  return {
    getState(): any {
      return typeof machine?.getState === "function" ? machine.getState() : undefined;
    },
    send(type: string, ...params: any[]) {
      if (hasSend) return machine.send(type, ...params);
      if (hasDispatch) return machine.dispatch(type, ...params);
      throw new Error("Machine does not implement send or dispatch");
    },
  } as { getState(): any; send(type: string, ...params: any[]): any };
}
