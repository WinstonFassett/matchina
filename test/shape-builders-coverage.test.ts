import { describe, it, expect } from 'vitest';
import { defineStates } from '../src/define-states';
import { createMachine } from '../src/factory-machine';
import { buildFlattenedShape, buildHierarchicalShape } from '../src/nesting/shape-builders';
import { createFlatMachine } from '../src/nesting/flat-machine';
import { createHierarchicalMachine } from '../src/nesting/propagateSubmachines';

describe('shape-builders coverage', () => {
  describe('buildFlattenedShape', () => {
    it('should build shape from flattened machine', () => {
      const states = defineStates({
        'Parent.Child1': () => ({ key: 'Parent.Child1' }),
        'Parent.Child2': () => ({ key: 'Parent.Child2' }),
        'Parent': () => ({ key: 'Parent' }),
      });
      const machine = createMachine(states, {
        'Parent.Child1': { next: 'Parent.Child2' },
        'Parent.Child2': { back: 'Parent.Child1' },
        'Parent': { reset: 'Parent.Child1' },
      }, 'Parent.Child1');

      const shape = buildFlattenedShape(machine);

      expect(shape.states).toBeDefined();
      expect(shape.states.size).toBeGreaterThan(0);
      expect(shape.hierarchy).toBeDefined();
    });

    it('should handle t() helper metadata', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { 
          toggle: () => states.Active() // Simple form
        },
        Active: { 
          toggle: () => states.Idle() // Simple form
        },
      }, 'Idle');

      const shape = buildFlattenedShape(machine);

      expect(shape.states.get('Idle')).toBeDefined();
      expect(shape.states.get('Active')).toBeDefined();
    });

    it('should handle curried transition functions', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { 
          start: (param: string) => (ev: any) => states.Active() // Curried form
        },
        Active: { 
          stop: (param: number) => (ev: any) => states.Idle() // Curried form
        },
      }, 'Idle');

      const shape = buildFlattenedShape(machine);

      expect(shape.states.get('Idle')).toBeDefined();
      expect(shape.states.get('Active')).toBeDefined();
    });
  });

  describe('buildHierarchicalShape', () => {
    it('should build shape from hierarchical machine', () => {
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

      const shape = buildHierarchicalShape(parentMachine);

      expect(shape.states).toBeDefined();
      expect(shape.states.size).toBeGreaterThan(0);
      expect(shape.hierarchy).toBeDefined();
    });

    it('should walk nested machines correctly', () => {
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

      const shape = buildHierarchicalShape(parentMachine);

      expect(shape.states.size).toBeGreaterThan(2); // Should include all nested states
    });
  });

  describe('integration with machine builders', () => {
    it('should work with createFlatMachine', () => {
      const states = defineStates({
        'Parent.Child1': () => ({ key: 'Parent.Child1' }),
        'Parent.Child2': () => ({ key: 'Parent.Child2' }),
      });
      const machine = createMachine(states, {
        'Parent.Child1': { next: 'Parent.Child2' },
        'Parent.Child2': { back: 'Parent.Child1' },
      }, 'Parent.Child1');

      const flatMachine = createFlatMachine(machine);

      expect(flatMachine.shape).toBeDefined();
      expect(flatMachine.shape.states.size).toBeGreaterThan(0);
    });

    it('should work with createHierarchicalMachine', () => {
      const states = defineStates({
        Idle: () => ({ key: 'Idle' }),
        Active: () => ({ key: 'Active' }),
      });
      const machine = createMachine(states, {
        Idle: { start: () => states.Active() },
        Active: { stop: () => states.Idle() },
      }, 'Idle');

      const hierarchicalMachine = createHierarchicalMachine(machine);

      expect(hierarchicalMachine.shape).toBeDefined();
      expect(hierarchicalMachine.shape.states.size).toBeGreaterThan(0);
    });
  });
});
