import React, { useState } from "react";
import { ForwardComposer } from "./ForwardComposer";

export const ForwardMessageDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lastTarget, setLastTarget] = useState<string | null>(null);

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        Forward Message
      </button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-full">
            <ForwardComposer
              message={{ id: "42", content: "This is the message to forward." }}
              onForward={({ comment, message }) => {
                setLastTarget(comment ? `${comment} (about: ${message.content})` : message.content);
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}
      {lastTarget && (
        <div className="mt-4 text-blue-700">Last forwarded to: {lastTarget}</div>
      )}
    </div>
  );
};
