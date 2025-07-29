import {
  createMachine,
  defineStates,
  withApi,
  withSubscribe,
} from "matchina";

// ---cut---
const states = defineStates({
  FOO: () => ({}),
  BAR: () => ({}),
  BAZ: () => ({}),
});

const runMachine = createMachine(
  states,
  {
    FOO: {
      switch: () => () => states.BAR(),
    },
    BAR: {
      switch: () => () => states.FOO(),
    },
    BAZ: {
      switch: () => () => states.BAZ(),
    },
  },
  "FOO"
);

const machine = withSubscribe(withApi(runMachine));

machine.api.switch();

const currentState = machine.getState();
console.log("Current state:", currentState.key);

const unsubscribe = machine.subscribe
  ? machine.subscribe((change) => {
      // Any change
      const { type, from, to, params } = change;
      console.log(
        `Change detected: type=${type}, from=${from.key}, to=${to.key}, params=${JSON.stringify(
          params
        )}`
      );
      change.match({
        switch: function (..._args: any[]) {
          console.log("switching!");
          unsubscribe?.();
        },
      });
      return () => {
        console.log("exiting", change);
      };
    })
  : undefined;

// machine.when({ to: "FOO" }, ({ to }) => {
//   // When first entering either state
//   return () => {
//     // When exiting to other state
//   };
// });

// machine.when({ to: ["FOO", "BAR"] }, ({ to }) => {});

// machine.when({ to: "FOO", type: "switch" }, ({ to }) => {});

// machine.when({ to: ["FOO", "BAR"], type: "switch" }, (change) => {});

// machine.when({ type: "switch", to: "FOO", from: "BAR" }, (change) => {});

// machine.when(
//   { to: ["FOO", "BAR"], type: "switch", from: "BAZ" },
//   (change) => {},
// );
