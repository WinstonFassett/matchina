/**
 * Type extraction utilities for createHSM
 * These types extract the proper state factory and transition types from the declarative config
 */

import { DeclarativeStateConfig, DeclarativeFlatMachineConfig } from "./types";
import { StateMatchboxFactory } from "../../state-types";
import { FactoryMachineTransitions } from "../../factory-machine-types";

/**
 * Extract state factory types from hierarchical config
 * Maps hierarchical state definitions to flattened state factory types
 */
export type ExtractStateFactoryFromConfig<T extends DeclarativeFlatMachineConfig> = {
  [K in keyof T["states"]]: T["states"][K] extends DeclarativeStateConfig<any, infer P>
    ? T["states"][K]["data"] extends (...params: P) => any
      ? (...params: P) => any
      : () => any
    : () => any;
};

/**
 * Extract transition types from hierarchical config
 * Maps hierarchical transition definitions to flattened transition types
 */
export type ExtractTransitionsFromConfig<T extends DeclarativeFlatMachineConfig> = {
  [K in keyof T["states"]]: {
    [E in keyof T["states"][K]["on"]]: T["states"][K]["on"][E] extends (...params: infer P) => any
      ? (...params: P) => any
      : T["states"][K]["on"][E] extends string
        ? () => any
        : never;
  };
};

/**
 * Extract flattened transition types from hierarchical config
 * This handles the dot-notation flattening while preserving parameter types
 */
export type ExtractFlattenedTransitionsFromConfig<T extends DeclarativeFlatMachineConfig> = {
  // For each state in the config
  [StateKey in keyof T["states"]]: {
    // For each event in that state
    [EventKey in keyof T["states"][StateKey]["on"]]: T["states"][StateKey]["on"][EventKey] extends (...params: infer P) => any
      ? (...params: P) => any
      : T["states"][StateKey]["on"][EventKey] extends string
        ? () => any
        : never;
  } & {
    // Also include child state events (flattened)
    [ChildStateKey in T["states"][StateKey]["states"] extends Record<string, any> 
      ? keyof T["states"][StateKey]["states"] 
      : never]: {
      [ChildEventKey in T["states"][StateKey]["states"] extends Record<string, any> 
        ? keyof T["states"][StateKey]["states"][ChildStateKey]["on"] 
        : never]: T["states"][StateKey]["states"][ChildStateKey]["on"][ChildEventKey] extends (...params: infer P) => any
          ? (...params: P) => any
          : T["states"][StateKey]["states"][ChildStateKey]["on"][ChildEventKey] extends string
            ? () => any
            : never;
    };
  };
};

/**
 * Create a proper StateMatchboxFactory type from the config
 */
export type StateFactoryFromConfig<T extends DeclarativeFlatMachineConfig> = 
  StateMatchboxFactory<ExtractStateFactoryFromConfig<T>>;

/**
 * Create proper transition types from the config
 */
export type TransitionsFromConfig<T extends DeclarativeFlatMachineConfig> = 
  FactoryMachineTransitions<StateFactoryFromConfig<T>>;
