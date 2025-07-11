import { createPromiseMachine, withApi } from "matchina";
import React from "react";
// ---cut---
const machine = withApi(
  createPromiseMachine((id: number) =>
    fetch("/data").then((response) => response.json()),
  ),
);
const state = machine.getState();

const DataComponent: React.FC = () => {
  const state = machine.getState();
  // useTransitionEffect("RESOLVED", ({ value }) => {
  //   // Pass resolved data into other state stores or react
  //   // to transitions
  // })

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
