import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: 'src/index.ts',
      builder: 'rollup'
    },
    {
      input: 'src/extras/react.ts',
      builder: 'rollup'
    }
  ],
  declaration: true,
  rollup: {
    emitCJS: true,  
  },
  externals: ['react', 'react-dom'],
})