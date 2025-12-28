import { describe, it, expect, vi } from 'vitest';
import { defineStates } from '../src/define-states';
import { createMachine } from '../src/factory-machine';
import { createStaticShapeStore, createLazyShapeStore } from '../src/nesting/shape-store';
import { createFlatMachine, createHierarchicalMachine } from '../src/nesting';

describe('shape-store coverage', () => {
  describe('createStaticShapeStore', () => {
    it('should create static shape store with getState', () => {
      const states = defineStates({
        'Parent.Child1': () => ({ key: 'Parent.Child1' }),
        'Parent.Child2': () => ({ key: 'Parent.Child2' }),
      });
      const machine = createMachine(states, {
        'Parent.Child1': { next: () => states['Parent.Child2']() },
        'Parent.Child2': { back: () => states['Parent.Child1']() },
      }, 'Parent.Child1');

      const shapeStore = createStaticShapeStore(machine);
      
      expect(shapeStore.getState()).toBeDefined();
      expect(shapeStore.getState().states).toBeDefined();
      expect(shapeStore.getState().type).toBe('flattened');
    });

    it('should handle subscription and unsubscription', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createStaticShapeStore(machine);
      const callback = vi.fn();
      
      const unsubscribe = shapeStore.subscribe(callback);
      
      // Should not call callback immediately for static store
      expect(callback).not.toHaveBeenCalled();
      
      // Notify should be no-op for static store
      shapeStore.notify('anything');
      expect(callback).not.toHaveBeenCalled();
      
      // Unsubscribe should work
      unsubscribe();
      shapeStore.notify('anything');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createStaticShapeStore(machine);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = shapeStore.subscribe(callback1);
      const unsubscribe2 = shapeStore.subscribe(callback2);
      
      // Static store notify is no-op
      shapeStore.notify('test');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('createLazyShapeStore', () => {
    it('should create lazy shape store with caching', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createLazyShapeStore(machine);
      
      const shape1 = shapeStore.getState();
      const shape2 = shapeStore.getState();
      
      // Should return same cached instance
      expect(shape1).toBe(shape2);
      expect(shape1.states).toBeDefined();
      expect(shape1.type).toBe('nested');
    });

    it('should handle subscription and notification', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createLazyShapeStore(machine);
      const callback = vi.fn();
      
      const unsubscribe = shapeStore.subscribe(callback);
      
      // Notify should trigger callback with new shape
      shapeStore.notify('some change');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(shapeStore.getState());
      
      unsubscribe();
    });

    it('should invalidate cache on notify', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createLazyShapeStore(machine);
      const callback = vi.fn();
      
      const shape1 = shapeStore.getState();
      shapeStore.subscribe(callback);
      
      // Notify should invalidate cache
      shapeStore.notify('invalidate');
      
      const shape2 = shapeStore.getState();
      
      // Should have built new shape
      expect(callback).toHaveBeenCalledWith(shape2);
    });

    it('should handle multiple subscribers with notification', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const shapeStore = createLazyShapeStore(machine);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = shapeStore.subscribe(callback1);
      const unsubscribe2 = shapeStore.subscribe(callback2);
      
      shapeStore.notify('broadcast');
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith(shapeStore.getState());
      expect(callback2).toHaveBeenCalledWith(shapeStore.getState());
      
      unsubscribe1();
      unsubscribe2();
    });
  });
});
