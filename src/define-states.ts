import {
  matchboxFactory,
} from "./matchbox-factory";
import { TaggedTypes } from "./matchbox-factory-types";
import { MatchboxMemberApi } from "./matchbox-factory-types";

export type StateMatchbox<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MatchboxMemberApi<Specs, "key">;

export type States<Specs extends TaggedTypes> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer _R
  ? (...args: P) => StateMatchbox<Tag, Specs>
  : () => StateMatchbox<Tag, Specs>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

export function defineStates<Config extends TaggedTypes>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}
