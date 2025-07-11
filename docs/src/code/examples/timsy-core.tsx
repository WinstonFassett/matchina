import {
  createFactoryMachine,
  defineStates,
  withApi,
  withNanoSubscribe,
} from "matchina";

// ---cut---
const states = defineStates({
  FOO: () => ({}),
  BAR: () => ({}),
  BAZ: () => ({}),
});

const runMachine = createFactoryMachine(
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
  "FOO",
);

const machine = withNanoSubscribe(withApi(runMachine));

machine.api.switch();

const currentState = machine.getState();

const unsubscribe = machine.subscribe((change) => {
  // Any change
  const { type, from, to, params } = change;
  change.match({
    switch: function (...args: any[]) {
      console.log("switching!");
    },
  });
  return () => {
    console.log("exiting", change);
  };
});

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
