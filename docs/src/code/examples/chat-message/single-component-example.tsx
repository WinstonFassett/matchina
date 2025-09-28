import React, { useState, useMemo, useRef, use } from "react";
import { createForwardMachine, ForwardMachine } from "./machine";
import { storeApi as createStoreApi } from "matchina";
import { useMachine } from "matchina/react";

// ---------------------- Hook ----------------------
type ForwardMeta = {
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

function useForwardMachine(meta: ForwardMeta = {}) {
  const [machine] = useState<ForwardMachine>(() => {
    const m = createForwardMachine();
    return Object.assign(m, { actions: createStoreApi(m) });
  });

  const actions = useMemo(() => machine.actions, [machine]);
  const state = useMachine(machine);
  const metaWithMachine = use
  return [state, actions, metaWithMachine] as const;
}

// ---------------------- Component ----------------------
export const ForwardMessageDialog: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, actions, meta] = useForwardMachine({ inputRef });

  return (
    <div className="p-4 border rounded space-y-2">
      <h3>Forward this private message</h3>
      <input
        ref={meta?.inputRef ?? inputRef}
        value={state.input}
        onChange={(e) => actions.updateInput(e.target.value)}
        placeholder="Add a message..."
        className="border p-2 w-full"
      />
      <button
        onClick={() => actions.clear()}
        className="px-4 py-2 bg-gray-200 rounded"
      >
        Clear
      </button>
      <div className="text-sm text-gray-600">
        Attachments: {state.attachments.join(", ") || "none"}
      </div>
    </div>
  );
};
