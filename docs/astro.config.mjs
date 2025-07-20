// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const twoslashConfigPath = path.resolve(__dirname, "twoslash.config.js");

// https://astro.build/config
export default defineConfig({
  site: "https://winstonfassett.github.io",
  base: process.env.NODE_ENV === "production" ? "matchina" : undefined,
  build: {
    assets: "assets",
  },
  markdown: {
    shikiConfig: {
      langs: [],
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
  integrations: [
    starlight({
      title: "Matchina",
      editLink: {
        baseUrl: "https://github.com/winstonfassett/matchina/edit/main/docs/",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
          // github: "https://github.com/WinstonFassett/matchina",
        },
      ],
      sidebar: [
        {
          label: "Introduction",
          items: [
            {
              label: "Quickstart",
              link: "/guides/quickstart",
            },
            {
              label: "What's in the Box",
              link: "/guides/inside",
            },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            {
              label: "Matchbox Factories",
              link: "/guides/matchbox",
            },
            {
              label: "State Machines",
              link: "/guides/state-machine-interface",
            },
          ],
        },
        {
          label: "Machines",
          items: [
            {
              label: "Creating Machines",
              link: "/guides/machines",
            },
            {
              label: "Promise Machines",
              link: "/guides/promises",
            },
            {
              label: "Lifecycle & Hooks",
              link: "/guides/lifecycle",
            },
            {
              label: "Effects",
              link: "/guides/effects",
            },
            {
              label: "API Wrappers",
              link: "/guides/api-wrappers",
            },
            {
              label: "React Integration",
              link: "/guides/integrations",
            },
          ],
        },
        {
          label: "How To",
          items: [
            {
              label: "Type Inference",
              link: "/guides/typescript-inference",
            },
            {
              label: "Type Guards",
              link: "/guides/typeguards",
            },
            {
              label: "Tagged Unions",
              link: "/guides/union-machines",
            },
            {
              label: "Hooks API",
              link: "/guides/hooks",
            },
            {
              label: "Context",
              link: "/guides/context",
            },
          ],
        },
        {
          label: "Examples",
          items: [
            {
              label: "Basic",
              items: [
                {
                  label: "Toggle",
                  link: "/examples/toggle",
                },
                {
                  label: "Counter",
                  link: "/examples/counter",
                },
                {
                  label: "Traffic Light",
                  link: "/examples/traffic-light",
                },
                {
                  label: "Rock-Paper-Scissors",
                  link: "/examples/rock-paper-scissors",
                },
              ],
            },
            {
              label: "Stopwatches",
              items: [
                {
                  label: "Overview",
                  link: "/examples/stopwatch-overview",
                },
                {
                  label: "Basic Stopwatch",
                  link: "/examples/stopwatch",
                },
                {
                  label: "With Hooks",
                  link: "/examples/stopwatch-using-data-and-hooks",
                },
                {
                  label: "With Transition Functions",
                  link: "/examples/stopwatch-using-data-and-transition-functions",
                },
                {
                  label: "With Effect Hooks",
                  link: "/examples/stopwatch-using-react-state-and-state-effects",
                },
                {
                  label: "With External React State",
                  link: "/examples/stopwatch-using-external-react-state-and-state-effects",
                },
                {
                  label: "With Lifecycle",
                  link: "/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
                },
              ],
            },
            {
              label: "Async",
              items: [
                {
                  label: "Async Calculator",
                  link: "/examples/async-calculator",
                },
              ],
            },
            {
              label: "Fetchers",
              items: [
                {
                  label: "Promise Machine Fetcher",
                  link: "/examples/promise-machine-fetcher",
                },
                {
                  label: "Advanced Fetcher",
                  link: "/examples/fetcher-advanced",
                },
              ],
            },
            {
              label: "Advanced",
              items: [
                {
                  label: "Form Validation",
                  link: "/examples/form",
                },
                {
                  label: "Authentication Flow",
                  link: "/examples/auth-flow",
                },
                {
                  label: "Paren Checker",
                  link: "/examples/paren-checker",
                },
                {
                  label: "Traffic Light with Pedestrian Crossing",
                  link: "/examples/traffic-light-extended",
                },
                {
                  label: "Checkout Flow",
                  link: "/examples/checkout",
                },
              ],
            },
          ],
        },
        {
          label: "Appendix",
          items: [
            {
              label: "Timsy Inspiration",
              link: "/guides/timsy",
            },
            {
              label: "Unions as Machines",
              link: "/guides/unions-as-machine",
            },
          ],
        },
        // {
        //   label: "Guides",
        //   items: [
        //     // Each item here is one entry in the navigation menu.
        //     { label: "Example Guide", slug: "guides/example" },
        //   ],
        // },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
      customCss: ["./src/styles/global.css"],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
