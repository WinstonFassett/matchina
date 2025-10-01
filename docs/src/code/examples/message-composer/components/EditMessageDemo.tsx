import React, { useState } from "react";
import { EditMessageComposer } from "./EditMessageComposer";

export const EditMessageDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lastValue, setLastValue] = useState<string | null>(null);

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        Edit Message
      </button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-sl-black/60  z-50">
          <div className="bg-sl-gray-7 rounded shadow-lg p-6 min-w-[320px] max-w-full">
            <EditMessageComposer
              initialValue="Edit this message via composition"
              onSave={(val) => {
                setLastValue(val);
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}
      {lastValue && (
        <div className="mt-4 text-green-700">Last saved: {lastValue}</div>
      )}
    </div>
  );
};
