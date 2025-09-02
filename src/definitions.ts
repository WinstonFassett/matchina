import { defineStates } from "./define-states";
import type { StateMatchboxFactory } from "./state-types";
import type {
  FactoryMachineTransitions,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine-types";
import type { KeysWithZeroRequiredArgs } from "./utility-types";
import { createMachine } from "./factory-machine";
import type {
  MachineDefinition,
  FlattenedMachineDefinition,
  FlattenOptions,
  FlatBuild,
  FlattenedStateMatchboxFactory,
  FlattenedFactoryTransitions,
  FlattenFactoryStateKeys,
} from "./definition-types";

export function defineMachine<
  S extends Record<string, any> | StateMatchboxFactory<any>,
  T,
  I extends string
>(states: S, transitions: T, initial: I) {
  // If states is already a factory, use it directly; otherwise normalize
  const factory = isStatesFactory(states) ? states : normalizeStates(states).factory;
  return {
    states: factory,
    transitions,
    initial,
  };
}

// Convenience: create an instance directly from a definition  
export function createMachineFrom<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>, 
  I extends KeysWithZeroRequiredArgs<SF>
>(def: MachineDefinition<SF, T, I>) {
  return createMachine(def.states, def.transitions, def.initial);
}

// Convenience: create an instance from a flattened definition  
export function createMachineFromFlat<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>
>(def: FlattenedMachineDefinition<SF, T>) {
  // The flattened definition should already have the fully-qualified leaf state
  // like "Working.Red" as the initial value
  return createMachine(
    def.states as any, 
    def.transitions as any, 
    def.initial as any
  );
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

// ---- flattening internals ----

// Update isSubmachineMarker to check for machine property
function isSubmachineMarker(x: any): x is { machine: MachineDefinition<any, any, any> } | { data: { machine: MachineDefinition<any, any, any> } } {
  return x && typeof x === "object" && 
    ("machine" in x || (x.data && typeof x.data === "object" && "machine" in x.data));
}

function flattenFromRaw(
  rawStates: Record<string, any>,
  transitions: Record<string, Record<string, string | ((...a: any[]) => any)>>,
  initial: string,
  opts: Required<FlattenOptions>
): FlatBuild {
  const delimiter = opts.delimiter;

  // First, flatten each top-level state and gather metadata
  const flatStates: Record<string, any> = {};
  const flatTransitions: Record<string, Record<string, string | ((...a: any[]) => any)>> = {};
  const stateLeaves: Record<string, string[]> = {}; // topKey -> leaves
  const childInitialLeaf: Record<string, string | undefined> = {};

  const childFlatCache: Record<string, FlatBuild | null> = {};

  for (const [key, val] of Object.entries(rawStates)) {
    if (isSubmachineMarker(val)) {
      // Handle both direct machine property and machine in data
      const machine = 'machine' in val ? val.machine : val.data.machine;
      
      const child = flattenFromRaw(
        machine.states as any,
        machine.transitions as any,
        machine.initial as any,
        opts
      );
      childFlatCache[key] = child;
      stateLeaves[key] = Object.keys(child.states).map((c) => `${key}${delimiter}${c}`);
      childInitialLeaf[key] = `${key}${delimiter}${child.initial}`;
      // bring in child transitions, prefixed
      for (const [fromLeaf, events] of Object.entries(child.transitions)) {
        const prefFrom = `${key}${delimiter}${fromLeaf}`;
        for (const [ev, toLeaf] of Object.entries(events)) {
          let prefTo: string | ((...a: any[]) => any);
          if (typeof toLeaf === 'string') {
            prefTo = `${key}${delimiter}${toLeaf}`;
          } else {
            // toLeaf is a transition function, need to namespace any returned state keys
            prefTo = (...args: any[]) => {
              const result = toLeaf(...args);
              if (typeof result === 'string') {
                return `${key}${delimiter}${result}`;
              } else if (typeof result === 'function') {
                // result is a function like (ev) => state
                return (ev: any) => {
                  const state = result(ev);
                  if (typeof state === 'string' && !state.includes(delimiter)) {
                    return `${key}${delimiter}${state}`;
                  }
                  return state;
                };
              }
              return result;
            };
          }
          ensureFlatTransition(flatTransitions, prefFrom, ev, prefTo);
        }
      }
      // add child leaves to flat states
      for (const [cLeaf, cFactory] of Object.entries(child.states)) {
        flatStates[`${key}${delimiter}${cLeaf}`] = cFactory;
      }
    } else {
      // simple leaf
      childFlatCache[key] = null;
      stateLeaves[key] = [key];
      flatStates[key] = val; // preserve the factory
    }
  }

  // Compute initial leaf
  // If the initial state is a submachine, use its fully qualified initial state
  const initialLeaf = childInitialLeaf[initial] || initial;

  // Parent-level transitions retargeting
  for (const [fromKey, events] of Object.entries(transitions ?? {})) {
    for (const [ev, target] of Object.entries(events ?? {})) {
      const sourceLeaves = stateLeaves[fromKey] ?? [];

      let targetValue: string | ((...a: any[]) => any);
      if (typeof target === 'string') {
        // Determine target leaf (cascade into child initial if target is a submachine)
        targetValue = childInitialLeaf[target] ?? target;
      } else {
        // target is a transition function, need to modify it to return namespaced states
        targetValue = (...args: any[]) => {
          const result = target(...args);
          if (typeof result === 'string') {
            return childInitialLeaf[result] ?? result;
          } else if (typeof result === 'function') {
            return (ev: any) => {
              const state = result(ev);
              if (typeof state === 'string') {
                return childInitialLeaf[state] ?? state;
              }
              return state;
            };
          }
          return result;
        };
      }

      for (const s of sourceLeaves) {
        ensureFlatTransition(flatTransitions, s, ev, targetValue);
      }
    }
  }

  return { states: flatStates, transitions: flatTransitions, initial: initialLeaf };
}

function ensureFlatTransition(
  out: Record<string, Record<string, string | ((...a: any[]) => any)>>,
  fromLeaf: string,
  ev: string,
  toLeaf: string | ((...a: any[]) => any)
) {
  const row = (out[fromLeaf] = out[fromLeaf] ?? {});
  // Deterministic policy: first-seen transition wins. Child-local transitions
  // are processed before parent-level retargeting, so the lowest descendant
  // takes precedence. Do not overwrite existing entries.
  if (row[ev]) return;
  row[ev] = toLeaf;
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

// Extract raw structure from factory for flattening
function extractRawFromFactory(factory: StateMatchboxFactory<any>): Record<string, any> {
  const raw: Record<string, any> = {};
  
  for (const key of Object.keys(factory)) {
    const creator = factory[key as keyof typeof factory];
    
    // Try to call the creator to see what it produces
    try {
      // For creators that take no args or optional args
      if (creator.length === 0) {
        raw[key] = creator();
      } else {
        // Try calling with undefined for optional params
        raw[key] = (creator as (arg?: any) => any)(undefined);
      }
    } catch (e) {
      // If calling the creator fails, treat the raw value as undefined.
      // Avoid brittle heuristics (inspecting function source). Consumers
      // should mark submachines explicitly via `defineSubmachine` or
      // provide an explicit `{ machine: ... }` object when needed.
      raw[key] = undefined;
    }
  }
  return raw;
}

// Flattens nested definitions into fully-qualified leaf state keys and a single event namespace.
// 
// ⚠️  EXPERIMENTAL: This API has known limitations with type inference.
// Submachine references may require explicit typing. See FlatteningDefinitions.md for details.
export function flattenMachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
>(
  def: MachineDefinition<SF, T, I>,
  opts?: FlattenOptions
): FlattenedMachineDefinition<SF, T> {
  // Extract raw structure from factory
  const rawStates = extractRawFromFactory(def.states);
  
  // Use existing flattening logic with defaults for missing options
  const options = {
    delimiter: opts?.delimiter || ".",
    // and implemented in ensureFlatTransition (first-seen wins).
   } as Required<FlattenOptions>;
  
  const flattened = flattenFromRaw(
    rawStates,
    def.transitions as any,
    def.initial as any,
    options
  );
  
  // Convert back to factory
  const flattenedFactory = defineStates(flattened.states);
  
  // Return with properly typed structure
  return {
    states: flattenedFactory as FlattenedStateMatchboxFactory<SF>,
    transitions: flattened.transitions as unknown as FlattenedFactoryTransitions<SF, T>,
    initial: flattened.initial as FlattenFactoryStateKeys<SF>,
  };
}