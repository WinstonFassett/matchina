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
