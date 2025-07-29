import {
  getAvailableActions,
  type StateMachine,
  type TransitionRecord,
} from "matchina";
import React from "react";

export function MachineActions<T extends TransitionRecord>({
  transitions,
  state,
  send,
  children,
}: {
  transitions: T;
  state: string & keyof T;
  send: StateMachine<any>["send"];
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
      {getAvailableActions(transitions, state).map((event) => {
        return (
          <button
            key={event}
            onClick={() => {
              send(event);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {event}
          </button>
        );
      })}
    </div>
  );
}
