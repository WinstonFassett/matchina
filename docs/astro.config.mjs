import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
// import mdx from '@astrojs/mdx';
import remarkShikiTwoslash from 'remark-shiki-twoslash';
console.log({ remarkShikiTwoslash})
// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: false,
    remarkPlugins: [
      [remarkShikiTwoslash, { theme: "material-ocean" }]
      // '@astrojs/markdown-remark',
      // {
      //   syntaxHighlight: false,
      //   remarkPlugins: [
      //   ]
      // },
    ]
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
            // Each item here is one entry in the navigation menu.
            {
              label: "Quickstart",
              link: "/guides/quickstart/",
            },
            {
              label: "Basics",
              link: "/guides/basics/",
            },
            {
              label: "Types",
              link: "/guides/types/",
            },
            {
              label: "Lifecycle",
              link: "/guides/lifecycle/",
            },
            {
              label: "Effects",
              link: "/guides/effects/",
            },
            {
              label: "Promises",
              link: "/guides/promises/",
            },
            {
              label: "Union Machines",
              link: "/guides/union-machines/",
            },
            {
              label: "Timsy Compatibility",
              link: "/guides/timsy/",
            },
            {
              label: "Context", 
              link: "/guides/context/"
            },
          ],
        },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
      ],
      customCss: ["./src/styles/tailwind.css", "./src/styles/shiki-twoslash.css"],
    }),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
});
