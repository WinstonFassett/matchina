import { defineStates } from '../../states';
import { createFactoryMachine } from "./factory-machine";
import { after, before, guard, machineSetup, setupMachine } from "./machine-setup";
import { createStateMachine } from "./state-machine";

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
  Pending: (x: number) => ({ s: `#${x}` }),
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err })
});

const m4 = createFactoryMachine(states, {
  Idle: { execute: 'Pending'},
  Pending: { resolve: 'Resolved', reject: 'Rejected' },
  Resolved: {},
  Rejected: {}
}, states.Idle())

setupMachine(m4)(
  guard(ev => ev.type !== 'execute' || ev.params[0] > 0),
  before(ev => { if(ev.type == 'execute'){ console.log('executing') } }),
  after(ev => console.log(ev.to.match<any>({
    Pending: (ev) => ev.s,
    Resolved: (ev) => ev.ok,
    Rejected: (ev) => ev.err,
    _: () => false
  }))),
)

m4.send('execute', 1)