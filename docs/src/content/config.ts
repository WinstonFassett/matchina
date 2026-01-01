import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
  examples: defineCollection({ type: 'data', schema: docsSchema() }),
  // i18n: defineCollection({ type: 'data', schema: i18nSchema() }),
};
