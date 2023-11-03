import type { KnipConfig } from 'knip';

const config = async (): Promise<KnipConfig> => ({
  entry: ['src/index.ts'],
  project: ['src/**/*.ts'],
});

export default config;