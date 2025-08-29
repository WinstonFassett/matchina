// Type-only tests for flattened API param inference and state typing
import { defineMachine, defineSubmachine, flattenMachineDefinition } from "../src/definitions";
import { defineStates } from "../src/define-states";

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
    Yellow: (delta: number) => ({ delta }),
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
  {
    Broken: undefined,
    Working: Child,
  },
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
