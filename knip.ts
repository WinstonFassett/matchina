import type { KnipConfig } from 'knip';

// eslint-disable-next-line require-await
const config = async (): Promise<KnipConfig> => ({
  entry: ['src/index.ts'],
  project: ['src/**/*.ts'],
});

export default config;