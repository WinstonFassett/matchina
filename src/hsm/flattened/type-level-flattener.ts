/**
 * Type-level utilities for computing flattened HSM types without losing type information.
 * 
 * This module provides compile-time type computation that converts hierarchical state configs
 * to flattened configs while preserving all type information.
 */

import { DeclarativeStateConfig } from "./types";
import { StateMatchboxFactory } from "../../state-types";

/**
 * Type-level path builder for hierarchical states
 * Builds dot-notation paths like "Payment.MethodEntry"
 */
type BuildPath<Prefix extends string, Key extends string> = 
  Prefix extends "" 
    ? Key 
    : `${Prefix}.${Key}`;

/**
 * Recursively flattens state configuration types
 * Transforms: { Payment: { states: { MethodEntry: {...} } } }
 * To: { "Payment.MethodEntry": {...} }
 */
export type FlattenStates<
  Config extends Record<string, DeclarativeStateConfig>,
  Prefix extends string = ""
> = {
  [Key in keyof Config]: BuildPath<Prefix, Key & string> extends infer Path
    ? Path extends string
      ? Config[Key] extends DeclarativeStateConfig<any, any>
        ? Config[Key]["states"] extends Record<string, DeclarativeStateConfig<any, any>>
          ? // Parent state with children - don't include parent itself, only children
            FlattenStates<Config[Key]["states"], BuildPath<Prefix, Key & string>>
          : // Leaf state - include it
            Path extends string
              ? { [K in Path]: Config[Key] }
              : {}
        : {}
      : {}
    : {}
}[keyof Config] extends infer Mapped
  ? Mapped extends Record<string, any>
    ? Mapped
    : {}
  : {};

/**
 * Type-level transition resolution for hierarchical states
 * Resolves relative references to fully qualified paths
 */
export type ResolveTransitionTarget<
  Target extends string,
  CurrentState extends string,
  Config extends Record<string, DeclarativeStateConfig>
> = Target extends `^${infer Rest}`
  ? Rest // Parent escape - strip the ^ and resolve to parent level
  : Target extends `${string}.${string}`
    ? Target // Already fully qualified
    : Target extends keyof Config
      ? Config[Target]["states"] extends Record<string, DeclarativeStateConfig<any, any>>
        ? Config[Target]["initial"] extends string
          ? `${Target}.${Config[Target]["initial"]}` // Parent state - resolve to initial child
          : Target
        : Target // Leaf state - keep as is
      : Target; // Unknown - keep as is

/**
 * Type-level transition flattening with proper resolution
 */
export type FlattenTransitions<
  Config extends Record<string, DeclarativeStateConfig>,
  Prefix extends string = "",
  ParentKey extends string = ""
> = {
  [StateKey in keyof Config]: BuildPath<Prefix, StateKey & string> extends infer FullKey
    ? FullKey extends string
      ? Config[StateKey] extends DeclarativeStateConfig<any, any>
        ? Config[StateKey]["on"] extends Record<string, string | ((...params: any[]) => any)>
          ? {
              [K in FullKey]: {
                [EventKey in keyof Config[StateKey]["on"]]: Config[StateKey]["on"][EventKey] extends (...params: any[]) => any
                  ? Config[StateKey]["on"][EventKey] // Function - pass through
                  : Config[StateKey]["on"][EventKey] extends string
                    ? ResolveTransitionTarget<Config[StateKey]["on"][EventKey], FullKey, Config>
                    : Config[StateKey]["on"][EventKey];
              };
            }
          : {} // No transitions
        : {}
      : {}
    : {}
}[keyof Config] extends infer Mapped
  ? Mapped extends Record<string, any>
    ? MergeTransitionMaps<Mapped>
    : {}
  : {};

/**
 * Merges transition maps from recursive flattening
 */
type MergeTransitionMaps<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? T[K]
    : never;
} & {
  [K in keyof T as T[K] extends Record<string, any> ? never : K]: never;
};

/**
 * Extract state data types from flattened configuration
 */
export type ExtractStateDataTypes<
  FlatStates extends Record<string, DeclarativeStateConfig<any, any>>
> = {
  [StateKey in keyof FlatStates]: FlatStates[StateKey] extends DeclarativeStateConfig<infer TData, any>
    ? FlatStates[StateKey]["final"] extends true
      ? TData & { final: true }
      : TData
    : never;
};

/**
 * Create a properly typed state factory from flattened states
 */
export type CreateStateFactory<FlatStates extends Record<string, DeclarativeStateConfig<any, any>>> = {
  [StateKey in keyof FlatStates]: FlatStates[StateKey] extends DeclarativeStateConfig<any, infer TParams>
    ? TParams extends readonly any[]
      ? (...params: TParams) => ExtractStateDataTypes<FlatStates>[StateKey]
      : () => ExtractStateDataTypes<FlatStates>[StateKey]
    : never;
};

/**
 * Extract transition parameter types from flattened transitions
 */
export type ExtractTransitionParams<
  FlatTransitions extends Record<string, Record<string, any>>
> = {
  [StateKey in keyof FlatTransitions]: {
    [EventKey in keyof FlatTransitions[StateKey]]: FlatTransitions[StateKey][EventKey] extends (...params: infer P) => any
      ? P
      : [];
  };
};

/**
 * Complete flattened machine type computation
 */
export type FlattenedMachineTypes<
  Config extends Record<string, DeclarativeStateConfig>
> = {
  states: FlattenStates<Config>;
  transitions: FlattenTransitions<Config>;
  stateFactory: CreateStateFactory<FlattenStates<Config>>;
  transitionParams: ExtractTransitionParams<FlattenTransitions<Config>>;
};
