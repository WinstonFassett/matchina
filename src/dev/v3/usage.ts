import { createStateMachine } from "./createStateMachine";
import { setupMachine, machineSetup } from "./machineSetup";
import { guard, before } from "./machineSetup";

type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

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
