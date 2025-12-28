import { describe, it, expect } from 'vitest';
import { buildFlattenedShape, buildHierarchicalShape } from '../src/nesting/shape-builders';
import { defineStates } from '../src/define-states';
import { createMachine } from '../src/factory-machine';

describe('shape-builders', () => {
  describe('buildFlattenedShape', () => {
    it('should build shape from simple flattened transitions', () => {
      const shape = buildFlattenedShape({
        'State1': { NEXT: 'State2' },
        'State2': { NEXT: 'State1' },
      }, 'State1');

      expect(shape.type).toBe('flattened');
      expect(shape.initialKey).toBe('State1');
      expect(shape.states.size).toBe(2);
      expect(shape.states.get('State1')?.key).toBe('State1');
      expect(shape.states.get('State1')?.isFinal).toBe(false);
      expect(shape.transitions.get('State1')?.get('NEXT')).toBe('State2');
    });

    it('should handle hierarchical state keys', () => {
      const shape = buildFlattenedShape({
        'Parent.Child1': { NEXT: 'Parent.Child2' },
        'Parent.Child2': { BACK: 'Parent.Child1' },
        'Parent': { RESET: 'Parent.Child1' },
      }, 'Parent.Child1');

      expect(shape.states.size).toBe(3);
      expect(shape.states.get('Parent.Child1')?.isCompound).toBe(true);
      expect(shape.states.get('Parent')?.isCompound).toBe(false); // Parent has no parent
      expect(shape.hierarchy.get('Parent.Child1')).toBe('Parent');
      expect(shape.hierarchy.get('Parent')).toBeUndefined();
    });

    it('should create synthetic parent states', () => {
      const shape = buildFlattenedShape({
        'Parent.Child1': { NEXT: 'Parent.Child2' },
        'Parent.Child2': { BACK: 'Parent.Child1' },
      }, 'Parent.Child1');

      // Should create Parent state even though it has no direct transitions
      expect(shape.states.has('Parent')).toBe(true);
      expect(shape.states.get('Parent')?.isCompound).toBe(true);
      expect(shape.transitions.get('Parent')?.size).toBe(0);
    });

    it('should identify final states correctly', () => {
      const shape = buildFlattenedShape({
        'Active': { PAUSE: 'Paused', COMPLETE: 'Done' },
        'Paused': { RESUME: 'Active' },
        'Done': {}, // Final state
      }, 'Active');

      expect(shape.states.get('Done')?.isFinal).toBe(true);
      expect(shape.states.get('Active')?.isFinal).toBe(false);
      expect(shape.states.get('Paused')?.isFinal).toBe(false);
    });

    it('should handle simple function transitions', () => {
      const states = defineStates({
        'State1': () => ({ key: 'State1', data: { value: 1 } }),
        'State2': () => ({ key: 'State2', data: { value: 2 } }),
      });

      const shape = buildFlattenedShape({
        'State1': { 
          NEXT: () => states['State2']() // Simple function
        },
      }, 'State1');

      expect(shape.transitions.get('State1')?.get('NEXT')).toBe('State2');
    });

    it('should handle curried function transitions', () => {
      const states = defineStates({
        'State1': () => ({ key: 'State1', data: { value: 1 } }),
        'State2': () => ({ key: 'State2', data: { value: 2 } }),
      });

      const shape = buildFlattenedShape({
        'State1': { 
          NEXT: (param: string) => (ev: any) => states['State2']() // Curried function
        },
      }, 'State1');

      expect(shape.transitions.get('State1')?.get('NEXT')).toBe('State2');
    });

    it('should handle function transitions that throw errors', () => {
      const shape = buildFlattenedShape({
        'State1': { 
          NEXT: () => { throw new Error('Discovery failed'); }
        },
      }, 'State1');

      // Should handle error gracefully and not add transition
      expect(shape.transitions.get('State1')?.has('NEXT')).toBe(false);
    });

    it('should handle complex nested hierarchies', () => {
      const shape = buildFlattenedShape({
        'A.B.C.D': { UP: 'A.B.C' },
        'A.B.C': { DOWN: 'A.B.C.D', UP: 'A.B' },
        'A.B': { UP: 'A' },
        'A': { RESET: 'A.B.C.D' },
      }, 'A.B.C.D');

      expect(shape.states.size).toBe(4);
      expect(shape.hierarchy.get('A.B.C.D')).toBe('A.B.C');
      expect(shape.hierarchy.get('A.B.C')).toBe('A.B');
      expect(shape.hierarchy.get('A.B')).toBe('A');
      expect(shape.hierarchy.get('A')).toBeUndefined();
    });

    it('should handle empty transitions', () => {
      const shape = buildFlattenedShape({}, 'State1');

      expect(shape.states.size).toBe(0);
      expect(shape.transitions.size).toBe(0);
      expect(shape.hierarchy.size).toBe(0);
    });
  });

  describe('buildHierarchicalShape', () => {
    it('should build shape from hierarchical machine', () => {
      const childStates = defineStates({
        'Child1': () => ({ key: 'Child1', data: { value: 'child1' } }),
        'Child2': () => ({ key: 'Child2', data: { value: 'child2' } }),
      });

      const childMachine = createMachine(childStates, {
        'Child1': { NEXT: () => childStates['Child2']() },
        'Child2': { BACK: () => childStates['Child1']() },
      }, 'Child1');

      const parentStates = defineStates({
        'Parent': () => ({ 
          key: 'Parent', 
          data: { value: 'parent' },
          machine: childMachine
        }),
      });

      const parentMachine = createMachine(parentStates, {}, 'Parent');

      const shape = buildHierarchicalShape(parentMachine);

      expect(shape.type).toBe('nested');
      expect(shape.states.size).toBe(1); // Only Parent (child machine not automatically discovered)
      expect(shape.states.get('Parent')?.isCompound).toBe(false); // Not auto-detected as compound
    });

    it('should handle machines without submachines', () => {
      const states = defineStates({
        'State1': () => ({ key: 'State1', data: { value: 1 } }),
        'State2': () => ({ key: 'State2', data: { value: 2 } }),
      });

      const machine = createMachine(states, {
        'State1': { NEXT: () => states['State2']() },
      }, 'State1');

      const shape = buildHierarchicalShape(machine);

      expect(shape.type).toBe('nested');
      expect(shape.states.size).toBe(2);
      expect(shape.states.get('State1')?.isCompound).toBe(false);
      expect(shape.transitions.get('State1')?.get('NEXT')).toBe('State2');
    });

    it('should handle nested machine instantiation errors gracefully', () => {
      const parentStates = defineStates({
        'Parent': () => ({ 
          key: 'Parent', 
          data: { value: 'parent' },
          machine: null // Invalid machine
        }),
      });

      const parentMachine = createMachine(parentStates, {}, 'Parent');

      const shape = buildHierarchicalShape(parentMachine);

      expect(shape.states.size).toBe(1); // Only parent
      expect(shape.states.get('Parent')?.isCompound).toBe(false); // Not marked as compound due to error
    });

    it('should extract initial key from machine', () => {
      const states = defineStates({
        'State1': () => ({ key: 'State1', data: { value: 1 } }),
        'State2': () => ({ key: 'State2', data: { value: 2 } }),
      });

      const machine = createMachine(states, {}, 'State2');

      const shape = buildHierarchicalShape(machine);

      expect(shape.initialKey).toBe('State2');
    });

    it('should handle function transitions in hierarchical machines', () => {
      const states = defineStates({
        'State1': () => ({ key: 'State1', data: { value: 1 } }),
        'State2': () => ({ key: 'State2', data: { value: 2 } }),
      });

      const machine = createMachine(states, {
        'State1': { NEXT: () => states['State2']() },
      }, 'State1');

      const shape = buildHierarchicalShape(machine);

      expect(shape.transitions.get('State1')?.get('NEXT')).toBe('State2');
    });
  });
});
