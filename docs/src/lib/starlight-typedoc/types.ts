import { type PageDefinition, type TypeDocOptions } from "typedoc";
import type { PluginOptions } from "typedoc-plugin-markdown";

export type TypeDocConfig = Partial<
  Omit<TypeDocOptions, "entryPoints" | "tsconfig"> & PluginOptions
>;

export type TypeDocDefinitions = Record<string, PageDefinition["url"]>;

export interface TypeDocOutput {
  base: string;
  directory: string;
  path: string;
}
