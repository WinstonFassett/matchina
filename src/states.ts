import { unionize, UnionDataFactory, UnionFactory } from "./unionize";

export type StateCreators<DataCreators extends UnionDataFactory> = UnionFactory<
  DataCreators,
  "state"
>;

export type UnionizedStates<DataCreators extends UnionDataFactory> =
  UnionFactory<DataCreators, "state">;

export function createStates<T extends UnionDataFactory>(config: T) {
  return unionize(config, "state");
}
