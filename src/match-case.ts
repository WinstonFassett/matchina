import { MatchCases } from "./match-case-types";

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


