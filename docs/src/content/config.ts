import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
  lits: defineCollection({
    loader: docsLoader(),
    schema: z
      .object({
        title: z.string().optional(),
      })
      .optional(), // No required fields
  }),
};
