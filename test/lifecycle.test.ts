import { describe, it, expect } from 'vitest';
import { withLifecycle } from '../src/lifecycle';
import { createMachine } from '../src/factory-machine';
import { defineStates } from '../src/define-states';
import { guard, handle, before, update, leave, enter, effect, notify, after, hookSetup, transition } from '../src/state-machine-hooks';
import { setup } from '../src/ext/setup';
import { enhanceMethod } from '../src/ext/methodware/enhance-method';
import { createMethodEnhancer, tap, transitionHooks } from '../src';

function trackCalls() {
  const calls: string[] = [];
  return {
    calls,
    fn(name: string) {
      return (ev: any) => calls.push(name);
    },
    guard(name: string, result = true) {
      return (ev: any) => { calls.push(name); return result; };
    },
    handle(name: string) {
      return (ev: any) => { calls.push(name); return ev; };
    },
    before(name: string) {
      return (ev: any) => { calls.push(name); return ev; };
    }
  };
}

const LIFECYCLE_PHASES = [
  'guard',
  'handle',
  'before',
  'update',
  'leave',
  'enter',
  'effect',
  'notify',
  'after'
];

describe('withLifecycle', () => {
  it('should call hooks in correct order for transition', () => {
    const tracker = trackCalls();
    const lifecycle = withLifecycle({}, (ev) => tracker.fn('update')(ev));
    setup(lifecycle)(
      guard((ev) => { tracker.calls.push('guard'); return true; }),
      handle((ev) => { tracker.calls.push('handle'); return ev; }),
      before((ev) => { tracker.calls.push('before'); return ev; }),
      update((ev) => { tracker.calls.push('update'); }),
      effect((ev) => { tracker.calls.push('effect'); }),
      leave((ev) => { tracker.calls.push('leave'); }),
      enter((ev) => { tracker.calls.push('enter'); }),
      notify((ev) => { tracker.calls.push('notify'); }),
      after((ev) => { tracker.calls.push('after'); })
    )
    lifecycle.transition('event');
    expect(tracker.calls).toEqual(LIFECYCLE_PHASES);
  });
});

describe('Lifecycle hook functions', () => {
  it('should call hooks in correct order for transition', () => {
    const tracker = trackCalls();
    const machine = createMachine(
      defineStates({ Idle: undefined, Active: undefined }),
      { Idle: { go: 'Active' }, Active: {} },
      'Idle'
    );
    setup(machine)(
      guard((ev) => { tracker.calls.push('guard'); return true; }),
      handle((ev) => { tracker.calls.push('handle'); return ev; }),
      before((ev) => { tracker.calls.push('before'); return ev; }),
      update((ev) => { tracker.calls.push('update'); }),
      effect((ev) => { tracker.calls.push('effect'); }),
      leave((ev) => { tracker.calls.push('leave'); }),
      enter((ev) => { tracker.calls.push('enter'); }),
      notify((ev) => { tracker.calls.push('notify'); }),
      after((ev) => { tracker.calls.push('after'); })
    );
    machine.send('go');
    expect(tracker.calls).toEqual(LIFECYCLE_PHASES);
  });
});

describe('Lifecycle for machine transitionHooks(...hooks)', () => {
  it('should call hooks in correct order for transition', () => {
    const tracker = trackCalls();
    const states = defineStates({
      Idle: undefined,
      Active: undefined,
      Paused: undefined,
      Done: undefined
    });
    const machine = createMachine(
      states,
      {
        Idle: { start: 'Active' },
        Active: { pause: 'Paused', finish: 'Done' },
        Paused: { resume: 'Active', reset: 'Idle' },
        Done: { reset: 'Idle' }
      },
      'Idle'
    );
    setup(machine)(
      transitionHooks(
        { guard: () => { 
          tracker.calls.push('guard');  
          return true;
        } },
        { handle: (ev) => { tracker.calls.push('handle'); return ev; } },
        { before: (ev) => { tracker.calls.push('before'); return ev; } },
        { update: (ev) => { tracker.calls.push('update'); return ev } },
        { effect: (ev) => { tracker.calls.push('effect'); } },
        { leave: (ev) => { tracker.calls.push('leave'); } },
        { enter: (ev) => { tracker.calls.push('enter'); } },
        { notify: (ev) => { tracker.calls.push('notify'); } },
        { after: (ev) => { tracker.calls.push('after'); } },
      )
    )
    machine.send('start');
    expect(tracker.calls).toEqual(LIFECYCLE_PHASES);
  });
})