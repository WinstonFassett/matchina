export function match<
  C extends MatchCases<any, A, Exhaustive>,
  A,
  Exhaustive extends boolean = true,
>(exhaustive = true, casesObj: C, key: string, ...params: any[]): A {
  const handler = (casesObj as any)[key];
  if (handler) {
    return handler(...params) as A;
  } else if (casesObj._) {
    return (casesObj._ as any)(...params) as A;
  } else if (exhaustive) {
    throw new Error(`Match did not handle key: '${key}'`);
  } else {
    return undefined as any;
  }
}

export type MatchCases<
  Record,
  A,
  Exhaustive extends boolean = true,
> = Exhaustive extends true
  ? (Cases<Record, A> & { _?: never }) | PartialCases<Record, A>
  : AnyCases<Record, A>;

export type Cases<Record, A> = {
  [T in keyof Record]: (value: Record[T]) => A;
};
type PartialCases<Record, A> = Partial<Cases<Record, A>> & {
  _: (variant: Record[keyof Record]) => A;
};
type AnyCases<Record, A> = Partial<
  Cases<Record, A> & {
    _: (variant: Record[keyof Record]) => A;
  }
>;

export interface MatchInvocation<Specs extends FuncRecord> {
  <A, Exhaustive extends boolean = true>(
    cases: MatchInvocationCases<Specs, A, Exhaustive>,
    exhaustive?: Exhaustive,
  ): A;
}

export type MatchInvocationCases<
  R extends FuncRecord,
  A,
  Exhaustive extends boolean = true,
> = Exhaustive extends true
  ? (InvocationCases<R, A> & { _?: never }) | PartialInvocationCases<R, A>
  : AnyInvocationCases<R, A>;

type InvocationCases<R extends FuncRecord, A> = {
  [T in keyof R]: (...params: Parameters<R[T]>) => A;
};
type PartialInvocationCases<R extends FuncRecord, A> = Partial<
  InvocationCases<R, A>
> & {
  _: (...params: Parameters<R[keyof R]>) => A;
};
type AnyInvocationCases<R extends FuncRecord, A> = Partial<
  InvocationCases<R, A> & {
    _: (...params: Parameters<R[keyof R]>) => A;
  }
>;

export type FuncRecord = Record<string, (...args: any[]) => any>;
