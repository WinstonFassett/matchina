/**
 * State configuration in declarative format
 */

export interface DeclarativeStateConfig<
  TData = any,
  TParams extends any[] = any[]
> {
  /** State data constructor function - if omitted, state has empty data */
  data?: (...params: TParams) => TData;

  /** Initial child state (for parent states) */
  initial?: string;

  /** Child states (for hierarchical states) */
  states?: Record<string, DeclarativeStateConfig>;

  /** Transitions from this state */
  on?: Record<string, string | ((...params: any[]) => any)>;

  /** Mark as final state */
  final?: boolean;
}
/**
 * Root machine configuration
 */

export interface DeclarativeFlatMachineConfig {
  /** Initial state key */
  initial: string;

  /** State definitions */
  states: Record<string, DeclarativeStateConfig>;
}
