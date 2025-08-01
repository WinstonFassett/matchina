import { MatchboxMemberApi, TaggedTypes } from "./matchbox-factory-types";

/**
 * @interface
 * MatchboxMemberApi defines the API for a member of a Matchbox, providing access to its key and data.
 * This is used to ensure type safety and consistency across Matchbox members.
 *
 * @template Specs - The specifications defining the structure of the Matchbox.
 * @template Tag - The key type for the member.
 */
export type StateMatchbox<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MatchboxMemberApi<Specs, "key">;

type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer _R
  ? (...args: P) => StateMatchbox<Tag, Specs>
  : () => StateMatchbox<Tag, Specs>;
type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

/**
 * Utility type for
 * 1) extracting the returned state types from a keyed state factory.
 * 2) extracting the returned payloads from DataSpecs
 * This is a type-level helper for state machine construction: given a tagged type spec (mapping state keys to factory functions or values),
 * `States<Specs>` produces an object type where each key maps to its corresponding state creator function.
 *
 * Use this to generate a set of state constructors for a state machine, ensuring type safety and consistency.
 *
 * Example:
 * ```ts
 * type MySpecs = {
 *   Idle: () => { ready: boolean };
 *   Active: (user: string) => { user: string };
 * };
 *
 * type MyStates = StateMatchboxFactory<MySpecs>;
 * // MyStates = {
 * //   Idle: () => StateMatchbox<'Idle', MySpecs>;
 * //   Active: (user: string) => StateMatchbox<'Active', MySpecs>;
 * // }
 * ```
 */
export type StateMatchboxFactory<Specs extends TaggedTypes> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};
