import React from "react";
import { getAvailableActions, TransitionRecord, type StateMachine } from "../src";

export function MachineActions<T extends TransitionRecord>({ transitions, state, send, children }: { transitions: T, state: string & keyof T; send: StateMachine<any>['send']; children: React.ReactNode; }) {
  return <div className="flex items-center">
    {children}
    {getAvailableActions(transitions, state).map(event => {
      return <button key={event} onClick={() => { send(event) }}>
        {event}
      </button>;
    })}
  </div>;
}
