import type { ComponentType } from "react";
import type { FactoryMachine, StoreMachine } from "matchina";

export type ExampleCategory = "Basic" | "Stopwatch" | "Async" | "Fetcher" | "Hierarchical" | "Advanced";

/**
 * "factory" — discrete state machines (createMachine). Rendered with MachineVisualizer (graph + app view).
 * "store"   — single-value stores (createStoreMachine). Rendered with StoreVisualizer (value + change log).
 */
export type ExampleKind = "factory" | "store";

export interface ExampleMeta {
  id: string;
  title: string;
  description: string;
  category: ExampleCategory;
  tags?: string[];
  order?: number;
  featured?: boolean;
  indexable?: boolean;
  span?: "full" | "auto";
  /** Slug of the MDX article for this example, e.g. "examples/toggle". When set, viewer links back to the article. */
  docSlug?: string;
  /** Hide the visualizer picker (for simple machines where the diagram is noise, not signal). */
  hideVizPicker?: boolean;
  /** Override the default visualizer type for this example. */
  defaultViz?: "svg" | "reactflow";
  /** Discriminator: factory machines get the graph viz, stores get a value/change-log viz. Defaults to "factory". */
  kind?: ExampleKind;
  /** Synchronous factory — enables SSR. Examples should statically import their machine module. */
  machineFactory: (...args: any[]) => FactoryMachine<any> | StoreMachine<any>;
  /** Synchronous AppView component — enables SSR. Examples should statically import their view module. */
  AppView?: ComponentType<any>;
  getSourceFiles: () => Promise<{ name: string; code: string }[]>;
}

export interface ExampleFilter {
  category?: ExampleCategory;
  featured?: boolean;
  indexable?: boolean;
}
