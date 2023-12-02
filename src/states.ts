import { matchboxFactory, UnionSpec, MemberExtensions } from "./matchbox";

export type FactoryState<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MemberExtensions<Specs, "key">;

export type States<Specs extends UnionSpec> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => FactoryState<Tag, Specs>
  : () => FactoryState<Tag, Specs>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}
