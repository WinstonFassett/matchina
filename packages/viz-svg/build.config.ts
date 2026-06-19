import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',
      format: "esm",
    }
  ],
  declaration: true,
  failOnWarn: false,
  externals: ['react', 'react-dom', 'matchina'],
})
