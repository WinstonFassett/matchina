import react from "@astrojs/react";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import starlight from "@astrojs/starlight";
import starlightSidebarTopics from "starlight-sidebar-topics";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Optional dev-only integration — not published, not available in CI/prod builds.
let webdev;
try {
  webdev = (await import("@winstonfassett/webdev-astro")).default;
} catch {
  webdev = () => ({ name: "@winstonfassett/webdev-astro", hooks: {} });
}

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const twoslashConfigPath = path.resolve(__dirname, "twoslash.config.js");

// https://astro.build/config
export default defineConfig({
  // Use Netlify preview URL when available; fall back to GitHub Pages site.
  site: process.env.DEPLOY_PRIME_URL || "https://winstonfassett.github.io",
  // Control base path via env so Netlify previews can use "/" and GH Pages can use "/matchina/".
  // Ensure leading and trailing slashes for Astro.
  base: process.env.DEPLOY_PRIME_URL ? "/" : "/matchina/",
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
        starlightSidebarTopics(
          [
            {
              id: "docs",
              label: "Docs",
              link: "/guides/quickstart",
              items: [
                {
                  label: "Introduction",
                  items: [
                    { label: "Quickstart", link: "/guides/quickstart" },
                    { label: "Installation", link: "/guides/installation" },
                    { label: "About Matchina", link: "/guides/about" },
                  ],
                },
                {
                  label: "Core Concepts",
                  items: [
                    { label: "Tagged Unions", link: "/guides/tagged-unions" },
                    { label: "State Machines", link: "/guides/state-machine-interface" },
                  ],
                },
                {
                  label: "Tagged Union Matchboxes",
                  items: [
                    { label: "Matchbox Factories", link: "/guides/matchbox-factories" },
                    { label: "Matchbox Usage", link: "/guides/matchbox-usage" },
                  ],
                },
                {
                  label: "Machines",
                  items: [
                    { label: "Overview", link: "/guides/state-machines" },
                    { label: "States", link: "/guides/states" },
                    { label: "Factory Machines", link: "/guides/machines" },
                    { label: "Store Machines", link: "/guides/store-machine" },
                    { label: "Type Inference", link: "/guides/machine-inference" },
                    { label: "Promise Machines", link: "/guides/promises" },
                    { label: "Machine Enhancers", link: "/guides/machine-enhancers" },
                    { label: "Hierarchical Machines", link: "/guides/hierarchical-machines" },
                  ],
                },
                {
                  label: "Machine Setup",
                  items: [
                    { label: "Lifecycle", link: "/guides/lifecycle" },
                    { label: "Lifecycle Hooks", link: "/guides/lifecycle-hooks" },
                    { label: "transitionHooks()", link: "/guides/transition-hooks" },
                    { label: "onLifecycle()", link: "/guides/on-lifecycle" },
                    { label: "Subscriptions", link: "/guides/subscriptions" },
                    { label: "Declarative Effects", link: "/guides/effects" },
                  ],
                },
                {
                  label: "Frontend Integration",
                  items: [
                    { label: "React", link: "/guides/react" },
                  ],
                },
                typeDocSidebarGroup,
              ],
            },
            {
              id: "examples",
              label: "Examples",
              link: "/learn/examples/toggle",
              items: [
                {
                  label: "Basic",
                  items: [
                    { label: "Toggle", link: "/learn/examples/toggle" },
                    { label: "Counter", link: "/learn/examples/counter" },
                    { label: "Traffic Light", link: "/examples/traffic-light" },
                    { label: "Rock-Paper-Scissors", link: "/learn/examples/rock-paper-scissors" },
                  ],
                },
                {
                  label: "Stopwatches",
                  items: [
                    { label: "Overview", link: "/learn/examples/stopwatch-overview" },
                    { label: "Basic Stopwatch", link: "/examples/stopwatch" },
                    { label: "With Hooks", link: "/examples/stopwatch-using-data-and-hooks" },
                    { label: "With Transition Functions", link: "/examples/stopwatch-using-data-and-transition-functions" },
                    { label: "With React State and State Effects", link: "/examples/stopwatch-using-react-state-and-state-effects" },
                    { label: "With React State and Effects", link: "/examples/stopwatch-using-react-state-and-effects" },
                    { label: "With External React State", link: "/examples/stopwatch-using-external-react-state-and-state-effects" },
                    { label: "With Lifecycle", link: "/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useeffect" },
                    { label: "With Transition Hooks", link: "/examples/stopwatch-using-transition-hooks-instead-of-useeffect/" },
                  ],
                },
                {
                  label: "Async",
                  items: [
                    { label: "Async Calculator", link: "/examples/async-calculator" },
                  ],
                },
                {
                  label: "Fetchers",
                  items: [
                    { label: "Promise Machine Fetcher", link: "/learn/examples/promise-machine-fetcher" },
                    { label: "Advanced Fetcher", link: "/learn/examples/fetcher-advanced" },
                  ],
                },
                {
                  label: "Hierarchical",
                  items: [
                    { label: "Hierarchical Traffic Light", link: "/learn/examples/hsm-traffic-light" },
                    { label: "Hierarchical Combobox", link: "/learn/examples/hsm-combobox" },
                    { label: "Hierarchical Checkout", link: "/learn/examples/hsm-checkout" },
                  ],
                },
                {
                  label: "Advanced",
                  items: [
                    { label: "Traffic Light Simulator", link: "/examples/traffic-light-extended" },
                    { label: "Authentication Flow", link: "/learn/examples/auth-flow" },
                    { label: "Checkout Flow", link: "/learn/examples/checkout" },
                  ],
                },
              ],
            },
          ],
          {
            topics: {
              docs: ["/", "/guides/**", "/reference/**", "/api/**"],
              examples: ["/examples", "/examples/**", "/learn/**"],
            },
          },
        ),
        ...(process.env.SKIP_TYPEDOC ? [] : [starlightTypeDoc({
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
              "@group",
              "@property",
              "@throws",
              "@type",
              "@function",
              "@internal",
            ],
            modifierTags: ["@interface"],
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
        })]),
      ],
      components: {
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        Header: './src/components/starlight/Header.astro',
        PageFrame: './src/components/starlight/PageFrame.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        Hero: './src/components/starlight/Hero.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
      },
      head: [
        // Inline critical --sl-* vars so Starlight's chrome doesn't paint cold
        // defaults before external CSS loads. Editorial light is the default;
        // any *-dark suffix switches to dark chrome. Full palette loads with all-themes.css.
        {
          tag: "style",
          content: `
            :root{
              --sl-color-bg:#f6f5f1;
              --sl-color-bg-nav:#f6f5f1;
              --sl-color-bg-sidebar:#f6f5f1;
              --sl-color-text:#15130f;
              --sl-color-hairline:#e3e0d8;
              --sl-color-accent:var(--accent);
              --sl-color-text-accent:var(--accent);
            }
            [data-theme$="dark"]{
              --sl-color-bg:#0e0e0f;
              --sl-color-bg-nav:#0e0e0f;
              --sl-color-bg-sidebar:#0e0e0f;
              --sl-color-text:#ececec;
              --sl-color-hairline:#262628;
              --sl-color-accent:var(--accent);
              --sl-color-text-accent:var(--accent);
            }
          `,
        },
        { tag: "link", attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
        { tag: "link", attrs: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true } },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400;1,8..60,500&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap",
          },
        },
      ],
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
      customCss: ["./src/styles/global.css"],
    }),
    react(),
    webdev(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Always use 'node' condition to resolve to source .ts files via path mappings
      // This works for both dev and production since we don't pre-build packages
      conditions: ["node"],
      // Deduplicate React to prevent dual-instance errors. The workspace root has
      // React 18; docs has React 19. Vite deduplication forces all imports to
      // resolve to the same copy, preventing useContext/useState from failing.
      dedupe: ["react", "react-dom"],
    },
  },
});
