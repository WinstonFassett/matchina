import { MatchboxMemberApi, TaggedTypes } from "./matchbox-factory-types";


export type StateMatchbox<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MatchboxMemberApi<Specs, "key">;

export type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer _R ? (...args: P) => StateMatchbox<Tag, Specs> : () => StateMatchbox<Tag, Specs>;
type StateData<Spec> = Spec extends (...args: any[]) => any ? ReturnType<Spec> : Spec;export type States<Specs extends TaggedTypes> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

