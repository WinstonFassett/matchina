/**
 * Child.exit behavior for flattened machines
 *
 * Provides send-hook-based instrumentation to automatically trigger child.exit
 * when flattened machines reach final child states, matching nested machine behavior.
 */

import { send } from "../../state-machine-hooks";
import { setup } from "../../ext/setup";
import { isChildFinal } from "./flat-state-utils";

export interface FlattenedChildExitOptions {
  delimiter?: string;
}

export function withFlattenedChildExit(
  machine: any,
  options: FlattenedChildExitOptions = {}
) {
  const { delimiter = "." } = options;

  // Use proper hook setup with send hook to avoid interfering with machine state
  setup(machine)(
    send((originalSend: any) => {
      return (type: any, ...args: any[]) => {
        // Execute the original send first
        const result = originalSend(type, ...args);

        // Check if we just transitioned to a final child state
        const currentState = machine.getState();
        if (
          currentState &&
          currentState.key &&
          currentState.key.includes(delimiter)
        ) {
          const isFinal = isChildFinal(machine, currentState);

          if (isFinal && type !== "child.exit") {
            // Trigger child.exit after call stack clears (using Promise for isomorphic microtask)
            Promise.resolve().then(() => {
              machine.send("child.exit");
            });
          }
        }

        return result;
      };
    })
  );

  return machine;
}


