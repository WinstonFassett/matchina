import { matchChange, matchFilters } from "matchina";

// USAGE CODE BELOW THIS LINE
type PromiseStates = {
  Idle: { key: "Idle" };
  Pending: { key: "Pending"; args: any[] };
  Rejected: { key: "Rejected"; error: Error };
  Resolved: { key: "Resolved"; data: any };
};
type PromiseTransitions_FYI = {
  Idle: { execute: "Pending" };
  Pending: {
    resolve: "Resolved";
    reject: "Rejected";
  };
};
type PromiseEvent =
  | {
      type: "execute";
      from: PromiseStates["Idle"];
      to: PromiseStates["Pending"];
    }
  | {
      type: "resolve";
      from: PromiseStates["Pending"];
      to: PromiseStates["Resolved"];
    }
  | {
      type: "reject";
      from: PromiseStates["Pending"];
      to: PromiseStates["Rejected"];
    };
const e = {} as PromiseEvent;
// filter autocomplete is correct when beginning with type, but not when ending with type
// correctly constrains e to only possible values, with const
if (
  matchFilters(e, {
    type: "execute",
    to: { key: "Pending", args: [] as any },
    from: { key: "Idle" },
  } as const)
) {
  e.type = "execute";
  e.from.key = "Idle";
  e.to.key = "Pending";
}
// filter autocomplete does not constrain type by state keys
// but does autocomplete states constrained by type
// does correctly constrain e to only possible values, with const
if (
  matchFilters(e, {
    from: { key: "Idle" },
    type: "execute",
    to: { key: "Pending", args: [] as any }, // this autocompletes to being only pending
  } as const)
) {
  e.type = "execute";
  e.from.key = "Idle";
  e.to.key = "Pending";
}
// filter autocomplete does not constrain other values by specified values
// constrains e correctly with const, but const won't allow empty args
if (
  matchFilters(e, {
    from: { key: "Pending", args: [] as any },
    to: { key: "Rejected", error: new Error("nope") },
    // type: 'resolve'
    // to: { key: 'Pending', args: []}
  } as const)
) {
  e.type = "reject";
}
if (
  matchFilters(e, {
    // to: { key: 'Pending' } // invalid for some reason
    // to: { key: ['Rejected'], error: new Error('')},
    to: { key: "Resolved", data: "" },
    // type: 'execute'
  } as const)
) {
  // e.type = 'execute'
  e.type = "resolve";
}
// constrains e to only possible values
// but filter autocomplete is not correct, does not constrain other values by specified values,
// and allows conflicting filter values which then mess up the constraints on e
if (
  matchChange(e, {
    type: "reject",
    from: "Pending",
  } as const)
) {
  e.from.key = "Pending";
  e.type = "reject";
  e.to.key = "Rejected";
}
// filter autocomplete is not correct, does not constrain other values by specified values
// not constraining e
if (
  matchChange(e, {
    type: "execute",
    to: "Pending",
  } as const)
) {
  e.type = "execute";
}
if (
  matchChange(e, {
    // from: ['Pending', 'Idle'],
    to: "Pending",
  } as const)
) {
  e.type = "execute"; // invalid
}
