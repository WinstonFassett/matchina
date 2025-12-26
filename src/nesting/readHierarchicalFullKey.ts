import type { FactoryMachine } from "../factory-machine";

// Returns the deepest active hierarchical path as a dot-joined key string.
// Non-invasive: only reads state via getState() and walks through nested .data.machine if present.
export function readHierarchicalFullKey(root: { getState: () => any } | any): string {
  try {
    // Allow passing either a machine or a state
    let currentState: any = typeof root?.getState === "function" ? root.getState() : root;

    const segments: string[] = [];
    // Guard against cycles by setting a max depth
    const MAX_DEPTH = 100;
    let depth = 0;

    while (currentState && depth < MAX_DEPTH) {
      if (typeof currentState.key === "string") {
        segments.push(currentState.key);
      } else {
        break;
      }
      const maybeMachine = currentState?.data?.machine as FactoryMachine<any> | undefined;
      if (!maybeMachine || typeof maybeMachine.getState !== "function") break;
      currentState = maybeMachine.getState();
      depth += 1;
    }

    return segments.join(".");
  } catch {
    return "";
  }
}
