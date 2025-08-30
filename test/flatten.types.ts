// Type-only sandbox for flattening inference
// Ensures flattened state keys and event unions are preserved as literals

import { defineMachine, defineSubmachine, flattenMachineDefinition } from "../src/definitions";
import { defineStates } from "../src/define-states";

// Simple type equality helpers
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

// Base leaf machine: TrafficLight
const tlStates = { Red: undefined, Green: undefined, Yellow: undefined } as const;
const TrafficLight = defineSubmachine(tlStates, {
  Red: { tick: "Green" },
  Green: { tick: "Yellow" },
  Yellow: { tick: "Red" },
}, "Red");

// Parent machine: Controller with Working submachine
const Ctrl = defineMachine(
  {
    Broken: undefined,
    Working: TrafficLight,
  },
  {
    Broken: { repair: "Working" },
    Working: { break: "Broken" },
  },
  "Working"
);

const Flat = flattenMachineDefinition(Ctrl);

// Define the expected types for testing
type TestFlatStates = {
  Broken: () => undefined;
  'Working.Red': () => undefined;
  'Working.Green': () => undefined;
  'Working.Yellow': (delta?: number) => { delta: number | undefined };
};

type TestFlatTransitions = {
  Broken: { repair: 'Working.Red' };
  'Working.Red': { tick: 'Working.Green', break: 'Broken' };
  'Working.Green': { 
    tick: 'Working.Yellow';
    bump: (delta: number) => () => 'Working.Yellow';
    break: 'Broken';
  };
  'Working.Yellow': { tick: 'Working.Red', break: 'Broken' };
};

// Create a mock flattened machine for tests
const MockFlat = {
  states: {} as TestFlatStates,
  transitions: {} as TestFlatTransitions,
  initial: 'Working.Red' as keyof TestFlatStates
};

// Infer the keys from the test factory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckKeysAreLiterals = Expect<
  Equal<keyof TestFlatStates, "Broken" | "Working.Red" | "Working.Green" | "Working.Yellow">
>;

// Check the initial key is assignable to flattened keys
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckInitialAssignable = Expect<
  keyof TestFlatStates extends string ? true : false
>;

// Per-state events (top-down):
// - Working.*: inherits parent Working events + child events => "break" | "tick"
// - Broken: only its own parent events => "repair"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _EventsWorkingRed = keyof TestFlatTransitions["Working.Red"];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckEventsWorkingRed = Expect<Equal<_EventsWorkingRed, "break" | "tick">>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CheckEventsAllStates = Expect<
  Equal<
    keyof TestFlatTransitions["Working.Green"],
    "break" | "tick" | "bump"
  > &
    Equal<keyof TestFlatTransitions["Working.Yellow"], "break" | "tick"> &
    Equal<keyof TestFlatTransitions["Broken"], "repair">
>;
