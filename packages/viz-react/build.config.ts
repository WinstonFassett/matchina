import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',
      format: "esm",
    },
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',
      format: "cjs",
    }
  ],
  declaration: true,
  failOnWarn: false,
  externals: ['react', 'react-dom', 'matchina', 'matchina/react', 'matchina/hsm'],
})
