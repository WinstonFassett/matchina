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

// State configuration that can be a leaf or have a submachine
export type StateConfig = any | { machine: MachineDefinition<any, any, any> };

// Precise type computation for flattened state keys
export type FlattenStateKeys<
  Raw extends Record<string, StateConfig>,
  Delim extends string = ".",
> = {
  [K in keyof Raw & string]: Raw[K] extends { machine: MachineDefinition<any, any, any> }
    ? `${K}${Delim}${keyof Raw[K]['machine']['states'] & string}`
    : K
}[keyof Raw & string];

// Precise flattened state specs
export type FlattenedStateSpecs<
  Raw extends Record<string, StateConfig>,
  Delim extends string = ".",
> = {
  [K in keyof Raw & string]: Raw[K] extends { machine: MachineDefinition<any, any, any> }
    ? { [SubK in keyof Raw[K]['machine']['states'] & string as `${K}${Delim}${SubK}`]: Raw[K]['machine']['states'][SubK] }
    : { [P in K]: Raw[K] }
}[keyof Raw & string];

// Precise flattened transitions - compatible with FactoryMachineTransitions
export type FlattenedTransitions<
  Raw extends Record<string, StateConfig>,
  TR extends Record<string, any>
> = Record<string, Record<string, string | ((...a: any[]) => any)>>;

// Precise flattened states factory
export type FlattenedStatesFactory<
  Raw extends Record<string, StateConfig>
> = StateMatchboxFactory<FlattenedStateSpecs<Raw>>;

// Precise return type for flattenMachineDefinition - simplified
export type FlattenedMachineDefinition<
  Raw extends Record<string, StateConfig>,
  TR extends Record<string, any>
> = MachineDefinition<
  FlattenedStatesFactory<Raw>,
  any,
  any
>;

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

// Collect event keys - simplified
export type _CollectEventKeys = string;
export type CollectEventKeys = string;

// Per-leaf event computation - simplified
export type EventsForLeaf = string;
