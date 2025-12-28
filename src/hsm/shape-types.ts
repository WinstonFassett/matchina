/**
 * Machine Shape Types
 *
 * A shape is a static description of a machine's structure: its states,
 * transitions, and hierarchy. Shapes are computed once at definition-time
 * and cached. Only nested machines can have shape changes (when their
 * hierarchy mutates).
 *
 * This is NOT a definition (you can't create machines from a shape).
 * This IS a parts-list/sourcemap/manifest for visualization and introspection.
 */

/**
 * MachineShape - Static structural description of a state machine
 */
export interface MachineShape {
  // Static structural data (compiled at definition time)
  readonly states: ReadonlyMap<string, StateNode>;
  readonly transitions: ReadonlyMap<string, ReadonlyMap<string, string>>;
  readonly hierarchy: ReadonlyMap<string, string | undefined>;
  readonly initialKey: string;

  // Optional metadata about HSM representation
  readonly type?: 'nested' | 'flattened';
}

/**
 * A node in the state hierarchy
 */
export interface StateNode {
  readonly key: string; // short name ("Authorized")
  readonly fullKey: string; // full path ("Payment.Authorized")
  readonly isFinal: boolean;
  readonly isCompound: boolean; // contains submachine
  readonly initial?: string; // initial child state (if compound)
}

/**
 * Controller for accessing and observing machine shape
 *
 * For flattened machines, shape never changes (static).
 * For nested machines, shape can change when the hierarchy mutates.
 */
export interface ShapeController {
  /**
   * Get current compiled shape
   */
  getState(): MachineShape;

  /**
   * Subscribe to shape changes
   * Returns unsubscribe function
   */
  subscribe(callback: (shape: MachineShape) => void): () => void;

  /**
   * Notify subscribers (used internally by nested shape updates)
   */
  notify?: (data: any) => void;
}
