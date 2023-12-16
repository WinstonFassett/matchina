import { AnyFactoryMachineEvent, FactoryEventResolved } from "./factory-machine";
import { FuncRecord, MatchInvocationCases } from "./match";
import { StateMachineEvent } from "./state-machine";

export function matchEvent<
  R extends FuncRecord,
  E extends AnyFactoryMachineEvent<any>,
  A,
  Exhaustive extends boolean = false
>(
  exhaustive = false,
  casesObj: MatchInvocationCases<
  R,
  A,
  Exhaustive>,
  ev: E
  ): any {
  const { type, params } = ev
  const handler = (casesObj as any)[type];
  if (handler) {
    return handler(...params);
  } else if (casesObj._) {
    return casesObj._(...params as any);
  } else if (exhaustive) {
    throw new Error(
      `Match did not handle key: '${type}'`,
    );
  }
}


interface Match<Specs> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchCases<MemberData<Specs>, MemberData<Specs>, A, Exhaustive>,
    exhaustive?: Exhaustive,
  ): A;
}

export type MemberData<Specs> = {
  [T in keyof Specs]: Specs[T] extends (...args: any[]) => any
    ? ReturnType<Specs[T]>
    : Specs[T];
};

export type Cases<Record, A> = { [T in keyof Record]: (value: Record[T]) => A };

type PartialCases<Record, A, Union> = Partial<Cases<Record, A>> & {
  _: (variant: Union) => A;
};

type AnyCases<Record, A, Union> = Partial<
  Cases<Record, A> & {
    _: (variant: Union) => A;
  }
>;

export type MatchCases<
  Record,
  Union,
  A,
  Exhaustive extends boolean = true,
> = Exhaustive extends true
  ? (Cases<Record, A> & { _?: never }) | PartialCases<Record, A, Union>
  : AnyCases<Record, A, Union>;