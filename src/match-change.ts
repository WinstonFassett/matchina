import { getFilter, matchKey } from "./match-filters";
import { HasFilterValues } from "./match-filter-types";
import { StateChangeEvent, ChangeEventKeyFilter } from "./match-change-types";

/**
 * Checks if a state change event matches the given type, from, and to keys.
 * Accepts either a tuple of [type, from, to] or a filter object.
 * Returns true if all specified keys match the event's properties.
 *
 * @template E - State change event type
 * @template Type - Event type key
 * @template From - From state key
 * @template To - To state key
 * @param changeEvent - The event to test.
 * @param rest - Tuple or filter object specifying type, from, and to keys.
 * @returns True if the event matches all filter criteria.
 *
 * Usage:
 * ```ts
 * matchChange(event, "reject", "Pending", "Rejected");
 * matchChange(event, { type: "resolve", from: "Pending", to: "Resolved" });
 * ```
 */
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
