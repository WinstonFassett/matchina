import { matchboxFactory, UnionSpec, Member } from "./matchbox";

export type StatesMatchboxFactory<StatesConfig extends UnionSpec> =
  StateCreators<StatesConfig>;

export type StateCreators<Specs> = {
  [T in keyof Specs]: StateCreate<Specs, T, "key", "data">;
};

export type StateCreate<
  Specs,
  Tag extends keyof Specs,
  TagProp extends string,
  DataProp extends string,
> = Specs[Tag] extends (...args: infer P) => infer R
  ? (...args: P) => Member<Specs, Tag, TagProp, DataProp>
  : () // value?: Specs[Tag]
    => Member<Specs, Tag, TagProp, DataProp>;

// export type MatchboxFromStatesFactory<
//   States extends StatesMatchboxFactory<any>,
//   K extends keyof States = keyof States,
// > = MatchboxFromFactory<States, K>;

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as StatesMatchboxFactory<Config>;
}
