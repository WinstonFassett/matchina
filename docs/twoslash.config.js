import { createRequire } from "module";

const require = createRequire(import.meta.url);
const path = require("path");

// For resolving the matchina module correctly in Twoslash
export default {
  compilerOptions: {
    paths: {
      matchina: ["../src/index.ts"],
      "matchina/*": ["../src/*"],
    },
    baseUrl: ".",
    allowJs: true,
    module: "ESNext",
    target: "ESNext",
    jsx: "react-jsx",
    moduleResolution: "node",
  },
  include: ["../src/**/*"],
};
