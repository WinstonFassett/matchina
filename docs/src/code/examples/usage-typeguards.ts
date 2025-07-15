import {
  createApi,
  createMachine,
  createPromiseMachine,
  defineStates,
  delay,
  matchChange,
  type FactoryMachineTransitions,
  type States,
} from "matchina";

// usage
// ---cut---
type MyStateData = {
  Idle: undefined;
  Foo: (foo: string) => {
    foo: string;
  };
  Bar: (bar: number) => {
    bar: number;
  };
};
type MyStates = States<MyStateData>;

const states: MyStates = defineStates<MyStateData>({
  Idle: undefined,
  Foo: (foo: string) => ({ foo }),
  Bar: (bar: number) => ({ bar }),
});

type Transitions = FactoryMachineTransitions<MyStates> & {
  readonly Idle: {
    readonly start: "Foo";
  };
  readonly Foo: {
    readonly toggle: "Bar";
    readonly foo: (foo?: string) => MyStates["Foo"];
  };
  readonly Bar: {
    readonly toggle: "Foo";
    readonly increment: (bar: number) => (ev: any) => MyStates["Bar"];
  };
};

const transitions: Transitions = {
  Idle: {
    start: "Foo",
  },
  Foo: {
    toggle: "Bar",
    foo: (foo = "foo") => states.Foo(`my-${foo}`) as any,
  },
  Bar: {
    toggle: "Foo",
    increment: (bar: number) => (ev: any) =>
      states.Bar(ev.from.data.bar + bar) as any,
  },
};

const machine = createMachine<MyStates, Transitions>(
  states,
  transitions,
  "Idle",
);

machine.states.Bar(1).data.bar === 1;
//              ^|

const change = machine.getChange();
const {
  type,
  from: { key: fromKey },
  to: { key: toKey },
} = change;
console.log(`Event type: ${type} from ${fromKey} to ${toKey}`);

const slowAddingMachine = createPromiseMachine(
  async (a: number, b: number, t: number = 1000) => {
    await delay(t);
    return a + b;
  },
);

slowAddingMachine.execute(1, 2);
const api = createApi(slowAddingMachine);
api.reject(new Error("test"));
//   ^|

const lastChange = slowAddingMachine.getChange();

lastChange.to.match(
  {
    Pending: ({ promise: _promise, params: [_a, _b, _t] }) => {},
    Rejected: (err) => {
      console.log(err.name, err.message);
    },
  },
  false,
);
const { from } = lastChange;
console.log(`Transitioned from ${from.key} to ${lastChange.to.key}`);
if (
  matchChange(lastChange, {
    to: "Rejected",
  })
) {
  lastChange.type = "reject";
}

lastChange.match(
  {
    executing: (a, b, t = 1000) => {
      console.log(a, b, t);
    },
    reject: (err) => {
      console.log(err.name, err.message);
    },
  },
  false,
);

if (lastChange.to.is("Pending")) {
  const [a, b, t] = lastChange.to.data.params;
  console.log("Pending state with params:", a, b, t);
}

slowAddingMachine.states.Idle().key;
