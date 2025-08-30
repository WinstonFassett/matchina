// Type-only tests for flattened API param inference and state typing
import { defineMachine, defineSubmachine, flattenMachineDefinition } from "../src/definitions";
import { defineStates } from "../src/define-states";
import { eventApi } from "../src/factory-machine-event-api";
import { createMachine } from "../src/factory-machine";
import type { StateMatchboxFactory } from "../src/state-types";
import type { HasMachineProperty, ExtractMachineFromFactory, FactoryStateKeys, FlattenFactoryStateKeys } from "../src/definition-types";
import { expectTypeOf } from 'vitest';

// Simple type equality helpers
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
type Expect<T extends true> = T;

// Child machine: Green.tick -> Yellow, and Green.bump(delta:number) -> Yellow(delta)
const Child = defineSubmachine(
  defineStates({
    Red: undefined,
    Green: undefined,
    Yellow: (delta?: number) => ({ delta }),
  }),
  {
    Red: { tick: "Green" },
    Green: {
      tick: "Yellow",
      bump: (delta: number) => () => "Yellow",
    },
    Yellow: { tick: "Red" },
  },
  "Red"
);

const Parent = defineMachine(
  defineStates({
    Broken: undefined,
    Working: Child,
  }),
  {
    Broken: { repair: "Working" },
    Working: { break: "Broken" },
  },
  "Working"
);

const Flat = flattenMachineDefinition(Parent);

// Type tests
// ==========

// 1. Test state keys
type FlatStateKey = keyof typeof Flat.states;
type ExpectedStateKeys = 'Broken' | 'Working.Red' | 'Working.Green' | 'Working.Yellow';
type _TestStateKeys = Expect<Equal<FlatStateKey, ExpectedStateKeys>>;

// 2. Test state factory types
type States = typeof Flat.states;
type _TestStates = Expect<Equal<keyof States, ExpectedStateKeys>>;

// 3. Test transition structure
type Transitions = typeof Flat.transitions;

// Check that all expected states have transitions
type _TestTransitionsExist = Expect<
  Equal<keyof Transitions, ExpectedStateKeys>
>;

// Check that each state has the expected events
type _TestBrokenTransitions = Expect<
  'repair' extends keyof Transitions['Broken'] ? true : false
>;

type _TestWorkingRedTransitions = Expect<
  'tick' extends keyof Transitions['Working.Red'] ? true : false
>;

type _TestWorkingGreenTransitions = Expect<
  'tick' | 'bump' extends keyof Transitions['Working.Green'] ? true : false
>;

type _TestWorkingYellowTransitions = Expect<
  'tick' extends keyof Transitions['Working.Yellow'] ? true : false
>;

// 4. Test state factory parameters
type StateFactoryParams = {
  [K in keyof States]: 
    States[K] extends (...args: infer P) => any 
      ? P
      : [];
};

// Check that Yellow state requires a number parameter
type _TestYellowStateParams = Expect<
  States['Working.Yellow'] extends (delta: number) => any ? true : false
>;

// Check that other states take no parameters
type _TestBrokenStateParams = Expect<
  States['Broken'] extends () => any ? true : false
>;

type _TestWorkingRedStateParams = Expect<
  States['Working.Red'] extends () => any ? true : false
>;

type _TestWorkingGreenStateParams = Expect<
  States['Working.Green'] extends () => any ? true : false
>;

// 5. Test machine creation and event API
const machine = createMachine(Flat.states, Flat.transitions, 'Working.Red');
const api = eventApi(machine);

type _TestEventApi = {
  // Test that all expected methods exist with correct types
  hasTick: Expect<Equal<typeof api.tick, () => void>>,
  hasBump: Expect<Equal<typeof api.bump, (delta: number) => void>>,
  hasRepair: Expect<Equal<typeof api.repair, () => void>>,
  
  // Test parameter types
  tickParams: Expect<Equal<Parameters<typeof api.tick>, []>>,
  bumpParams: Expect<Equal<Parameters<typeof api.bump>, [number]>>,
  repairParams: Expect<Equal<Parameters<typeof api.repair>, []>>,
  
  // Test return types
  tickReturn: Expect<Equal<ReturnType<typeof api.tick>, void>>,
  bumpReturn: Expect<Equal<ReturnType<typeof api.bump>, void>>,
  repairReturn: Expect<Equal<ReturnType<typeof api.repair>, void>>
};

// Test invalid calls (should show type errors)
// @ts-expect-error - missing required parameter
api.bump();
// @ts-expect-error - wrong parameter type
api.repair(123);

// Test state transitions
type _TestStateTransitions = {
  // From Working.Red
  redToGreen: Expect<Equal<ReturnType<typeof api.tick>, void>>,
  // From Working.Green
  greenToYellow: Expect<Equal<ReturnType<typeof api.tick>, void>>,
  greenToYellowWithBump: Expect<Equal<ReturnType<typeof api.bump>, void>>,
  // From Working.Yellow
  yellowToRed: Expect<Equal<ReturnType<typeof api.tick>, void>>,
  // From Broken
  repairToWorking: Expect<Equal<ReturnType<typeof api.repair>, void>>
};

// Debug types
type TestChild = typeof Child;
type TestHasMachine = HasMachineProperty<TestChild>; // Should be true
type TestExtractMachine = ExtractMachineFromFactory<TestChild>;
type TestSubKeys = FactoryStateKeys<TestExtractMachine['states']>; // Should be 'Red' | 'Green' | 'Yellow'
type TestFlattenedKeys = FlattenFactoryStateKeys<StateMatchboxFactory<{ Broken: undefined; Working: TestChild }>>;
