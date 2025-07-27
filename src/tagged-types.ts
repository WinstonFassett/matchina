/**
 * TypeDefinitions is a utility type for defining a record of tag-value pairs.
 * Used to specify the shape of the configuration for a Matchbox factory.
 *
 * @template T - The value type for each tag.
 */

export type TaggedTypes<T = any> = {
  [k: string]: T;
} & { _?: never; };
