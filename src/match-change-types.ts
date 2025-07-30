import { FlatFilters } from "./match-filter-types";
import { KeyedState } from "./state-keyed";

export type StateChangeEvent = {
  type: string;
  from: KeyedState;
  to: KeyedState;
};

export type ChangeEventKeyFilter<E extends StateChangeEvent> = FlatFilters<
  ChangeEventKeys<E>
>;

export type ChangeEventKeys<E extends StateChangeEvent> = E extends {
  type: infer T;
  from: infer F;
  to: infer To;
}
  ? {
      type: T;
      from: F extends KeyedState ? F["key"] : never;
      to: To extends KeyedState ? To["key"] : never;
    }
  : never;
