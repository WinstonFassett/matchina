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
  TR extends Record<string, any> = Record<string, any>,
  I extends string = string,
> = {
  __kind: "SubmachineDef";
  statesConfig: RawStates; // TaggedTypes used by defineStates
  transitions: TR;
  initial: I;
};

// User-facing MachineDefinition type (keeps both factory and raw config for flattening)
export type MachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF,
  Raw extends Record<string, any> = SF extends StateMatchboxFactory<infer R>
    ? R
    : any,
> = {
  states: SF;
  transitions: T;
  initial: I;
  // raw config used to build states; needed for flattening traversal
  _rawStates: Raw;
};

// Overload: states as factory
export function defineMachine<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF,
  Raw extends Record<string, any> = SF extends StateMatchboxFactory<infer R>
    ? R
    : any,
>(states: SF, transitions: T, initial: I): MachineDefinition<SF, T, I, Raw>;

// Overload: states as shorthand object
export function defineMachine<
  SS extends Record<string, any>,
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF
>(states: SS, transitions: T, initial: I): MachineDefinition<SF, T, I, SS>;

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
  Raw extends Record<string, any> = SS extends StateMatchboxFactory<infer R>
    ? R
    : SS,
  I extends keyof Raw & string = keyof Raw & string,
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

// Type for flattened state factory 
type FlattenedStatesFactory<FlatKeys extends string> = StateMatchboxFactory<
  Record<FlatKeys, undefined>
>;

// Collect event keys from parent transitions and all descendants
type _CollectEventKeys<Raw extends Record<string, any>, TR extends Record<string, any>> =
  | ({ [K in keyof TR & string]: keyof TR[K] & string }[keyof TR & string])
  | ({
      [K in keyof Raw & string]: Raw[K] extends SubmachineMarker<infer CRaw, infer CTR, any>
        ? _CollectEventKeys<CRaw, CTR>
        : never;
    }[keyof Raw & string]);
type CollectEventKeys<Raw extends Record<string, any>, TR extends Record<string, any>> = Extract<_CollectEventKeys<Raw, TR>, string>;

// Type for flattened transitions - per state, events available equal the union across tree
type FlattenedTransitions<FlatKeys extends string, Events extends string> = Record<FlatKeys, Record<Events, FlatKeys>>;

// Flattens nested definitions into fully-qualified leaf state keys and a single event namespace.
export function flattenMachineDefinition<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF,
  Raw = SF extends StateMatchboxFactory<infer R> ? R : never,
  FlatKeys extends string = Raw extends Record<string, any> ? FlattenStateKeys<Raw> : never,
  Events extends string = string & (Raw extends Record<string, any>
    ? CollectEventKeys<Raw, T & Record<string, any>>
    : string)
>(
  def: MachineDefinition<SF, T, I>,
  _opts: FlattenOptions = {}
): MachineDefinition<
  FlattenedStatesFactory<FlatKeys>,
  FlattenedTransitions<FlatKeys, Events>,
  FlatKeys
> {
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
  const flatStatesConfig = Object.fromEntries(
    Object.keys(flattened.states).map(k => [k, undefined])
  ) as Record<FlatKeys, undefined>;
  
  // Create factory with computed types
  const flatStatesFactory = defineStates(flatStatesConfig) as FlattenedStatesFactory<FlatKeys>;

  return {
    states: flatStatesFactory,
    transitions: flattened.transitions as FlattenedTransitions<FlatKeys, Events>,
    initial: flattened.initial as FlatKeys,
    _rawStates: flatStatesConfig as any,
  };
}

// --- helpers ---

function isStatesFactory(x: any): x is StateMatchboxFactory<any> {
  return typeof x === "object" && x !== null && Object.values(x).every((v) => typeof v === "function");
}

function isImplicitSubmachineObject(v: any): v is { states: any; transitions: any; initial: any } {
  return v && typeof v === "object" && "states" in v && "transitions" in v && "initial" in v;
}

function normalizeStates(input: any): { factory: StateMatchboxFactory<any>; raw: any } {
  if (isStatesFactory(input)) {
    // We cannot recover raw; assume keys align 1:1 and synthesize a raw with `undefined` placeholders
    const raw = Object.fromEntries(Object.keys(input).map((k) => [k, undefined]));
    return { factory: input, raw };
  }
  // Treat as shorthand object; unwrap implicit submachine objects to explicit Submachine markers
  const raw = Object.fromEntries(
    Object.entries(input ?? {}).map(([k, v]) => {
      if (isImplicitSubmachineObject(v)) {
        return [k, defineSubmachine(v.states as any, v.transitions as any, v.initial as any)];
      }
      return [k, v];
    })
  );
  const factory = defineStates(raw as any) as StateMatchboxFactory<any>;
  return { factory, raw };
}

// ---- flattening internals ----

type FlatBuild = {
  states: Record<string, true>;
  transitions: Record<string, Record<string, string>>; // fromLeaf -> event -> toLeaf
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
  const flatStates: Record<string, true> = {};
  const flatTransitions: Record<string, Record<string, string>> = {};
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
          const prefTo = `${key}${delimiter}${toLeaf}`;
          ensureFlatTransition(flatTransitions, prefFrom, ev, prefTo, opts);
        }
      }
      // add child leaves to flat states
      for (const cLeaf of Object.keys(child.states)) {
        flatStates[`${key}${delimiter}${cLeaf}`] = true;
      }
    } else {
      // simple leaf
      childFlatCache[key] = null;
      stateLeaves[key] = [key];
      flatStates[key] = true;
    }
  }

  // Compute initial leaf
  const initialLeaf = childInitialLeaf[initial] ?? initial;

  // Parent-level transitions retargeting
  for (const [fromKey, events] of Object.entries(transitions ?? {})) {
    for (const [ev, target] of Object.entries(events ?? {})) {
      if (typeof target !== "string") {
        // Limit MVP to string targets; functions are out-of-scope for flattening for now
        throw new Error(
          `flattenMachineDefinition: only string targets supported for now. Found function for event "${ev}" from state "${fromKey}"`
        );
      }

      const sourceLeaves = stateLeaves[fromKey] ?? [];

      // Determine target leaf (cascade into child initial if target is a submachine)
      const targetLeaf = childInitialLeaf[target] ?? target;

      for (const s of sourceLeaves) {
        ensureFlatTransition(flatTransitions, s, ev, targetLeaf, opts);
      }
    }
  }

  return { states: flatStates, transitions: flatTransitions, initial: initialLeaf };
}

function ensureFlatTransition(
  out: Record<string, Record<string, string>>,
  fromLeaf: string,
  ev: string,
  toLeaf: string,
  opts: Required<FlattenOptions>
) {
  const row = (out[fromLeaf] = out[fromLeaf] ?? {});
  if (row[ev] && row[ev] !== toLeaf) {
    if (opts.eventCollision === "error") {
      throw new Error(
        `Event collision for "${ev}" from "${fromLeaf}": ${row[ev]} vs ${toLeaf}`
      );
    }
    // Basic fallback policies (namespaced/allowShadow) can be enhanced later
    if (opts.eventCollision === "namespaced") {
      // namespace by prefixing event with fromLeaf ancestor; for now, keep first and ignore the rest
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
