import { unionize, UnionConfig, UnionFactory } from "./unionize";

export type StatesFactory<StatesConfig extends UnionConfig> = UnionFactory<
  StatesConfig,
  "state"
>;
export function createStates<StatesConfig extends UnionConfig>(
  config: StatesConfig,
) {
  return unionize(config, "state");
}
