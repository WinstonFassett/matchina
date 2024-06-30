import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
// import mdx from '@astrojs/mdx';
import remarkShikiTwoslash from 'remark-shiki-twoslash';
import rehypeShikiji from 'rehype-shikiji'

console.log({ remarkShikiTwoslash})
// https://astro.build/config
export default defineConfig({
  site: 'https://winstonfassett.github.io',
  base: process.env.NODE_ENV === 'production' ? 'matchina' : undefined,
  build: {
    assets: 'assets'
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins:[
      [rehypeShikiji, { theme: "material-theme-ocean" }]
    ],

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
				baseUrl: 'https://github.com/winstonfassett/matchina/edit/main/docs/',
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
              link: "/matchina/guides/quickstart/index.html",
            },
            {
              label: "Features",
              link: "/matchina/guides/inside/index.html",
            },
            {
              label: "State Machines",
              link: "/matchina/guides/machines/index.html",
            },
            {
              label: "Hooks and Lifecycle",
              link: "/matchina/guides/hooks/index.html",
            },
            {
              label: "Type Guards",
              link: "/matchina/guides/typeguards/index.html",
            },
            {
              label: "Extras",
              link: "/matchina/guides/extras/index.html",
            },
            {
              label: "Integrations",
              link: "/matchina/guides/integrations/index.html",
            },
          ],
        },
        {
          label: "Examples",
          items: [
            {
              label: "Promise - simple", 
              link: "/matchina/examples/fetch-simple/index.html"
            },
            { 
              label: 'Stopwatch (useEffect)',
              link: '/matchina/examples/stopwatch-with-react-state-and-effects/index.html'
            },
            { label: 'Stopwatch (onLifecycle setup)',
              link: '/matchina/examples/stopwatch-with-react-state-using-lifecyle-instead-of-useeffect/index.html'
            },
            { 
              label: 'Stopwatch (data and setup)',
              link: '/matchina/examples/stopwatch-using-data-and-hooks/index.html'
            },            
            { 
              label: 'Stopwatch (functional with data)',
              link: '/matchina/examples/stopwatch-using-data-and-transition-functions/index.html'
            },
            { 
              label: 'Stopwatch (machine effect hooks)',
              link: '/matchina/examples/stopwatch-with-react-state-and-state-effects/index.html'
            },
            {
              label: "Fetch - advanced", 
              link: "/matchina/examples/fetch-plus/index.html"
            }
          ]
        },
        {
          label: "Recipes",
          items: [
            {
              label: "Effects",
              link: "/matchina/guides/effects/index.html",
            },
            {
              label: "Context", 
              link: "/matchina/guides/context/index.html"
            },
            {
              label: "Union Machines",
              link: "/matchina/guides/union-machines/index.html",
            },
            {
              label: "Timsy Compatibility",
              link: "/matchina/guides/timsy/index.html",
            },
          ],
          
        },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
      ],
      customCss: ["./src/styles/tailwind.css", "./src/styles/starlight.css", "./src/components/style-rich.css"],
    }),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
});
