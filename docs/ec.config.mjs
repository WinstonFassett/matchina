import pluginTwoslash from 'expressive-code-twoslash';
import { pluginCodeCut } from './src/lib/code-cut.mjs';

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
  themes: ['github-light', 'github-dark'],
  useDarkModeMediaQuery: false,
  themeCssSelector: (theme) =>
    theme.type === 'dark' ? '[data-theme$="dark"]' : ':root',
  plugins: [pluginCodeCut(), pluginTwoslash({ includeJsDoc: false })],
};
