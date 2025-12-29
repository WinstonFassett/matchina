import { defineBuildConfig } from 'unbuild'

const mkdistEntry = {
  input: "./src/",
  outDir: "./dist",
  builder: 'mkdist',
  pattern: [
    "**",
    "!dev",
    // "!snippets"
  ],
} as const

export default defineBuildConfig({
  
  entries: [
    {
      ...mkdistEntry,
      format: "esm",
    },

    {
      ...mkdistEntry,
      format: "cjs",      
    },    
    {
      input: 'src/integrations/react/',
      outDir: "./dist/integrations/react",
      builder: 'mkdist'
    },
    {
      input: 'src/inspect/',
      outDir: "./dist/inspect",
      builder: 'mkdist'
    },
    {
      input: 'src/viz/',
      outDir: "./dist/viz",
      builder: 'mkdist'
    }
  ],
  declaration: true,
  rollup: {
    emitCJS: true,  
    esbuild: {
      exclude: ['node_modules', './src/dev'],
    }
  },
  externals: ['react', 'react-dom'],
})