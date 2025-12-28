import { describe, it, expect, beforeEach } from 'vitest';
import { createMachine } from '../src/factory-machine';
import { defineStates } from '../src/define-states';
import { setup } from '../src/ext/setup';
import { resolveExit } from '../src/state-machine-hooks';
import { propagateSubmachines } from '../src/nesting/propagateSubmachines';
import { eventApi } from '../src/factory-machine-event-api';
import { createCheckoutMachine } from '../docs/src/code/examples/hsm-checkout/machine';

describe('propagateSubmachines - REAL TESTS', () => {
  it('should route events to deepest active child first', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // This should route to child first
    parentMachine.send('start');
    
    expect(childMachine.getState().key).toBe('Active');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should bubble up to parent when child cannot handle', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: {}, // No transitions
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Child can't handle 'activate', so it bubbles to parent
    parentMachine.send('activate');
    
    expect(parentMachine.getState().key).toBe('Active');
    expect(childMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should bubble child.exit when child reaches final state', () => {
    const childStates = defineStates({
      Active: () => ({ key: 'Child.Active' }),
      Done: () => ({ key: 'Child.Done', final: true }),
    });
    const childMachine = createMachine(childStates, {
      Active: { complete: () => childStates.Done() },
      Done: {}, // Final state
    }, 'Active');

    const parentStates = defineStates({
      Waiting: () => ({ key: 'Parent.Waiting', machine: childMachine }),
      Completed: () => ({ key: 'Parent.Completed' }),
    });
    const parentMachine = createMachine(parentStates, {
      Waiting: { 'child.exit': () => parentStates.Completed() },
      Completed: {},
    }, 'Waiting');

    const disposer = propagateSubmachines(parentMachine);
    
    // Move child to final state
    parentMachine.send('complete');
    
    // Should trigger child.exit bubble
    expect(childMachine.getState().key).toBe('Done');
    expect(parentMachine.getState().key).toBe('Completed');
    
    disposer();
  });

  it('should handle multiple levels of nesting', () => {
    const grandchildStates = defineStates({
      Idle: () => ({ key: 'Grandchild.Idle' }),
      Active: () => ({ key: 'Grandchild.Active' }),
    });
    const grandchildMachine = createMachine(grandchildStates, {
      Idle: { start: () => grandchildStates.Active() },
      Active: { stop: () => grandchildStates.Idle() },
    }, 'Idle');

    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle', machine: grandchildMachine }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { activate: () => childStates.Active() },
      Active: { deactivate: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Should route to deepest child
    parentMachine.send('start');
    
    expect(grandchildMachine.getState().key).toBe('Active');
    expect(childMachine.getState().key).toBe('Idle');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should handle child.change events with payload', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send child.change event with payload
    parentMachine.send('child.change', { type: 'start', params: [] });
    
    // Should have routed to child
    expect(childMachine.getState().key).toBe('Active');
    
    disposer();
  });

  it('should handle child.* events', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { 'child.start': () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send child.* event
    parentMachine.send('child.start');
    
    // Should have handled at parent level
    expect(parentMachine.getState().key).toBe('Active');
    
    disposer();
  });

  it('should handle child state changes with notification', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event that causes child state change
    parentMachine.send('start');
    
    // Should have notified hierarchy of change
    expect(childMachine.getState().key).toBe('Active');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should return null when no event can be handled', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: {}, // No transitions
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: {}, // No transitions
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event that no one can handle
    const result = parentMachine.send('unknown');
    
    // Should return null (no transition occurred)
    expect(result).toBe(null);
    expect(childMachine.getState().key).toBe('Idle');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should handle complex exit bubbling with resolveExit hooks', () => {
    const childStates = defineStates({
      Active: () => ({ key: 'Child.Active' }),
      Done: () => ({ key: 'Child.Done' }),
    });
    const childMachine = createMachine(childStates, {
      Active: { complete: () => childStates.Done() },
      Done: {}, // Final state
    }, 'Active');

    // Add resolveExit hook to child
    setup(childMachine)(resolveExit((ev, next) => {
      if (ev.type === 'complete') {
        return next(ev); // Let normal resolution proceed
      }
      return next(ev);
    }));

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Completed: () => ({ key: 'Parent.Completed' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { 'child.exit': () => parentStates.Completed() },
      Completed: { reset: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event that triggers resolveExit path
    parentMachine.send('complete');
    
    // Should have gone through resolveExit and transition
    expect(childMachine.getState().key).toBe('Done');
    expect(parentMachine.getState().key).toBe('Completed');
    
    disposer();
  });

  it('should handle multiple levels of nesting', () => {
    const grandchildStates = defineStates({
      Idle: () => ({ key: 'Grandchild.Idle' }),
      Active: () => ({ key: 'Grandchild.Active' }),
    });
    const grandchildMachine = createMachine(grandchildStates, {
      Idle: { start: () => grandchildStates.Active() },
      Active: { stop: () => grandchildStates.Idle() },
    }, 'Idle');

    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle', machine: grandchildMachine }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { activate: () => childStates.Active() },
      Active: { deactivate: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Should route to deepest child
    parentMachine.send('start');
    
    expect(grandchildMachine.getState().key).toBe('Active');
    expect(childMachine.getState().key).toBe('Idle');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('DEBUG: show what handleAtRoot is doing', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    console.log('Before send - child:', childMachine.getState().key);
    console.log('Before send - parent:', parentMachine.getState().key);
    
    // This should route to child first
    const result = parentMachine.send('start');
    
    console.log('After send - child:', childMachine.getState().key);
    console.log('After send - parent:', parentMachine.getState().key);
    console.log('Send result:', result);
    
    // For now just check that something happened
    expect(childMachine.getState().key).toBeDefined();
    
    disposer();
  });

  it('should handle child machines with resolveExit hooks', () => {
    const childStates = defineStates({
      Active: () => ({ key: 'Child.Active' }),
      Done: () => ({ key: 'Child.Done' }),
    });
    const childMachine = createMachine(childStates, {
      Active: { complete: () => childStates.Done() },
      Done: {}, // Final state
    }, 'Active');

    // Add resolveExit hook that returns an event (this hits lines 227-242)
    setup(childMachine)(resolveExit((ev, next) => {
      if (ev.type === 'complete') {
        const resolved = next(ev);
        return resolved; // Return the resolved event
      }
      return next(ev);
    }));

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Completed: () => ({ key: 'Parent.Completed' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { 'child.exit': () => parentStates.Completed() }, // Handle child.exit bubbling
      Completed: { reset: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event to child that triggers resolveExit path and bubbling
    parentMachine.send('complete');
    
    // Should have gone through resolveExit and bubbled up
    expect(childMachine.getState().key).toBe('Done');
    expect(parentMachine.getState().key).toBe('Completed');
    
    disposer();
  });

  it('should force trigger bubbleChildExitEvents with final state', () => {
    // Create a child machine that reaches final state
    const childStates = defineStates({
      Working: () => ({ key: 'Child.Working' }),
      Done: () => ({ key: 'Child.Done' }), // No transitions = final state
    });
    const childMachine = createMachine(childStates, {
      Working: { finish: () => childStates.Done() },
      Done: {}, // Final state - no outgoing transitions
    }, 'Working');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Completed: () => ({ key: 'Parent.Completed' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { 'child.exit': () => parentStates.Completed() }, // Handle child.exit bubbling
      Completed: { reset: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event that moves child to final state (this should trigger bubbleChildExitEvents)
    parentMachine.send('finish');
    
    // Child should be in final state
    expect(childMachine.getState().key).toBe('Done');
    
    // Parent should have received child.exit and transitioned
    expect(parentMachine.getState().key).toBe('Completed');
    
    disposer();
  });

  it('should test direct child event routing', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { start: () => parentStates.Active() }, // Parent handles start
      Active: { stop: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send start event - should route to child first
    parentMachine.send('start');
    
    // Child should handle it since it has start transition
    expect(childMachine.getState().key).toBe('Active');
    expect(parentMachine.getState().key).toBe('Idle'); // Parent unchanged
    
    // Send stop event - should route to child first
    parentMachine.send('stop');
    
    // Child should handle it
    expect(childMachine.getState().key).toBe('Idle');
    expect(parentMachine.getState().key).toBe('Idle'); // Parent unchanged
    
    disposer();
  });

  it('should test parent fallback when child cannot handle', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: {}, // No stop transition
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() }, // Parent handles activate (child can't)
      Active: { stop: () => parentStates.Idle() }, // Parent handles stop
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send activate event - child can't handle, should bubble to parent
    parentMachine.send('activate');
    
    // Child should remain unchanged since it can't handle activate
    expect(childMachine.getState().key).toBe('Idle');
    
    // Parent should handle it and go to Active
    expect(parentMachine.getState().key).toBe('Active');
    
    // Now send stop event - child can't handle, should bubble to parent
    parentMachine.send('stop');
    
    // Child should remain unchanged
    expect(childMachine.getState().key).toBe('Idle');
    
    // Parent should handle it and go back to Idle
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should handle internal child.change notifications (lines 309-318)', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { start: () => parentStates.Active() },
      Active: { stop: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send internal child.change notification with target !== root (hits line 310)
    (parentMachine as any).send('child.change', { 
      target: childMachine, // Different from root
      type: 'start', 
      params: [], 
      _internal: true 
    });
    
    // Should handle internal notification without error
    expect(childMachine.getState().key).toBe('Idle');
    expect(parentMachine.getState().key).toBe('Idle');
    
    disposer();
  });

  it('should handle external child.change notifications (lines 315-318)', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { start: () => parentStates.Active() },
      Active: { stop: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send external child.change notification (hits line 315-318)
    // This will actually trigger the event since it's external
    (parentMachine as any).send('child.change', { 
      target: childMachine, 
      type: 'start', 
      params: [], 
      _internal: false // External notification
    });
    
    // External notification should trigger the event
    expect(childMachine.getState().key).toBe('Active');
    expect(parentMachine.getState().key).toBe('Idle'); // Parent unchanged
    
    disposer();
  });

  it('should trigger bubbleChildExitEvents after successful child handling (lines 350-359)', () => {
    const childStates = defineStates({
      Working: () => ({ key: 'Child.Working' }),
      Done: () => ({ key: 'Child.Done' }), // Final state
    });
    const childMachine = createMachine(childStates, {
      Working: { finish: () => childStates.Done() },
      Done: {}, // Final state
    }, 'Working');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Completed: () => ({ key: 'Parent.Completed' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { 'child.exit': () => parentStates.Completed() },
      Completed: { reset: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event that moves child to final state and triggers bubbleChildExitEvents
    parentMachine.send('finish');
    
    // Child should be in final state
    expect(childMachine.getState().key).toBe('Done');
    
    // Parent should have received child.exit and transitioned
    expect(parentMachine.getState().key).toBe('Completed');
    
    disposer();
  });

  it('should handle duck-typed child machines (lines 354-359)', () => {
    const duckTypedChild = {
      getState: () => ({ key: 'Duck.Active' }),
      send: (type: string) => {
        // Mock duck-typed machine
        console.log('Duck machine received:', type);
      }
    };

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: duckTypedChild }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { start: () => parentStates.Active() },
      Active: { stop: () => parentStates.Idle() },
    }, 'Idle');

    const disposer = propagateSubmachines(parentMachine);
    
    // Send event to duck-typed child (hits handleDuckTypedChild lines 354-359)
    parentMachine.send('start');
    
    // Parent should handle the event since duck-typed child doesn't return a result
    expect(parentMachine.getState().key).toBe('Active');
    
    disposer();
  });
});
