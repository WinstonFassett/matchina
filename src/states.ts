import { matchboxFactory, UnionSpec, MemberExtensions } from "./matchbox";

export type State<Specs, Tag extends keyof Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MemberExtensions<Specs, "key", "data">;

export type States<Specs extends UnionSpec> = {
  [T in keyof Specs]: CreateState<Specs, T>;
};

type CreateState<Specs, Tag extends keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => State<Specs, Tag>
  : () => State<Specs, Tag>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}
