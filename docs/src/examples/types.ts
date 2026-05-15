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
  getMachine: () => Promise<{ default: (...args: any[]) => FactoryMachine<any> }>;
  getAppView?: () => Promise<{ default: ComponentType<{ machine: FactoryMachine<any> & any }> }>;
  getSourceFiles: () => Promise<{ name: string; code: string }[]>;
}

export interface ExampleFilter {
  category?: ExampleCategory;
  featured?: boolean;
  indexable?: boolean;
}
