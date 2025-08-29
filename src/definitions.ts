import { defineStates } from "./define-states";
import type { StateMatchboxFactory } from "./state-types";
import type {
  FactoryMachineTransitions,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine-types";
import type { KeysWithZeroRequiredArgs } from "./utility-types";
import { createMachine } from "./factory-machine";

// Internal marker for a static Submachine Definition
// Generic to preserve child raw states, transitions, and initial key types
export type SubmachineMarker<
  RawStates extends Record<string, any> = any,
  TR extends Record<string, any> = any,
  I extends string = string
> = {
  __kind: "SubmachineDef";
  statesConfig: RawStates;
  transitions: TR;
  initial: I;
};

// User-facing MachineDefinition type (keeps both factory and raw config for flattening)
export type MachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
> = {
  states: SF;
  transitions: T;
  initial: I;
  // raw config used to build states; needed for flattening traversal
  _rawStates: any;
};

// Overload: states as factory
export function defineMachine<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
>(states: SF, transitions: T, initial: I): MachineDefinition<SF, T, I>;

// Overload: states as shorthand object
export function defineMachine<
  SS extends Record<string, any>,
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
>(states: SS, transitions: T, initial: I): MachineDefinition<SF, T, I>;

export function defineMachine(states: any, transitions: any, initial: any): any {
  const { factory, raw } = normalizeStates(states);
  return {
    states: factory,
    transitions,
    initial,
    _rawStates: raw,
  };
}

// Static-only submachine definition (no factories, no args)
export function defineSubmachine<
  SS extends Record<string, any> | StateMatchboxFactory<any>,
  T extends Record<string, any>,
  I extends string,
  Raw extends Record<string, any> = SS extends StateMatchboxFactory<infer R> ? R : SS
>(states: SS, transitions: T, initial: I): SubmachineMarker<Raw, T, I> {
  const { raw } = normalizeStates(states);
  return { __kind: "SubmachineDef", statesConfig: raw, transitions, initial };
}

// Convenience: create an instance directly from a definition  
export function createMachineFrom<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>, 
  I extends KeysWithZeroRequiredArgs<SF>
>(def: MachineDefinition<SF, T, I>) {
  return createMachine(def.states, def.transitions, def.initial);
}

export type FlattenOptions = {
  eventCollision?: "error" | "namespaced" | "allowShadow";
  delimiter?: string;
};



// Simplified type computation for flattened state keys (recursive)
type FlattenStateKeys<
  Raw extends Record<string, any>,
  Delim extends string = ".",
> = {
  [K in keyof Raw & string]: Raw[K] extends SubmachineMarker<infer CRaw, any, any>
    ? `${K}${Delim}${FlattenStateKeys<CRaw, Delim>}`
    : K
}[keyof Raw & string];

// Flatten raw state specs to fully-qualified leaf keys while preserving each leaf's original spec
type FlattenedStateSpecs<
  Raw extends Record<string, any>,
  Delim extends string = ".",
> = {
  [K in keyof Raw & string]: Raw[K] extends SubmachineMarker<infer CRaw, any, any>
    ? PrefixKeys<FlattenedStateSpecs<CRaw, Delim>, `${K}${Delim}`>
    : { [P in K]: Raw[K] }
}[keyof Raw & string];

// PrefixKeys type remains unchanged
type PrefixKeys<T extends Record<string, any>, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
};

// Helper to turn union of object types into an intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

// Type for flattened transitions - per state, compute event union and map to flattened leaf keys or functions
type FlattenedTransitionsPerState<
  Raw extends Record<string, any>,
  TR extends Record<string, any>,
  FlatKeys extends string,
> = {
  [L in FlatKeys]: Record<EventsForLeaf<Raw, TR, L>, FlatKeys | ((...a: any[]) => any)>;
};

// Type for flattened state factory preserving specs
type FlattenedStatesFactory<Raw extends Record<string, any>, FlatKeys extends string> = StateMatchboxFactory<
  FlattenedStateSpecs<Raw>
>;

// Flattens nested definitions into fully-qualified leaf state keys and a single event namespace.
export function flattenMachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
>(
  def: MachineDefinition<SF, T, I>,
  _opts: FlattenOptions = {}
): MachineDefinition<any, any, any> {
  const opts: Required<FlattenOptions> = {
    eventCollision: _opts.eventCollision ?? "error",
    delimiter: _opts.delimiter ?? ".",
  } as any;

  const flattened = flattenFromRaw(
    def._rawStates,
    def.transitions as any,
    def.initial as any,
    opts
  );

  // Create flattened states config with computed literal keys
  const flatStatesConfig = flattened.states;
  
  // Create factory with computed types
  const flatStatesFactory = defineStates(flatStatesConfig);

  return {
    states: flatStatesFactory,
    transitions: flattened.transitions,
    initial: flattened.initial,
    _rawStates: flatStatesConfig,
  };
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
  // Treat as shorthand object; unwrap implicit submachine objects to explicit Submachine markers
  const raw = Object.fromEntries(
    Object.entries(input ?? {}).map(([k, v]) => {
      if (isImplicitSubmachineObject(v)) {
        return [k, defineSubmachine(v.states as any, v.transitions as any, v.initial as any)];
      }
      return [k, v];
    })
  ) as any;
  const factory = defineStates(raw) as any;
  return { factory, raw } as any;
}

// ---- flattening internals ----

type FlatBuild = {
  states: Record<string, any>; // state key -> factory function or undefined
  transitions: Record<string, Record<string, string | ((...a: any[]) => any)>>; // fromLeaf -> event -> toLeaf
  initial: string;
};

function isSubmachineMarker(x: any): x is SubmachineMarker {
  return x && typeof x === "object" && x.__kind === "SubmachineDef";
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
      const child = flattenFromRaw(
        val.statesConfig as any,
        val.transitions as any,
        val.initial as any,
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
          ensureFlatTransition(flatTransitions, prefFrom, ev, prefTo, opts);
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
  const initialLeaf = childInitialLeaf[initial] ?? initial;

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
        ensureFlatTransition(flatTransitions, s, ev, targetValue, opts);
      }
    }
  }

  return { states: flatStates, transitions: flatTransitions, initial: initialLeaf };
}

function ensureFlatTransition(
  out: Record<string, Record<string, string | ((...a: any[]) => any)>>,
  fromLeaf: string,
  ev: string,
  toLeaf: string | ((...a: any[]) => any),
  opts: Required<FlattenOptions>
) {
  const row = (out[fromLeaf] = out[fromLeaf] ?? {});
  if (row[ev] && row[ev] !== toLeaf) {
    if (opts.eventCollision === "error") {
      throw new Error(
        `Event collision for "${ev}" from "${fromLeaf}": collision handling for functions not implemented`
      );
    }
    // Basic fallback policies
    if (opts.eventCollision === "namespaced") {
      // keep first
      return;
    }
    if (opts.eventCollision === "allowShadow") {
      // allow last one to win
      row[ev] = toLeaf;
      return;
    }
  }
  row[ev] = toLeaf;
}

// Collect event keys from parent transitions and all descendants (global union)
type _CollectEventKeys<Raw extends Record<string, any>, TR extends Record<string, any>> =
  | ({ [K in keyof TR & string]: keyof TR[K] & string }[keyof TR & string])
  | ({
      [K in keyof Raw & string]: Raw[K] extends SubmachineMarker<infer CRaw, infer CTR, any>
        ? _CollectEventKeys<CRaw, CTR>
        : never;
    }[keyof Raw & string]);
type CollectEventKeys<Raw extends Record<string, any>, TR extends Record<string, any>> = Extract<_CollectEventKeys<Raw, TR>, string>;

// Per-leaf event computation (top-down): parent events apply at each branch; child events only on its leaves
type EventsForLeaf<
  Raw extends Record<string, any>,
  TR extends Record<string, any>,
  Leaf extends string,
  Delim extends string = ".",
> = Leaf extends `${infer H}${Delim}${infer T}`
  ? H extends keyof TR
    ? Raw[H] extends SubmachineMarker<infer CRaw, infer CTR, any>
      ? (keyof TR[H] & string) | EventsForLeaf<CRaw, CTR, Extract<T, string>, Delim>
      : keyof TR[H] & string
    : never
  : Leaf extends keyof TR
    ? keyof TR[Leaf] & string
    : never;