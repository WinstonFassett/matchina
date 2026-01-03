import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { withMermaid } from '@intevel/vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "Matchina Development",
  description: "Development workspace for the Matchina state machine library",
  
  // Serve from root so sidebar can access everything
  srcDir: '.',
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // No nav - just use auto-sidebar

    // Auto-sidebar with frontmatter date sorting
    sidebar: generateSidebar({
      documentRootPath: '.',
      basePath: '/',
      excludeByGlobPattern: ['.vitepress/**', 'screenshots/**', 'node_modules/**', 'dist/**', 'coverage/**'],
      // Better title formatting
      hyphenToSpace: true,
      underscoreToSpace: true,
      capitalizeEachWords: true,
      useTitleFromFileHeading: true,
      useTitleFromFrontmatter: true,
      // Sort by frontmatter date (newest first)
      sortMenusByFrontmatterDate: true,
      sortMenusOrderByDescending: true
    }),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/WinstonFassett/matchina' }
    ]
  }
}))
