import { matchboxFactory, UnionSpec, Member, MemberCreate } from "./matchbox";

export type StatesMatchboxFactory<Specs extends UnionSpec> =
  StateCreators<Specs>;

export type StateCreators<Specs> = {
  [T in keyof Specs]: MemberCreate<Specs, T, "key", "data">;
};

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as StatesMatchboxFactory<Config>;
}
