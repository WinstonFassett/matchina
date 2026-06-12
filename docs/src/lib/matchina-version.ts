import pkg from "@lib/package.json";

export const matchinaVersion = pkg.version;

export const cdnUrls = {
  esm: (exportsList?: string) =>
    exportsList
      ? `https://esm.sh/matchina@${matchinaVersion}?bundle&exports=${exportsList}`
      : `https://esm.sh/matchina@${matchinaVersion}`,
  jsdelivr: `https://cdn.jsdelivr.net/npm/matchina@${matchinaVersion}/+esm`,
};
