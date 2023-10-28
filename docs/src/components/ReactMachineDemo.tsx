import React from "react";
import { defineMachine, createPromiseMachine, withSubscribe } from "../../../src";
import { useMachine } from "../../../src/extras/react";

const delayedAdd = createPromiseMachine(
  (x: number, y: number) =>
    new Promise((resolve) => setTimeout(() => resolve(x + y), 1000)),
);

export function ReactMachineDemo({}) {
  const x = useMachine(withSubscribe(delayedAdd))
  return <div>ReactMachineDemo</div>;
}
