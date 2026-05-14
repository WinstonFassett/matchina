import pluginTwoslash from 'expressive-code-twoslash';

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
  themes: ['github-light', 'github-dark'],
  useDarkModeMediaQuery: false,
  themeCssSelector: (theme) =>
    theme.type === 'dark' ? '[data-theme$="dark"]' : ':root',
  plugins: [pluginTwoslash({ includeJsDoc: false })],
};
