// Type definitions for hierarchical state machines
// Focused on type-level flattening without implementation details

import type { StateMatchboxFactory } from "./state-types";
import type {
  FactoryMachineTransitions,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine-types";

// Core machine definition type
export type MachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
> = {
  states: SF;
  transitions: T;
  initial: I;
};

// Extract the config type from a StateMatchboxFactory
export type ExtractFactoryConfig<F> = F extends StateMatchboxFactory<infer C> ? C : never;

// Detect if a factory entry creates a state with a machine property
export type HasMachineProperty<V> = V extends (...args: any[]) => infer R
  ? R extends { data: infer D }
    ? D extends { machine: MachineDefinition<any, any, any> } ? true : false
    : R extends { machine: MachineDefinition<any, any, any> } ? true : false
  : false;

// Extract the machine from a factory entry
export type ExtractMachineFromFactory<V> = V extends (...args: any[]) => infer R
  ? R extends { data: infer D }
    ? D extends { machine: infer M } ? M : never
    : R extends { machine: infer M } ? M : never
  : never;

// Get the state keys from a factory
export type FactoryStateKeys<F> = F extends StateMatchboxFactory<infer C> ? keyof C & string : never;

// Flatten state keys from a factory
// This simplified version focuses on the output type without complex conditional logic
export type FlattenFactoryStateKeys<
  F extends StateMatchboxFactory<any>,
  Delim extends string = "."
> = F extends StateMatchboxFactory<infer C>
  ? (
      // Direct state keys that are not submachines
      | (HasMachineProperty<F[keyof C & string]> extends false ? keyof C & string : never)
      // Nested state keys for submachines (Parent.Child format)
      | `${Extract<keyof C, string>}${Delim}${string}`
    )
  : never;

// Create flattened state specs from a factory
export type FlattenedFactoryStateSpecs<
  F extends StateMatchboxFactory<any>,
  Delim extends string = "."
> = {
  // For keys without a delimiter (direct states)
  [K in Extract<FlattenFactoryStateKeys<F>, keyof F>]: F[K];
} & {
  // For keys with a delimiter (nested states)
  [K in Exclude<FlattenFactoryStateKeys<F>, keyof F>]: 
    K extends `${infer Parent}${Delim}${infer Child}`
      ? Parent extends keyof F
        ? ExtractMachineFromFactory<F[Parent]> extends MachineDefinition<infer SF, any, any>
          ? Child extends keyof SF
            ? SF[Child]
            : any
          : any
        : any
      : any;
};

// Create flattened factory from a factory
export type FlattenedStateMatchboxFactory<F extends StateMatchboxFactory<any>> =
  StateMatchboxFactory<FlattenedFactoryStateSpecs<F>>;

// Flatten transitions to use flattened state keys - this is for type compatibility only
export type FlattenedFactoryTransitions<
  F extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<F>,
  Delim extends string = "."
> = {
  [K in string]?: Record<string, FlattenFactoryStateKeys<F> | ((...args: any[]) => any)>;
};


// Simplified flattened types for internal use
export type FlattenedStates<S = any> = StateMatchboxFactory<{
  [K: string]: S;
}>;

export type FlattenedTransitions<E extends string = string, To = any> = {
  [K: string]: {
    [Event in E]: To;
  };
};



export type FlattenOptions = {
  delimiter?: string;
};

// Flattening internals types
export type FlatBuild = {
  states: Record<string, any>;
  transitions: Record<string, Record<string, string | ((...a: any[]) => any)>>;
  initial: string;
};
