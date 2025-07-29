import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['docs/src/lib/starlight-typedoc/register-theme.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'docs/dist/typedoc-plugin/register-theme.js',
  format: 'cjs',
  sourcemap: false,
  external: ['typedoc', 'typedoc-plugin-markdown'],
}).catch(() => process.exit(1));
