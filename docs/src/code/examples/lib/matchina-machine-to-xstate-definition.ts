import type { FactoryMachine, StateMatchboxFactory } from "matchina";
import { getStateValues, resolveState } from "./state-utils";

function getChildMachine(state: any): FactoryMachine<any> | undefined {
  return state?.data?.machine || state?.machine;
}

function isStateFinal(state: any): boolean {
  return !!state?.data?.final;
}
export function getXStateDefinition<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F, parentKey?: string) {
  type StateStack = { key: string; fullKey: string }[];

  function buildDefinition(
    machine: FactoryMachine<any>,
    parentKey: string | undefined,
    stack: StateStack
  ) {
    const initialState = machine.getState();
    const declaredInitial = (machine as any).initialKey ?? initialState.key;
    const definition = {
      initial: declaredInitial,
      states: {} as Record<string, any>,
    };

    Object.entries(machine.states).forEach(([key, state]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      console.log('state', key, {fullKey, parentKey});
      definition.states[key] = { key, fullKey, on: {} };
    });

    Object.entries(machine.transitions).forEach(([fromKey, events]) => {
      Object.entries(events as object).forEach(([event, entry]) => {
        const resolved = resolveState(machine.states, fromKey, entry);
        definition.states[fromKey].on[event] = resolved.key;
      });
    });

    // Check for nested machine in the initial state
    try {
      const currentState = initialState;
      if (currentState?.data?.machine) {
        const childMachine = currentState.data.machine;
        if (
          childMachine &&
          typeof childMachine.getState === "function" &&
          childMachine.transitions
        ) {
          const childFullKey = parentKey
            ? `${parentKey}.${currentState.key}`
            : currentState.key;
          console.log('child full key', childFullKey);
          const childStack = [...stack, { key: currentState.key, fullKey: childFullKey }];
          const childDefinition = buildDefinition(
            childMachine,
            childFullKey,
            childStack
          );
          if (!definition.states[currentState.key]) {
            definition.states[currentState.key] = { on: {} };
          }
          const hasDeclaredChildInitial =
            (childMachine as any)?.initialKey !== undefined;
          if (hasDeclaredChildInitial) {
            definition.states[currentState.key].initial = (childMachine as any).initialKey;
          }
          definition.states[currentState.key].states = childDefinition.states;
          definition.states[currentState.key].stack = childStack;
        }
      }
    } catch (e) {
      // Don't break if nested machine inspection fails
    }

    // Attach stack to top-level states
    Object.values(definition.states).forEach((state: any) => {
      if (!state.stack) {
        state.stack = [...stack, { key: state.key, fullKey: state.fullKey }];
      }
    });
    console.log('definition', definition);
    return definition;
  }

  return buildDefinition(machine, parentKey, []);
}
