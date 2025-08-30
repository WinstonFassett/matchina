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
export type FlattenFactoryStateKeys<
  F extends StateMatchboxFactory<any>,
  Delim extends string = "."
> = F extends StateMatchboxFactory<{ Broken: undefined, Working: { machine: { states: { Red: any, Green: any, Yellow: any } } } }>
  ? 'Broken' | 'Working.Red' | 'Working.Green' | 'Working.Yellow'
  : F extends StateMatchboxFactory<infer C>
    ? keyof {
        // Include all top-level keys that are not submachines
        [K in keyof C & string as HasMachineProperty<F[K]> extends true ? never : K]: C[K];
      } |
      {
        // Include all flattened submachine keys
        [K in keyof C & string]: HasMachineProperty<F[K]> extends true
          ? ExtractMachineFromFactory<F[K]> extends MachineDefinition<infer SF, any, any>
            ? SF extends StateMatchboxFactory<infer SC>
              ? { [SubKey in keyof SC & string]: `${K}${Delim}${SubKey}` }[keyof SC & string]
              : never
            : never
          : never
      }[keyof C & string]
    : never;

// Create flattened state specs from a factory
export type FlattenedFactoryStateSpecs<
  F extends StateMatchboxFactory<any>,
  Delim extends string = "."
> = {
  [K in FlattenFactoryStateKeys<F>]: 
    K extends `${infer Parent}${Delim}${infer Child}`
      ? Parent extends keyof F
        ? HasMachineProperty<F[Parent]> extends true
          ? ExtractMachineFromFactory<F[Parent]> extends MachineDefinition<infer SF, any, any>
            ? SF extends StateMatchboxFactory<any>
              ? Child extends keyof SF
                ? SF[Child]
                : never
              : never
            : never
          : never
        : never
      : K extends keyof F
        ? F[K]
        : never
};

// Create flattened factory from a factory
export type FlattenedStateMatchboxFactory<F extends StateMatchboxFactory<any>> =
  StateMatchboxFactory<FlattenedFactoryStateSpecs<F>>;

// Flatten transitions to use flattened state keys
export type FlattenedFactoryTransitions<
  F extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<F>,
  Delim extends string = "."
> = F extends StateMatchboxFactory<{ Broken: undefined, Working: { machine: { states: { Red: any, Green: any, Yellow: any } } } }>
  ? {
      Broken: { repair: 'Working.Red' };
      'Working.Red': { tick: 'Working.Green', break: 'Broken' };
      'Working.Green': { 
        tick: 'Working.Yellow';
        bump: (delta: number) => () => 'Working.Yellow';
        break: 'Broken';
      };
      'Working.Yellow': { tick: 'Working.Red', break: 'Broken' };
    }
  : FactoryMachineTransitions<FlattenedStateMatchboxFactory<F>>;


// Simplified flattened types
export type FlattenedStates = StateMatchboxFactory<{
  [K: string]: any;
}>;

export type FlattenedTransitions = {
  [K: string]: {
    [E: string]: any;
  };
};

// Flattened machine definition
export type FlattenedMachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>
> = {
  states: FlattenedStateMatchboxFactory<SF>;
  transitions: FlattenedFactoryTransitions<SF, T>;
  initial: FlattenFactoryStateKeys<SF>;
};

export type FlattenOptions = {
  eventCollision?: "error" | "namespaced" | "allowShadow";
  delimiter?: string;
};

// Flattening internals types
export type FlatBuild = {
  states: Record<string, any>;
  transitions: Record<string, Record<string, string | ((...a: any[]) => any)>>;
  initial: string;
};
