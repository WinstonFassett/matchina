import react from "@astrojs/react";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const twoslashConfigPath = path.resolve(__dirname, "twoslash.config.js");

// https://astro.build/config
export default defineConfig({
  // Use Netlify preview URL when available; fall back to GitHub Pages site.
  site: process.env.DEPLOY_PRIME_URL || "https://winstonfassett.github.io",
  // Control base path via env so Netlify previews can use "/" and GH Pages can use "/matchina/".
  // Ensure leading and trailing slashes for Astro.
  base: "matchina",
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
          watch: true,
          typeDoc: {
            sort: "source-order",
            entryPointStrategy: "expand",
            tableColumnSettings: {
              hideSources: true,
            },
            blockTags: [
              "@deprecated",
              "@see",
              "@example",
              "@parameters",
              "@typeParameters",
              "@source",
              "@template",
              "@param",
              "@returns",
            ],
            // blockTagsPreserveOrder: ["@example", "@source", "@deprecated"],
            excludePrivate: true,
            excludeInternal: true,
            categorizeByGroup: false,
            logLevel: "Error",
            groupOrder: [
              "Interfaces",
              "Functions",
              "Type Alias",
              "Variables",
              "*",
            ],
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
            // interfaceMethodsFormat: "table",
            // interfaceIndexFormat: "table",
            typeDeclarationFormat: "table",

            plugin: [
              // "./src/lib/starlight-typedoc/register-theme.ts",
              "./dist/typedoc-plugin/register-theme.cjs",
              "typedoc-plugin-inline-sources",
            ],
            theme: "starlight-typedoc-custom",
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
          href: "https://github.com/WinstonFassett/matchina",
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
              label: "Installation",
              link: "/guides/installation",
            },
            {
              label: "About Matchina",
              link: "/guides/about",
            },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            {
              label: "Tagged Unions",
              link: "/guides/tagged-unions",
            },
            {
              label: "State Machines",
              link: "/guides/state-machine-interface",
            },
          ],
        },
        {
          label: "Tagged Union Matchboxes",
          items: [
            {
              label: "Matchbox Factories",
              link: "/guides/matchbox-factories",
            },
            {
              label: "Matchbox Usage",
              link: "/guides/matchbox-usage",
            },
          ],
        },
        {
          label: "Machines",
          items: [
            {
              label: "Overview",
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
              label: "Store Machines",
              link: "/guides/store-machine",
            },
            {
              label: "Type Inference",
              link: "/guides/machine-inference",
            },            
            {
              label: "Promise Machines",
              link: "/guides/promises",
            },
            {
              label: "Machine Enhancers",
              link: "/guides/machine-enhancers",
            },
          ]
        },
        {
          label: "Machine Setup",
          items: [
            {
              label: "Lifecycle",
              link: "/guides/lifecycle",
            },
            {
              label: "Lifecycle Hooks",
              link: "/guides/lifecycle-hooks",
            },            
            {
              label: "transitionHooks()",
              link: "/guides/transition-hooks",
            },            
{
              label: "onLifecycle()",
              link: "/guides/on-lifecycle",
            },            
            { label: "Subscriptions", link: "/guides/subscriptions" },
            { label: "Declarative Effects", link: "/guides/effects" },
          ],
        },
        // {
        //   label: "Schema Validation",
        //   items: [
        //     {
        //       label: "Zod",
        //       link: "/guides/zod",
        //     },
        //     {
        //       label: "Valibot",
        //       link: "/guides/valibot",
        //     },
        //   ],
        // },
        {
          label: "Frontend Integration",
          items: [                        
            {
              label: "React",
              link: "/guides/react",
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
          // collapsed: true,
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
                  label: "With React State and State Effects",
                  link: "/examples/stopwatch-using-react-state-and-state-effects",
                },
                {
                  label: "With React State and Effects",
                  link: "/examples/stopwatch-using-react-state-and-effects",
                },
                {
                  label: "With External React State",
                  link: "/examples/stopwatch-using-external-react-state-and-state-effects",
                },
                {
                  label: "With Lifecycle",
                  link: "/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
                },
                {
                  label: "With Transition Hooks",
                  link: "/examples/stopwatch-using-transition-hooks-instead-of-useeffect/",
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
        // {
        //   label: "Extras",
        //   items: [
        //   ],
        // },
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
