// @noErrors

import { createPromiseMachine } from "../../src";
import { delay } from "../../src/extras/delay";
import { withApi } from "../../src/factory-machine-event-api";
import { matchChange } from "../../src/match-change";

// ---cut---
async function promiseUsage() {
  const machine = withApi(
    createPromiseMachine(async (x: number) => {
      console.log("sleeping for", x);
      await delay(x);
      return `slept for ${x}ms`;
    }),
  );

  const it = machine.getState().match({
    Rejected: () => ({ kablamo: false }),
    _: () => ({ kablamo: true }),
  });
  console.log(it);

  const checkState = () =>
    console.log(
      machine.getState().match({
        Resolved: (res) => `DONE: ${res}`,
        Rejected: (err) => `Error! ${err}`,
        _: () => `Not yet: ${machine.getState().key}`,
      }),
    );

  checkState();
  machine.api.execute(1000);
  checkState();
  // const pendingPromise = machine.promise;
  // if (pendingPromise !== machine.promise) {
  //   console.log("Got valid result BUT promise changed!");
  // }
  machine.api.execute(1);
  // const donePromise = machine.done;
  const beforeDoneState = machine.getState();
  checkState();
  console.log("rejecting");
  machine.api.reject(new Error("error"));
  checkState();

  // await donePromise;
  const doneState = machine.getState();
  // if (machine.done === donePromise && doneState === beforeDoneState) {
  //   console.log("changed", doneState.data);
  // } else {
  //   console.log(
  //     `state changed from ${beforeDoneState.key} to ${doneState.key}`,
  //   );
  // }

  // machine.send2('execute', 1000)
  // machine.send<"execute">("execute", 1);
  machine.send("execute", 1000);
  machine.send("reject", new Error("error"));
  // machine.debugParams<any, 'Pending'>('resolve')('ok')
  // machine.debugParams<'execute', 'Idle'>('execute')(123)
  await delay(2);
  checkState();

  await delay(1);
  checkState();
  await delay(1);
  checkState();

  const fetchMachine = withApi(
    createPromiseMachine((id: number) =>
      fetch(`.data/${id}`).then((response) => response.json()),
    ),
  );

  const logState = () =>
    fetchMachine.getState().match({
      Resolved: (data) => console.log(data),
      Rejected: (error) => console.log(error.message),
      _: () => console.log("not yet"),
    });

  logState(); // not yet
  fetchMachine.api.execute(123);
  logState(); // not yet
  logState(); // result or error

  const change = machine.getChange();

  if (
    matchChange(change, {
      to: "Pending",
      from: "Idle",
      type: "execute",
    })
  ) {
    change.from.key = "Idle";
    change.type = "execute";
    change.to.key = "Pending";
  }
}
