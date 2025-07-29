import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const twoslashConfigPath = path.resolve(__dirname, "twoslash.config.js");

// https://astro.build/config
export default defineConfig({
  site: "https://winstonfassett.github.io",
  base: process.env.NODE_ENV === "production" ? "matchina" : undefined,
  build: {
    assets: "assets",
  },
  markdown: {
    // is this getting used?
    shikiConfig: {
      langs: [],
      wrap: true,
    },
  },
  integrations: [
    starlight({
      plugins: [
        starlightTypeDoc({
          watch: true,
          sidebar: {
            label: "Reference",
          },
          entryPoints: ["../src/index.ts"],
          tsconfig: "../tsconfig.typedoc.json",
          output: "reference",

          typeDoc: {
            entryPointStrategy: "expand",
            blockTags: ["@deprecated", "@source", "@example"],
            blockTagsPreserveOrder: ["@example", "@source", "@deprecated"],
            excludePrivate: true,
            excludeInternal: true,
            categorizeByGroup: false,
            groupOrder: ["Interfaces", "Functions", "Type Alias", "Variables", "*"],
            navigation: {
              includeGroups: true,
              includeCategories: true,
            },
            parametersFormat: "table",
            typeAliasPropertiesFormat: "table",
            propertyMembersFormat: "table",
            expandObjects: true,
            expandParameters: true,
            indexFormat: "table",
            interfacePropertiesFormat: "table",
            interfaceMethodsFormat: "table",
            interfaceIndexFormat: "table",
            typeDeclarationFormat: "table",

            plugin: [
              // "./src/lib/starlight-typedoc/register-theme.ts",
              './dist/typedoc-plugin/register-theme.cjs',
              "typedoc-plugin-inline-sources"
            ],
            theme: "starlight-typedoc-custom"
            // "excludeNotDocumented": true
          },
        }),
      ],
      expressiveCode: {
        themes: ["material-theme-ocean"],
      },
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
              label: "About Matchina",
              link: "/guides/inside",
            },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            {
              label: "Tagged Unions",
              link: "/guides/unions",
            },
            {
              label: "State Machines",
              link: "/guides/state-machine-interface",
            },
          ],
        },
        {
          label: "Tagged Unions",
          items: [
            {
              label: "Matchbox Factories",
              link: "/guides/matchbox-factories",
            },
            // pattern matching and exhaustiveness checking, type inference (guards, casting, etc.)
            {
              label: "Pattern Matching",
              link: "/guides/pattern-matching",
            },
            {
              label: "Type Safety",
              link: "/guides/matchbox-typescript-inference",
            },
          ],
        },
        {
          label: "Creating Machines",
          items: [
            {
              label: "Interfaces",
              link: "/guides/state-machines",
            },
            {
              label: "States",
              link: "/guides/states",
            },
            // {
            //   label: "Transition Machines",
            //   link: "/guides/transition-machines",
            // },
            {
              label: "Factory Machines",
              link: "/guides/machines",
            },
            {
              label: "Promise Machines",
              link: "/guides/promises",
            },
            {
              label: "Machine Enhancers",
              link: "/guides/machine-enhancers",
            },
            {
              label: "Type Inference",
              link: "/guides/machine-inference",
            },
          ],
        },
        {
          label: "Using Machines",
          items: [
            {
              label: "Lifecycle",
              link: "/guides/lifecycle",
            },
            {
              label: "Hooks",
              link: "/guides/lifecycle-hooks",
            },
            {
              label: "onLifecycle",
              link: "/guides/on-lifecycle",
            },
            {
              label: "transitionHooks",
              link: "/guides/transition-hooks",
            },
            {
              label: "React Integration",
              link: "/guides/integrations",
            },
          ],
        },
        // {
        //   label: "How To",
        //   collapsed: true,
        //   items: [
        //     {
        //       label: "Context",
        //       link: "/guides/context",
        //     },
        //   ],
        // },
        {
          label: "Examples",
          collapsed: true,
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
                  label: "Traffic Light Simulator",
                  link: "/examples/traffic-light-extended",
                },
                {
                  label: "Authentication Flow",
                  link: "/examples/auth-flow",
                },
                {
                  label: "Checkout Flow",
                  link: "/examples/checkout",
                },
                // Currently buggy. State lags input
                // {
                //   label: "Paren Checker",
                //   link: "/examples/paren-checker",
                // },
              ],
            },
          ],
        },
        {
          label: "Extras",
          items: [
            { label: "Effects", link: "/guides/effects" },
            // { label: "Subscriptions", link: "/guides/subscriptions" },
          ],
        },
        // {
        //   label: "Appendix",
        //   collapsed: true,
        //   items: [
        //     {
        //       label: "Timsy Inspiration",
        //       link: "/guides/timsy",
        //     },
        //     {
        //       label: "Unions as Machines",
        //       link: "/guides/unions-as-machine",
        //     },
        //   ],
        // },
        // {
        //   label: "Guides",
        //   items: [
        //     // Each item here is one entry in the navigation menu.
        //     { label: "Example Guide", slug: "guides/example" },
        //   ],
        // },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
        typeDocSidebarGroup,
      ],
      customCss: ["./src/styles/global.css"],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
