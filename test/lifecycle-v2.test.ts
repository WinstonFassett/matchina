import { describe, expect, it } from 'vitest';
import { createPromiseMachine } from '../src/extras/promise';
import { withEvents } from '../src/extras/with-events';
import { Middleware, enhanceMachine } from '../src/dev/lifecycle-v2'

describe('onLifecycle usage', () => {
  it.only('should call guard, handle, and event hooks in lifecycle order', async () => {
    let didGuardReject = 0;
    let didGuardAccept = 0;
    let didBeforeExecute = 0;
    let didBeforeResolve = 0;
    let didHandleExecute = 0;
    let didHandlerReject = 0;
    let didAfterResolve = 0;
    let didEnterPending = 0;
    let didLeaveIdle = 0;
    let didEnterRejected = 0;
    let count = 0;

    // Create machine WITHOUT a promise to drive it
    const machine = withEvents(createPromiseMachine<number, [number]>());
    const expectState = (state: string) =>
      expect(machine.getState().key).toBe(state);
    const expectStateData = () => {
      return expect(machine.getState().data);
    };

    expectState('Idle');

    const use = enhanceMachine(machine);    
    type State = typeof machine.context.states[keyof typeof machine.context.states]
    type Change = ReturnType<typeof machine.getChange>
    // Add middleware functions
    const middleware1: Middleware<Change> = (event, next) => {
      console.log(`Middleware 1: Received event ${event}`);
      next(event);
    };

    const middleware2: Middleware<Change> = (event, next) => {
      console.log(`Middleware 2: Received event ${event}`);
      next(event);
    };

    use(middleware1, middleware2);

  })
})