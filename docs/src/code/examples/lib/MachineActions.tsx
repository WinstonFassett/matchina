import { getAvailableActions, type StateMachine } from "matchina";
import React from "react";

export function MachineActions<T extends { [key: string]: any }>({
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
            className="btn btn-primary btn-sm"
          >
            {event}
          </button>
        );
      })}
    </div>
  );
}
