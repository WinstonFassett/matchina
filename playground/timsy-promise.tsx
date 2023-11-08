import React from "react";
import { createPromiseMachine } from "../src";
import { Expand } from "../src/types";
import { withEvents } from "../src/extras/with-events";
// ---cut---
const machine = withEvents(createPromiseMachine((id: number) =>
  fetch("/data").then((response) => response.json()),
));
const state = machine.getState();
type S = Expand<typeof state>

const DataComponent: React.FC = () => {
  const state = machine.getState();
  // useTransitionEffect("RESOLVED", ({ value }) => {
  //   // Pass resolved data into other state stores or react
  //   // to transitions
  // })

  return (
    <div>
      {state.match({
        Idle: () => (
          <button
            onClick={() => {
              machine.event.execute(123)
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
