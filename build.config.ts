import { defineBuildConfig } from 'unbuild'

const mkdistEntry = {
  input: "./src/",
  outDir: "./dist",
  builder: 'mkdist',
  pattern: [
    "**",
    "!dev",
    "!snippets"
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