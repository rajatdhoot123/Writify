import { createRoot } from 'react-dom/client';
import App from '@pages/content/ui/app';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';

refreshOnUpdate('pages/content');

function addStyle(styleString) {
  const style = document.createElement('style');
  style.textContent = styleString;
  document.head.append(style);
}

// Add the scoped styles
const styles = `
.twittity {
  .custom-loader {
    display: flex;
    margin-right: 0.5rem;
    justify-content: center;
    align-items: center;
  }
  
  .custom-loader-svg {
    width: 1rem;
    height: 1rem;
    color: #e5e7eb; /* text-gray-200 */
    animation: spin 1s linear infinite; /* animate-spin */
    fill: #2563eb; /* fill-blue-600 */
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}
  `;

addStyle(styles);

const root = document.createElement('div');
root.id = 'launcify-extension-root';

root.style.zIndex = '9999';
root.style.position = 'fixed';
root.style.top = '34px';
root.style.right = '34px';
document.body.appendChild(root);
const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });
shadowRoot.appendChild(rootIntoShadow);

/** Inject styles into shadow dom */
const styleElement = document.createElement('style');
styleElement.innerHTML = injectedStyle;
shadowRoot.appendChild(styleElement);

/**
 * https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/pull/174
 *
 * In the firefox environment, the adoptedStyleSheets bug may prevent contentStyle from being applied properly.
 * Please refer to the PR link above and go back to the contentStyle.css implementation, or raise a PR if you have a better way to improve it.
 */

setTimeout(() => {
  createRoot(rootIntoShadow).render(<App />);
}, 1000);
