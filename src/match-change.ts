import { getFilter, matchKey } from "./match-filters";
import { HasFilterValues } from "./match-filter-types";
import { StateChangeEvent, ChangeEventKeyFilter } from "./match-change-types";

export function matchChange<
  E extends StateChangeEvent,
  Type extends
    ChangeEventKeyFilter<E>["type"] = ChangeEventKeyFilter<E>["type"],
  From extends
    ChangeEventKeyFilter<E>["from"] = ChangeEventKeyFilter<E>["from"],
  To extends ChangeEventKeyFilter<E>["to"] = ChangeEventKeyFilter<E>["to"],
>(
  changeEvent: E,
  // { type, from, to }: F,
  ...rest:
    | [type?: Type, from?: From, to?: To]
    | [filter: ChangeEventKeyFilter<E> & { type?: Type; from?: From; to?: To }]
): changeEvent is E &
  HasFilterValues<
    E,
    {
      type: Type;
      to: { key: To };
      from: { key: From };
    }
  > {
  const [type, from, to] = getFilter(rest);
  return (
    matchKey(to, changeEvent?.to?.key) &&
    matchKey(type, changeEvent?.type) &&
    matchKey(from, changeEvent?.from?.key)
  );
}
