import { defineStates } from "./define-states";
import type { StateMatchboxFactory } from "./state-types";
import type {
  FactoryMachineTransitions,
} from "./factory-machine-types";
import type { KeysWithZeroRequiredArgs } from "./utility-types";
import { createMachine } from "./factory-machine";
import type {
  MachineDefinition,
} from "./definition-types";

export function defineMachine<
  S extends Record<string, any> | StateMatchboxFactory<any>,
  T,
  I extends string
>(states: S, transitions: T, initial: I) {
  // If states is already a factory, use it directly; otherwise normalize
  const factory = isStatesFactory(states) ? states : normalizeStates(states).factory;
  const def = {
    states: factory,
    transitions,
    initial,
  };

  // Also return a factory function with .def attached for convenience
  const createMachineFn = () => createMachineFrom(def as any);
  (createMachineFn as any).def = def;

  // Return definition object with factory attached
  return Object.assign(def, { factory: createMachineFn });
}

// Convenience: create an instance directly from a definition  
export function createMachineFrom<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>, 
  I extends KeysWithZeroRequiredArgs<SF>
>(def: MachineDefinition<SF, T, I>) {
  return createMachine(def.states, def.transitions, def.initial);
}

// Simple defineSubmachine for backward compatibility
// 
// ⚠️  EXPERIMENTAL: Part of the flattening API. See flattenMachineDefinition for details.
export function defineSubmachine<
  SS extends Record<string, any> | StateMatchboxFactory<any>,
  T extends Record<string, any>,
  I extends string
>(states: SS, transitions: T, initial: I): { machine: MachineDefinition<any, any, I> } {
  return { machine: defineMachine(states, transitions, initial) };
}

// --- helpers ---

function isStatesFactory(x: any): x is StateMatchboxFactory<any> {
  return typeof x === "object" && x !== null && Object.values(x).every((v) => typeof v === "function");
}

function isImplicitSubmachineObject(v: any): v is { states: any; transitions: any; initial: any } {
  return v && typeof v === "object" && "states" in v && "transitions" in v && "initial" in v;
}

function normalizeStates<
  SS extends Record<string, any> | StateMatchboxFactory<any>,
>(
  input: SS
): SS extends StateMatchboxFactory<infer R>
  ? { factory: StateMatchboxFactory<R>; raw: R }
  : { factory: StateMatchboxFactory<SS>; raw: SS } {
  if (isStatesFactory(input)) {
    // We cannot recover raw; assume keys align 1:1 and synthesize a raw with `undefined` placeholders
    const raw = Object.fromEntries(Object.keys(input).map((k) => [k, undefined])) as any;
    return { factory: input as any, raw } as any;
  }
  // Treat as shorthand object; unwrap implicit submachine objects to explicit machine property
  const raw = Object.fromEntries(
    Object.entries(input ?? {}).map(([k, v]) => {
      if (isImplicitSubmachineObject(v)) {
        // Use defineSubmachine to create machine property
        return [k, defineSubmachine(v.states as any, v.transitions as any, v.initial as any)];
      }
      return [k, v];
    })
  ) as any;
  const factory = defineStates(raw) as any;
  return { factory, raw } as any;
}
