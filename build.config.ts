import { defineBuildConfig } from 'unbuild'

const mkdistEntry = {
  input: "./src/",
  outDir: "./dist",
  builder: 'mkdist',
  pattern: "**/!(*.stories).{js,jsx,ts,tsx}",
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
      input: 'src/extras/react/',
      outDir: "./dist/extras/react",
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