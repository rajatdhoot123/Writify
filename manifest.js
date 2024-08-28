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
  name: 'Writify: Grow your Twitter audience, scrape thousands of tweets, and enhance your Slack messages',
  version: packageJson.version,
  description:
    'Writify helps you write five times better tweets with custom agents and scrape tweets and threads for multiple use cases. Plus, enhancing your Slack messenging is super handy !',
  permissions: ['storage', 'sidePanel', 'tabs', 'declarativeNetRequest'],
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
  icons: {
    128: 'icon128.png',
  },
  content_scripts: [
    {
      // matches: ['http://*/*', 'https://*/*', '<all_urls>'], For all urls
      matches: ['https://*.twitter.com/*', 'https://*.x.com/*', 'https://*.slack.com/*'],
      js: ['src/pages/contentInjected/index.js'],
      // KEY for cache invalidation
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
    {
      // matches: ['http://*/*', 'https://*/*', '<all_urls>'], For all urls
      matches: ['https://*.twitter.com/*', 'https://*.x.com/*', 'https://*.slack.com/*'],
      js: ['src/pages/contentUI/index.js'],
    },
  ],
  devtools_page: 'src/pages/devtools/index.html',
  host_permissions: [
    'http://*:11434/api/tags',
    'http://*:11434/api/generate',
    'https://*:11434/api/tags',
    'https://*:11434/api/generate',
    'https://api.anthropic.com/v1/messages',
  ],
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon128.png', 'icon32.png', 'assets/png/*.png'],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
