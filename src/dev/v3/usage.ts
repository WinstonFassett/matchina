import { createStateMachine } from "./createStateMachine";
import { before, guard, machineSetup, setupMachine } from "./machineSetup";
import { defineStates } from '../../states';
import { StateFromFactory } from "./machine-types-v3";
import { createFactoryMachine } from "./createFactoryMachine";

const m1 = createStateMachine({
  Idle: {
    'start': 'Running'
  },
  Running: {
    'stop': 'Idle'
  }
}, { key: 'Idle', data: undefined });

setupMachine(m1)(
  guard(ev => true),
  before(ev => console.log('before', ev))
);

const m2 = createStateMachine({
  Idle: {
    'start': 'Running'
  },
  Running: {
    'stop': 'Idle'
  }
}, { key: 'Idle', data: undefined } as { key: 'Idle' | 'Pending' | 'Done'; data: undefined; });

machineSetup<typeof m2>(
  guard(ev => true),
  before(ev => console.log('before', ev))
)(m2);

const states = defineStates({
  Idle: undefined,
  Pending: (x: number) => { s: `#${x}` },
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err })
});

type State = StateFromFactory<typeof states>;

const m4 = createFactoryMachine(states, {
  Idle: { execute: 'Pending'},
  Pending: { resolve: 'Resolved', reject: 'Rejected' },
  Resolved: {},
  Rejected: {}
}, states.Idle())

setupMachine(m4)(guard(ev => !!ev.to))

m4.send('execute', 1)