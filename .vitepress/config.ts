import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Matchina Development",
  description: "Development workspace for the Matchina state machine library",
  
  // Focus on review directory for auto-navigation
  srcDir: 'review',
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Review Docs', link: '/' },
      { text: 'Archive', link: '/archive/' },
    ],

    // Static sidebar that's easy to maintain
    sidebar: [
      {
        text: 'Active Documentation',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Testing Analysis Report', link: '/TESTING_ANALYSIS_REPORT' },
          { text: 'Auth Flow Redesign', link: '/AUTH_FLOW_REDESIGN' },
          { text: 'Layout Quality Assessment', link: '/LAYOUT_QUALITY_ASSESSMENT' },
          { text: 'Unified Visualizer Implementation', link: '/UNIFIED_VISUALIZER_IMPLEMENTATION' },
          { text: 'HSM Recursion Issue', link: '/HSM_RECURSION_ISSUE' },
          { text: 'Phase 1-3 Ready for Testing', link: '/PHASE1_3_READY_FOR_TESTING' },
          { text: 'Mermaid Design Spec', link: '/MERMAID_DESIGN_SPEC' },
          { text: 'Testing Commands', link: '/TESTING_COMMANDS' },
          { text: 'Architecture Evolution', link: '/VISUALIZER_ARCHITECTURE_EVOLUTION' },
          { text: 'ForceGraph Design', link: '/FORCEGRAPH_TECH_DESIGN' },
          { text: 'ReactFlow Research', link: '/REACTFLOW_LAYOUT_RESEARCH' },
          { text: 'Type Inference Development Guide', link: '/TYPE_INFERENCE_DEVELOPMENT_GUIDE' },
        ]
      },
      {
        text: 'Archive',
        collapsed: true,
        items: [
          { text: 'Archive Index', link: '/archive/' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/WinstonFassett/matchina' }
    ]
  }
})
