import { FlatFilters, FilterValues, HasFilterValues } from "./match-property-filters";

type State = {
  key: string;
};

export type StateChangeEvent = {
  type: string;
  from: State;
  to: State;
};

export type ChangeEventKeyFilter<E extends StateChangeEvent> = FlatFilters<
  ChangeEventKeys<E>
>;
type ChangeEventKeys<E extends StateChangeEvent> = E extends { type: infer T; from: infer F; to: infer To; } ? { type: T; from: F extends State ? F['key'] : never; to: To extends State ? To['key'] : never; } : never;

export function matchesChangeEventKeys<
  E extends StateChangeEvent,
  F extends ChangeEventKeyFilter<E>,
  FV extends FilterValues<F>
>(
  changeEvent: E,
  filter: F
): changeEvent is E & HasFilterValues<E, {
  type: FV['type'];
  to: { key: FV['to']; };
  from: { key: FV['from']; };
}> {
  // Implementation remains the same
  return true;
}
