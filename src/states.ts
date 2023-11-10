import { matchboxFactory, UnionSpec, MemberExtensions } from "./matchbox";

export type StateFactory<Specs extends UnionSpec> =
  // StateCreators<Specs>;
  // type StateCreators<Specs> =
  {
    [T in keyof Specs]: StateCreate<Specs, T>;
  };
type TagProp = "key";
type DataProp = "data";

type StateCreate<Specs, Tag extends keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => State<Specs, Tag>
  : () // value?: Specs[Tag]
    => State<Specs, Tag>;

export type State<Specs, Tag extends keyof Specs> = ((Specs[Tag] extends (
  ...args: any[]
) => any
  ? { [_ in DataProp]: ReturnType<Specs[Tag]> }
  : { [_ in DataProp]: Specs[Tag] }) & { [_ in TagProp]: Tag }) &
  MemberExtensions<Specs, TagProp, DataProp>;

export function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as StateFactory<Config>;
}
