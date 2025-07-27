import { FactoryMachineEvent } from "./factory-machine-types";
import { MatchCases, match } from "./match-case";

export class FactoryMachineEventImpl<E extends FactoryMachineEvent<any>> {
  constructor(
    public type: E["type"],
    public from: E["from"],
    public to: E["to"],
    public params: E["params"]
  ) { }

  match<A, C extends MatchCases<any, A, Exhaustive>, Exhaustive extends boolean = false>(cases: MatchCases<C, A, Exhaustive>, exhaustive: Exhaustive) {
    return match<any, A, Exhaustive>(exhaustive, cases, this.type, ...this.params);
  }
}
