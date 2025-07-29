import esbuild from 'esbuild';

const buildOptions = {
  entryPoints: ['docs/src/lib/starlight-typedoc/register-theme.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'docs/dist/typedoc-plugin/register-theme.cjs',
  format: 'cjs',
  sourcemap: false,
  external: ['typedoc', 'typedoc-plugin-markdown'],
};

if (process.argv.includes('--watch')) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
