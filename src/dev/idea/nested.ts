type LeafState = {
  state: string;
  data?: any;
  parent?: StateType;
  machine?: never;
};

type MachineState = LeafState & {
  machine: any;
};

type StateType = LeafState | MachineState;

export function isLeafState(state: StateType): state is LeafState {
  return !("machine" in state);
}
type StateTuple = [string, ...any[]];

export function constructState(states: any, path: StateTuple[]): StateType {
  let currentStateContext = states;
  let rootState: StateType | undefined;
  let parentState: StateType | undefined;

  for (const [stateKey, ...args] of path) {
    if (!currentStateContext[stateKey]) {
      throw new Error(`State '${stateKey}' does not exist.`);
    }

    const newState = currentStateContext[stateKey](...args) as StateType;

    // Set the root state if this is our first iteration
    if (!rootState) {
      rootState = newState;
    }

    // Setting parent state reference
    newState.parent = parentState;

    // If this state has a machine (sub-machine), dive into it for the next tuple
    if (newState.machine && newState.machine.config.states) {
      parentState = newState;
      currentStateContext = newState.machine.config.states;
    }
  }

  return rootState as StateType;
}
