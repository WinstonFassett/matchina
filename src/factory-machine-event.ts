import { FactoryMachineEvent } from "./factory-machine-types";
import { match } from "./match-case";
import { MatchCases } from "./match-case-types";

export class FactoryMachineEventImpl<E extends FactoryMachineEvent<any>> {
  public type: E["type"];
  public from: E["from"];
  public to: E["to"];
  public params: E["params"];
  public machine?: E["machine"];

  constructor(
    type: E["type"],
    from: E["from"],
    to: E["to"],
    params: E["params"],
    machine?: E["machine"]
  ) {
    this.type = type;
    this.from = from;
    this.to = to;
    this.params = params;
    this.machine = machine;
  }

  match<
    A,
    C extends MatchCases<any, A, Exhaustive>,
    Exhaustive extends boolean = false,
  >(cases: MatchCases<C, A, Exhaustive>, exhaustive: Exhaustive) {
    return match<any, A, Exhaustive>(
      exhaustive,
      cases,
      this.type,
      ...this.params
    );
  }
}
