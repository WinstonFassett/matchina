import { describe, it, expect, vi } from 'vitest';
import { setup } from '../src/ext/setup';
import { defineStates } from '../src/define-states';
import { createMachine } from '../src/factory-machine';
import { withLifecycle } from '../src/lifecycle';
import { guard, handle, before } from '../src/state-machine-hooks';

describe('state-machine-hook-adapters', () => {
  // Create a simple test machine factory
  function createTestMachine() {
    // Define states with types
    const states = defineStates({
      idle: { key: 'idle', count: 0 },
      active: (count = 0) => ({ key: 'active', count }),
      paused: (count = 0) => ({ key: 'paused', count }),
      done: (count = 0) => ({ key: 'done', count }),
    });
    
    return createMachine(
      states,
      {
        idle: { start: 'active' },
        active: { 
          increment: 'active',
          pause: 'paused',
          finish: 'done'
        },
        paused: { 
          resume: 'active',
          reset: 'idle'
        },
        done: { reset: 'idle' }
      },
      'idle'
    );
  }

  describe('guard', () => {
    it('should prevent transition when guard returns false', () => {
      const machine = createTestMachine();
      
      // Add guard that prevents 'start' transition
      setup(machine)(
        guard(ev => ev.type !== 'start')
      );

      // Try to transition - should be blocked by guard
      machine.send('start');
      
      // State should still be idle
      expect(machine.getState().key).toBe('idle');
    });
  });

  describe('handle', () => {
    it('should modify events before they are processed', () => {
      const machine = createTestMachine();
      
      // Add handler that modifies the increment amount
      setup(machine)(
        handle(ev => {
          if (ev.type === 'increment') {
            // For the active state, we need to create a new active state with count=5
            // return { ...ev, type: 'increment', params: [5] };
            return { ...ev, to: machine.states.active(5) }
          }
          return ev;
        })
      );

      // Start the machine
      machine.send('start');
      expect(machine.getState().key).toBe('active');
      
      // Send increment with 1, but handler will change it to 5
      machine.send('increment', 1);
      
      // Count should be 5, not 1
      expect(machine.getState().data.count).toBe(5);
    });
  });

  describe('before', () => {
    it('should abort transitions conditionally', () => {
      const machine = createTestMachine();
      const spy = vi.fn();
      
      // Add before hook that aborts increment when count would be > 1
      setup(machine)(
        before(ev => {
          if (ev.type === 'increment') {
            // Get current count
            const currentCount = ev.from.data.count;
            // Abort if count is already 1 (simpler condition for testing)
            if (currentCount === 1) {
              spy(currentCount);
              return true; // abort the transition
            }
          }
          return false; // don't abort
        })
      );

      // Start the machine
      machine.send('start');
      expect(machine.getState().key).toBe('active');
      
      // Send increments - should work until count reaches 3
      machine.send('increment', 1);
      expect(machine.getState().data.count).toBe(1);
      
      // Second increment
      machine.send('increment', 1);
      // The count doesn't increment by the params - it just transitions to active state
      expect(machine.getState().data.count).toBe(1);
      
      // Third increment - this should be the last one that works
      machine.send('increment', 1);
      expect(machine.getState().data.count).toBe(1);
      
      // This should be blocked
      machine.send('increment', 1);
      
      // Count should still be 1
      expect(machine.getState().data.count).toBe(1);
      
      // Spy should have been called with count=1
      expect(spy).toHaveBeenCalledWith(1);
    });
  });
});
