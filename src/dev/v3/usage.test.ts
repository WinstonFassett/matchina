import { defineStates } from '../../states';
import { createFactoryMachine } from './factory-machine';
import { after, before, guard, machineSetup, setupMachine } from './machine-setup';
import { createStateMachine } from './state-machine';
import { expect, describe, it } from 'vitest';

// Define common states
const states = defineStates({
  Idle: undefined,
  Pending: (x: number) => ({ s: `#${x}` }),
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err })
});

describe('setupMachine', () => {
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

  it('should transition from Idle to Running when started', () => {
    m1.send('start');
    expect(m1.getState().key).toBe('Running');
  });

  it('should transition from Running to Idle when stopped', () => {
    m1.send('start');
    m1.send('stop');
    expect(m1.getState().key).toBe('Idle');
  });
});

describe('machineSetup', () => {
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

  it('should transition from Idle to Running when started', () => {
    m2.send('start');
    expect(m2.getState().key).toBe('Running');
  });

  it('should transition from Running to Idle when stopped', () => {
    m2.send('start');
    m2.send('stop');
    expect(m2.getState().key).toBe('Idle');
  });
});

describe('factory-machine', () => {
  const m4 = createFactoryMachine(states, {
    Idle: { execute: 'Pending' },
    Pending: { resolve: 'Resolved', reject: 'Rejected' },
    Resolved: {},
    Rejected: {}
  }, states.Idle());

  setupMachine(m4)(
    guard(ev => ev.type !== 'execute' || ev.params[0] > 0),
    before(ev => { if (ev.type == 'execute') { console.log('executing') } }),
    after(ev => console.log(ev.to.match<any>({
      Pending: (ev) => ev.s,
      Resolved: (ev) => ev.ok,
      Rejected: (ev) => ev.err,
      _: () => false
    }))),
  );

  it('should transition through states when executed', () => {
    m4.send('execute', 1);
    expect(m4.getState().key).toBe('Pending');
    
    // Depending on your logic, you may want to further transition and test
    // For example, transition to 'Resolved' or 'Rejected' based on some condition
    // m4.send('resolve', true);
    // or
    // m4.send('reject', new Error('Some error'));

    // Add assertions here to check the expected state transitions
  });
});
