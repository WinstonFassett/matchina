import {
  matchboxFactory,
} from "./matchbox-factory";
import { TaggedTypes } from "./matchbox-factory-types";
import { StateMatchbox, States } from "./state-types";

export function defineStates<Config extends TaggedTypes>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}

export { StateMatchbox, States };

