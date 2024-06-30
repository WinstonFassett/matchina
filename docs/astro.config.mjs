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
              link: "/guides/quickstart/index.html",
            },
            {
              label: "Features",
              link: "/guides/inside/index.html",
            },
            {
              label: "State Machines",
              link: "/guides/machines/index.html",
            },
            {
              label: "Hooks and Lifecycle",
              link: "/guides/hooks/index.html",
            },
            {
              label: "Type Guards",
              link: "/guides/typeguards/index.html",
            },
            {
              label: "Extras",
              link: "/guides/extras/index.html",
            },
            {
              label: "Integrations",
              link: "/guides/integrations/index.html",
            },
          ],
        },
        {
          label: "Examples",
          items: [
            {
              label: "Promise - simple", 
              link: "/examples/fetch-simple/index.html"
            },
            { 
              label: 'Stopwatch (useEffect)',
              link: '/examples/stopwatch-with-react-state-and-effects/index.html'
            },
            { label: 'Stopwatch (onLifecycle setup)',
              link: '/examples/stopwatch-with-react-state-using-lifecyle-instead-of-useeffect/index.html'
            },
            { 
              label: 'Stopwatch (data and setup)',
              link: '/examples/stopwatch-using-data-and-hooks/index.html'
            },            
            { 
              label: 'Stopwatch (functional with data)',
              link: '/examples/stopwatch-using-data-and-transition-functions/index.html'
            },
            { 
              label: 'Stopwatch (machine effect hooks)',
              link: '/examples/stopwatch-with-react-state-and-state-effects/index.html'
            },
            {
              label: "Fetch - advanced", 
              link: "/examples/fetch-plus/index.html"
            }
          ]
        },
        {
          label: "Recipes",
          items: [
            {
              label: "Effects",
              link: "/guides/effects/index.html",
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
