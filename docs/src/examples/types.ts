import type { ComponentType } from "react";
import type { FactoryMachine } from "matchina";

export type ExampleCategory = "Basic" | "Stopwatch" | "Async" | "Fetcher" | "Hierarchical" | "Advanced";

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
  getMachine: () => Promise<{ default: (...args: any[]) => FactoryMachine<any> }>;
  getAppView?: () => Promise<{ default: ComponentType<{ machine: FactoryMachine<any> & any }> }>;
  getSourceFiles: () => Promise<{ name: string; code: string }[]>;
}

export interface ExampleFilter {
  category?: ExampleCategory;
  featured?: boolean;
  indexable?: boolean;
}
