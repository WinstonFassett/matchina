import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',
      pattern: [
        "**",
        "!dev",
      ],
      format: "esm",
    },
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',
      pattern: [
        "**",
        "!dev",
      ],
      format: "cjs",
    }
  ],
  declaration: true,
  failOnWarn: false,
  rollup: {
    emitCJS: true,  
    esbuild: {
      exclude: ['node_modules', './src/dev'],
    }
  },
  externals: ['react', 'react-dom'],
})