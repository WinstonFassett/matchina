import esbuild from "esbuild";
import path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildOptions = {
  entryPoints: [
    path.resolve(__dirname, "../src/lib/starlight-typedoc/register-theme.ts"),
  ],
  bundle: true,
  platform: "node",
  outfile: path.resolve(__dirname, "../dist/typedoc-plugin/register-theme.cjs"),
  format: "cjs",
  sourcemap: false,
  external: ["typedoc", "typedoc-plugin-markdown"],
};

if (process.argv.includes("--watch")) {
  esbuild
    .context(buildOptions)
    .then((ctx) => {
      ctx.watch();
      console.log("Watching for changes...");
    })
    .catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
