import { createRoot } from 'react-dom/client';
import App from '@pages/content/ui/app';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';
import { Toaster } from 'react-hot-toast';
import Slack from '@pages/content/ui/slack';

refreshOnUpdate('pages/content');

function addStyle(styleString) {
  const style = document.createElement('style');
  style.textContent = styleString;
  document.head.append(style);
}

// Add the scoped styles
const styles = `
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;

  --radius: 0.5rem;
.twittity {
  .tweet-button {
    justify-content: center;
    display: flex;
    margin: 0 5px;
    align-items: center;
    font-family: 'TwitterChirp', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: rgb(29, 161, 242);
    cursor: pointer;
    color: white;
    height: 36px;
    padding-left: 16px;
    padding-right: 16px;
    font-size: 15px;
    font-weight: bold;
    float: right;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    border-radius: 25px;
    transition: background-color 0.2s ease;
  }
  
  .tweet-button:hover {
    background-color: rgb(18, 129, 201);
  }
  
  .tweet-button:active {
    background-color: rgb(14, 106, 166);
  }
  
  .tweet-button:focus {
    outline: none;
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
  createRoot(rootIntoShadow).render(
    <>
      {window.location.host === 'app.slack.com' ? <Slack /> : <App />}
      <Toaster
        toastOptions={{
          success: {
            style: {
               backgroundColor: 'white',
              zIndex: 9999,
              padding: '10px',
              fontWeight: '600',
              borderRadius: '12px',
            },
          },
          error: {
            style: {
              fontWeight: '600',
              padding: '10px',
              borderRadius: '12px',
            },
          },
        }}
      />
    </>,
  );
}, 1000);
