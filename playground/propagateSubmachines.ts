import { setup } from "../src/ext/setup";
import { handle } from "../src/state-machine-hooks";

// Minimal duck-typed machine shape
type AnyMachine = { getState(): any; send?: Function; dispatch?: Function };

function looksLikeMachine(x: any): x is AnyMachine {
  return (
    !!x && typeof x.getState === "function" &&
    (typeof (x as any).send === "function" || typeof (x as any).dispatch === "function")
  );
}

function getChildFromParentState(state: any): AnyMachine | undefined {
  const m = state?.data?.machine;
  return looksLikeMachine(m) ? m : undefined;
}

function trySend(m: AnyMachine, type: string, ...params: any[]) {
  if (typeof m.send === "function") return (m.send as any)(type, ...params);
  if (typeof m.dispatch === "function") return (m.dispatch as any)(type, ...params);
}

function snapshot(m: AnyMachine) {
  return m.getState();
}

function statesEqual(a: any, b: any) {
  // Reference equality is sufficient for our immutable-first semantics
  return Object.is(a, b);
}

// Setup function to enable child-first hierarchical routing on a machine.
// Usage: setup(machine)(propagateSubmachines(machine))
export function propagateSubmachines<M extends AnyMachine>(machine: M) {
  return handle((ev: any) => {
    const parentState = machine.getState();
    const child = getChildFromParentState(parentState);
    if (!child) return ev; // no child => let parent handle

    const before = snapshot(child);
    trySend(child, ev.type, ...(ev.params ?? []));
    const after = snapshot(child);

    const handled = !statesEqual(before, after);
    return handled ? undefined : ev; // abort parent if child handled
  });
}
