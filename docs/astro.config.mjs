import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
// import mdx from '@astrojs/mdx';
import remarkShikiTwoslash from "remark-shiki-twoslash";
import rehypeShikiji from "rehype-shikiji";

console.log({ remarkShikiTwoslash });
// https://astro.build/config
export default defineConfig({
  site: "https://winstonfassett.github.io",
  base: process.env.NODE_ENV === "production" ? "matchina" : undefined,
  build: {
    assets: "assets",
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [[rehypeShikiji, { theme: "material-theme-ocean" }]],

    // remarkPlugins: [
    //   [remarkShikiTwoslash, {
    //     // theme: "material-theme-ocean"
    //   }]
    //   // '@astrojs/markdown-remark',
    //   // {
    //   //   syntaxHighlight: false,
    //   //   remarkPlugins: [
    //   //   ]
    //   // },
    // ]
  },
  integrations: [
    // mdx({
    //   syntaxHighlight: 'shiki',
    //   shikiConfig: { theme: 'dracula' },
    //   remarkPlugins: [remarkShikiTwoslash.default,
    //     // remarkToc
    //   ],
    //   // rehypePlugins: [rehypeMinifyHtml],
    //   // remarkRehype: { footnoteLabel: 'Footnotes' },
    //   // gfm: false,
    // }),
    starlight({
      title: "Matchina",
      editLink: {
        baseUrl: "https://github.com/winstonfassett/matchina/edit/main/docs/",
      },
      social: {
        github: "https://github.com/WinstonFassett/matchina",
      },
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
              label: "Fetchers",
              items: [
                {
                  label: "Overview",
                  link: "/examples/fetcher-overview",
                },
                {
                  label: "Basic Fetcher",
                  link: "/examples/fetcher-basic",
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
                  label: "Todo List",
                  link: "/examples/todo-list",
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
      ],
      customCss: [
        "./src/styles/tailwind.css",
        "./src/styles/starlight.css",
        "./src/components/style-rich.css",
      ],
    }),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
});
