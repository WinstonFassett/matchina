import { FlatFilters } from "./match-filter-types";
import { State } from "./state";


export type StateChangeEvent = {
  type: string;
  from: State;
  to: State;
};

export type ChangeEventKeyFilter<E extends StateChangeEvent> = FlatFilters<
  ChangeEventKeys<E>
>;

export type ChangeEventKeys<E extends StateChangeEvent> = E extends {
  type: infer T;
  from: infer F;
  to: infer To;
} ? {
  type: T;
  from: F extends State ? F["key"] : never;
  to: To extends State ? To["key"] : never;
} : never;
