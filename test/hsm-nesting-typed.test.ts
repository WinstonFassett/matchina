import { describe, it, expect } from 'vitest';
import { createFlatMachine } from '../src/hsm/flat-machine';
import { withParentTransitionFallback } from '../src/hsm/parent-transition-fallback';
import { createMachine, defineStates } from '../src';
import { propagateSubmachines } from '../src/hsm/propagateSubmachines';

describe('HSM Nesting APIs - Proper Typing', () => {
  describe('withParentTransitionFallback', () => {
    it('should work with properly typed machine', () => {
      const states = defineStates({
        Red: () => ({ key: 'Red' }),
        Green: () => ({ key: 'Green' }),
      });

      const machine = createMachine(states, {
        Red: {
          next: () => states.Green(),
        },
        Green: {
          next: () => states.Red(),
        },
      }, 'Red');
      withParentTransitionFallback(machine);

      expect(machine.getState().key).toBe('Red');
      machine.send('next');
      expect(machine.getState().key).toBe('Green');
    });
  });

  describe('createFlatMachine', () => {
    it('should create flat machine with proper typing', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });

      const machine = createFlatMachine(states, {
        Idle: {
          start: () => states.Active(),
        },
        Active: {
          stop: () => states.Idle(),
        },
      }, 'Idle');

      expect(machine.getState().key).toBe('Idle');
      expect(machine.shape).toBeDefined();
      machine.send('start');
      expect(machine.getState().key).toBe('Active');
    });
  });

  describe('propagateSubmachines', () => {
    it('should attach propagation hooks with proper typing', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
      });

      const machine = createMachine(states, {
        Idle: {},
      }, 'Idle');
      const disposer = propagateSubmachines(machine);

      expect(disposer).toBeTypeOf('function');
      expect(() => disposer()).not.toThrow();
    });
  });
});
