import { defineBuildConfig } from 'unbuild'
import { copyFile, mkdir, readdir, stat } from 'fs/promises'
import { join, dirname, relative } from 'path'

async function copyTsFiles(srcDir: string, destDir: string, exclude: string[] = []) {
  const entries = await readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const relPath = relative('src', srcPath)

    // Skip excluded patterns
    if (exclude.some(pattern => relPath.includes(pattern))) continue

    if (entry.isDirectory()) {
      await copyTsFiles(srcPath, destDir, exclude)
    } else if (entry.name.endsWith('.ts')) {
      const destPath = join(destDir, relPath)
      await mkdir(dirname(destPath), { recursive: true })
      await copyFile(srcPath, destPath)
    }
  }
}

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
  hooks: {
    'build:done': async () => {
      console.log('Copying .ts files for live development...')
      await copyTsFiles('src', 'dist', ['dev'])
      console.log('✓ TypeScript files copied')
    }
  }
})