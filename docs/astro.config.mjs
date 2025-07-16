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
    //   [remarkShikiTwoslash, { theme: "material-theme-ocean" }]
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
          label: "Guides",
          items: [
            {
              label: "Quickstart",
              link: "/guides/quickstart",
            },
            {
              label: "State Machines",
              link: "/guides/machines",
            },
            {
              label: "Promise Machines",
              link: "/guides/promises",
            },
            {
              label: "Type Guards",
              link: "/guides/typeguards",
            },
            {
              label: "TypeScript Inference",
              link: "/guides/typescript-inference",
            },
            {
              label: "Lifecycle & Hooks",
              link: "/guides/lifecycle",
            },
            {
              label: "Context",
              link: "/guides/context",
            },
            {
              label: "Effects",
              link: "/guides/effects",
            },
            {
              label: "React Integration",
              link: "/guides/integrations",
            },
            {
              label: "Hooks API",
              link: "/guides/hooks",
            },
            {
              label: "Matchbox (Tagged Unions)",
              link: "/guides/union-machines",
            },
          ],
        },
        {
          label: "Examples",
          items: [
            {
              label: "Toggle",
              link: "/examples/toggle",
            },
            {
              label: "Rock-Paper-Scissors Game",
              link: "/examples/rock-paper-scissors",
            },
            {
              label: "Traffic Light",
              link: "/examples/traffic-light",
            },
            {
              label: "Form Validation",
              link: "/examples/form",
            },
            {
              label: "Stopwatch",
              link: "/examples/stopwatch",
            },
            {
              label: "Authentication Flow",
              link: "/examples/auth-flow",
            },
            {
              label: "Fetch - Simple",
              link: "/examples/fetch-simple",
            },
            {
              label: "Fetch - Advanced",
              link: "/examples/fetch-plus",
            },
            {
              label: "Stopwatch (with Hooks)",
              link: "/examples/stopwatch-using-data-and-hooks",
            },
            {
              label: "Stopwatch (Transition Functions)",
              link: "/examples/stopwatch-using-data-and-transition-functions",
            },
            {
              label: "Stopwatch (Effect Hooks)",
              link: "/examples/stopwatch-using-react-state-and-state-effects",
            },
            {
              label: "Paren Checker",
              link: "/examples/paren-checker",
            },
            {
              label: "Checkout Flow with Multiple Machines",
              link: "/examples/checkout",
            },
          ],
        },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
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
