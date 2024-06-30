import React from "react";
import { Expand } from "../../src/utility-types";
import { withApi } from "../../src/factory-machine-event-api";
import { createPromiseMachine } from "../../src/promise-machine";
// ---cut---
const machine = withApi(
  createPromiseMachine((id: number) =>
    fetch("/data").then((response) => response.json()),
  ),
);
const state = machine.getState();
type S = Expand<typeof state>;

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
                machine.api.execute(123);
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
