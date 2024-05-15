import fs from 'node:fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  /**
   * if you want to support multiple languages, you can use the following reference
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
   */
  name: 'Tweetify',
  version: packageJson.version,
  description: 'Tweetify is a browser extension that helps you to write tweets in a better way.',
  permissions: ['storage', 'sidePanel', 'tabs'],
  side_panel: {
    default_path: 'src/pages/sidepanel/index.html',
  },
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon32.png',
  },
  chrome_url_overrides: {
    newtab: 'src/pages/newtab/index.html',
  },
  icons: {
    128: 'icon128.png',
  },
  content_scripts: [
    {
      // matches: ['http://*/*', 'https://*/*', '<all_urls>'], For all urls
      matches: ['https://*.launchify.club/*', 'https://*.twitter.com/*'],
      js: ['src/pages/contentInjected/index.js'],
      // KEY for cache invalidation
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
    {
      // matches: ['http://*/*', 'https://*/*', '<all_urls>'], For all urls
      matches: ['https://*.launchify.club/*', 'https://*.twitter.com/*'],
      js: ['src/pages/contentUI/index.js'],
    },
  ],
  devtools_page: 'src/pages/devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon128.png', 'icon32.png', 'assets/png/*.png'],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
