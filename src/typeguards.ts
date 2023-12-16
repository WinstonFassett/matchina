import { FlatFilters, HasFilterValues } from "./match-property-filters";



export type KeyedChangeEvent<
  Type extends string = string,
  FromKey extends string = string,
  ToKey extends string = FromKey,
> = {
  type: Type;
  from: { key: FromKey };
  to: { key: ToKey };
};


export type KeyedChangeEventFilter<E extends KeyedChangeEvent> = Filters1<{
  type: E["type"];
  to: E["to"]["key"];
  from: E["from"]["key"];
}>;

export type ChangeEventKeys<E extends KeyedChangeEvent> = {
  type: E["type"];
  to: E["to"]["key"];
  from: E["from"]["key"];
};


export type KeyedChangeEventFromFilter<
  E extends KeyedChangeEvent,
  F extends FlatFilters<ChangeEventKeys<E>>,
  // FV extends FilterValues<F> = FilterValues<F>,
  FV extends HasFilterValues<E, F> = HasFilterValues<E, F>
> = 
{
  type: FV['type'];
  from: { key: FV['from'] };
  to: { key: FV['to'] };
}

// export type FactoryChangeEventFilter<
//   E extends AnyFactoryMachineEvent<any>,
//   FromKey extends string &
//     AnyFactoryMachineTransition<M>["from"]["key"] = string &
//     AnyFactoryMachineTransition<E["machine"]>["from"]["key"],
//   Type extends string & AnyFactoryMachineTransition<M>["type"] = string &
//     AnyFactoryMachineTransition<E["machine"]>["type"],
//   ToKey extends string & AnyFactoryMachineTransition<M>["to"]["key"] = string &
//     AnyFactoryMachineTransition<E["machine"]>["to"]["key"],
//   M extends E["machine"] = E["machine"],
// > = {
//   from?: FromKey | FromKey[];
//   type?: Type | Type[];
//   to?: ToKey | ToKey[];
// };

// export type FactoryChangeEventFromFilter<
//   E extends AnyFactoryMachineEvent<any>,
//   F extends FactoryChangeEventFilter<E>,
//   FV extends FilterValues<F> = FilterValues<F>,
// > = AnyFactoryMachineTransition<
//   E["machine"],
//   FV["from"] extends string ? FV["from"] : string,
//   FV["type"] extends string ? FV["type"] : string,
//   FV["to"] extends string ? FV["to"] : string
// >;



// export function isFactoryMachineChangeFromTypeTo<
//   E extends AnyFactoryMachineEvent<any>,
//   FromKey extends string & E["from"]["key"],
//   Type extends string &
//     E["type"] &
//     AnyFactoryMachineTransition<E["machine"], FromKey>["type"],
//   ToKey extends string &
//     E["to"]["key"] &
//     AnyFactoryMachineTransition<E["machine"], FromKey, Type>["to"]["key"],
// >(
//   event: E,
//   from?: FromKey | FromKey[],
//   type?: Type | Type[],
//   to?: ToKey | ToKey[],
// ): event is E &
//   FactoryChangeEventFromFilter<E, { from: FromKey; type: Type; to: ToKey }> {
//   const subject = event as any;
//   return (
//     matchKey(to, subject?.to?.key) &&
//     matchKey(type, subject?.type) &&
//     matchKey(from, subject?.from?.key)
//   );
// }

// export function isChangeTypeToFrom<
//   E,
//   Type extends string,
//   ToKey extends string,
//   FromKey extends string,
// >(
//   event: E,
//   type?: Type | Type[],
//   to?: ToKey | ToKey[],
//   from?: FromKey | FromKey[],
// ): event is E & KeyedChangeEvent<Type, FromKey, ToKey> {
//   const subject = event as any;
//   return (
//     matchKey(to, subject?.to?.key) &&
//     matchKey(type, subject?.type) &&
//     matchKey(from, subject?.from?.key)
//   );
// }
// export function asChangeTypeToFrom<
//   E,
//   Type extends string,
//   ToKey extends string,
//   FromKey extends string,
// >(
//   event: E,
//   type?: Type | Type[],
//   to?: ToKey | ToKey[],
//   from?: FromKey | FromKey[],
// ): E & KeyedChangeEvent<Type, FromKey, ToKey> {
//   if (isChangeTypeToFrom(event, type, to, from)) {
//     return event;
//   }
//   throw new Error("not a match");
// }
export type Filters1<T> = object & {
  [K in keyof T]?: T[K] | T[K][];
};

export type FilterValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};
