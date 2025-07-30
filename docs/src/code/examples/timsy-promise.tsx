import { useMachine } from "matchina/react";
import { createPromiseMachine, addEventApi } from "matchina";
import React from "react";
// ---cut---
const machine = addEventApi(
  createPromiseMachine((_id: number) =>
    fetch("/data").then((response) => response.json())
  )
);

export const DataComponent: React.FC = () => {
  useMachine(machine);
  const state = machine.getState();
  return (
    <div>
      {state.match({
        Idle: () =>
          (
            <button
              onClick={() => {
                machine.execute(123);
              }}
            >
              Load Data
            </button>
          ) as any,
        Pending: () => "Loading...",
        Resolved: (value) => JSON.stringify(value),
        Rejected: (error) => `ops, ${error.message}`,
      })}
    </div>
  );
};
