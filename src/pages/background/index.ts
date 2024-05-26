import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { chromeStorageKeys } from '@src/constant';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getModelType } from '@root/src/lib/store';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

let ollama = null;
let openai = null;

const initOllama = ({ ollama_host, ai_model }) => {
  if (ollama_host && ai_model) {
    ollama = new ChatOllama({
      baseUrl: ollama_host, // Default value
      model: ai_model, // Default value
    });
  }
};

const initOpenAi = ({ ai_key, ai_model }) => {
  if (ai_key && ai_model) {
    openai = new ChatOpenAI({
      apiKey: ai_key, // Default value
      model: ai_model, // Default value
    });
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    case 'CALL_LLM':
      (async () => {
        try {
          if (!ollama && getModelType(request.payload)?.[0]?.type === 'ollama') {
            initOllama({ ollama_host: request.payload.ollama_host, ai_model: request.payload.ai_model });
          }
          if (!openai && getModelType(request.payload)?.[0]?.type === 'gpt') {
            initOpenAi({ ai_key: request.payload.ai_key, ai_model: request.payload.ai_model });
          }
          const twitterPrompt = ChatPromptTemplate.fromMessages([
            ['system', request.payload.promptList.find(prompt => prompt.value === request.payload.activePrompt).description],
            ['user', '{input}'],
          ]);
          let response;
          if (getModelType(request.payload)?.[0]?.type === 'ollama') {
            const chain = twitterPrompt.pipe(ollama);
            response = await chain.invoke({ input: request.payload.input });
          } else if (getModelType(request.payload)?.[0]?.type === 'gpt') {
            const chain = twitterPrompt.pipe(openai);
            response = await chain.invoke({ input: request.payload.input });
          }
          sendResponse(response.content);
        } catch (error) {
          console.log(error);
          sendResponse({ error: error.message });
        }
      })();
      return true;
      break;
    case 'INIT_OLLAMA':
      initOllama({ ollama_host: request.payload.ollama_host, ai_model: request.payload.ai_model });
      return true;
    case 'INIT_OPENAI':
      initOpenAi({ ai_key: request.payload.ai_key, ai_model: request.payload.ai_model });
      return true;
    case 'OPEN_SETTING_PAGE':
      chrome.runtime.openOptionsPage();
      return true;
      break;
    case 'signUpWithWeb':
      {
        const url = request.payload.url;

        // remove old listener if it exists
        chrome.tabs.onUpdated.removeListener(setTokens);
        // create a new auth tab
        chrome.tabs
          .create({
            url: url,
            active: true,
          })
          .then(() => {
            // add listener to that url and watch for custom_token query string param
            chrome.tabs.onUpdated.addListener(setTokens);
            sendResponse(request.action + ' executed');
          });
      }
      break;
    case 'signInWithGoogle': {
      // remove any old listener if exists
      chrome.tabs.onUpdated.removeListener(setTokens);
      const url = request.payload.url;

      // create new tab with that url
      chrome.tabs.create({ url: url, active: true }, () => {
        // add listener to that url and watch for access_token and refresh_token query string params
        chrome.tabs.onUpdated.addListener(setTokens);
        sendResponse(request.action + ' executed');
      });

      break;
    }

    default:
      break;
  }

  return true;
});

const setTokens = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  // once the tab is loaded
  if (tab.status === 'complete') {
    if (!tab.url) return;
    const url = new URL(tab.url);

    // at this point user is logged-in to the web app
    // url should look like this: https://my.webapp.com/#access_token=zI1NiIsInR5c&expires_in=3600&provider_token=ya29.a0AVelGEwL6L&refresh_token=GEBzW2vz0q0s2pww&token_type=bearer
    // parse access_token and refresh_token from query string params

    if (url.origin === import.meta.env.VITE_AUTH_HOST) {
      const params = url.searchParams;
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        if (!tab.id) return;

        // we can close that tab now
        await chrome.tabs.remove(tab.id);

        // store access_token and refresh_token in storage as these will be used to authenticate user in chrome extension
        await chrome.storage.sync.set({
          [chromeStorageKeys.gauthAccessToken]: accessToken,
        });
        await chrome.storage.sync.set({
          [chromeStorageKeys.gauthRefreshToken]: refreshToken,
        });

        // remove tab listener as tokens are set
        chrome.tabs.onUpdated.removeListener(setTokens);
      }
    }
  }
};

const SIDEBAR_ORIGIN = [];

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);

    // Check if the tab URL matches 'launchify.club' to enable the side panel
    if (SIDEBAR_ORIGIN.includes(url.origin)) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'src/pages/sidepanel/index.html',
        enabled: true,
      });
    } else {
      // Disables the side panel on all other sites
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      });
    }
  }
});

chrome.tabs.onActivated.addListener(function (info) {
  chrome.tabs.query({ active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'UPDATE_TAB' });
  });
});

chrome.runtime.onInstalled.addListener(function (object) {
  const internalUrl = chrome.runtime.getURL('src/pages/options/index.html');

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: internalUrl }, function (tab) {
      console.log('New tab launched with http://yoursite.com/');
    });
  }
});

const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType);

const domain = '127.0.0.1:11434';
const rules = [
  {
    id: 2,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: 'origin',
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: `http://${domain}`,
        },
      ],
    },
    condition: {
      resourceTypes: allResourceTypes,
    },
  },
];

chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: rules.map(rule => rule.id), // remove existing rules
  addRules: rules,
});
