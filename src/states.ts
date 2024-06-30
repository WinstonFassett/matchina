import { MemberExtensionsFromDataSpecs, SpecRecord, matchboxFactory } from "./matchbox";

export type StateMatchbox<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MemberExtensionsFromDataSpecs<Specs, "key">;

export type States<Specs extends SpecRecord> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => StateMatchbox<Tag, Specs>
  : () => StateMatchbox<Tag, Specs>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

export function defineStates<Config extends SpecRecord>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}
