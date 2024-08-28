import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { chromeStorageKeys } from '@src/constant';
import { getModelType } from '@root/src/lib/store';

reloadOnUpdate('pages/background');
reloadOnUpdate('pages/content/style.scss');

let ollamaConfig = null;
let openaiConfig = null;
let claudeConfig = null;

const initOllama = ({ ollama_host, ai_model }) => {
  if (ollama_host && ai_model) {
    ollamaConfig = { baseUrl: ollama_host, model: ai_model };
  }
};

const initOpenAi = ({ ai_key, ai_model }) => {
  if (ai_key && ai_model) {
    openaiConfig = { apiKey: ai_key, model: ai_model };
  }
};

const initClaude = ({ ai_key, model }) => {
  if (ai_key && model) {
    claudeConfig = { apiKey: ai_key, model: model };
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    case 'CALL_LLM':
      (async () => {
        try {
          const modelType = getModelType(request.payload)?.[0]?.type;
          console.log(request.payload, { modelType });
          if (!ollamaConfig && modelType === 'ollama') {
            initOllama({ ollama_host: request.payload.ollama_host, ai_model: request.payload.ai_model });
          }
          if (!openaiConfig && modelType === 'gpt') {
            initOpenAi({ ai_key: request.payload.ai_key, ai_model: request.payload.ai_model });
          }
          if (!claudeConfig && modelType === 'claude') {
            console.log(request);
            initClaude({ ai_key: request.payload.ai_key, model: request.payload.ai_model });

            console.log({ claudeConfig });
          }

          const systemPrompt = request.payload.promptList.find(
            prompt => prompt.value === request.payload.activePrompt,
          ).description;
          const userInput = request.payload.input;

          let response;
          if (modelType === 'ollama') {
            response = await callOllama(ollamaConfig, systemPrompt, userInput);
          } else if (modelType === 'gpt') {
            response = await callOpenAI(openaiConfig, systemPrompt, userInput);
          } else if (modelType === 'claude') {
            response = await callClaude(claudeConfig, systemPrompt, userInput);
          }

          sendResponse(response);
        } catch (error) {
          console.log(error);
          sendResponse({ error: error.message });
        }
      })();
      return true;
    case 'INIT_OLLAMA':
      initOllama({ ollama_host: request.payload.ollama_host, ai_model: request.payload.ai_model });
      return true;
    case 'INIT_OPENAI':
      initOpenAi({ ai_key: request.payload.ai_key, ai_model: request.payload.ai_model });
      return true;
    case 'INIT_CLAUDE':
      initClaude({ api_key: request.payload.claude_key, model: request.payload.claude_model });
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

chrome.tabs.onActivated.addListener(function () {
  chrome.tabs.query({ active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'UPDATE_TAB' });
  });
});

chrome.runtime.onInstalled.addListener(function (object) {
  const internalUrl = chrome.runtime.getURL('src/pages/options/index.html');

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: internalUrl }, function () {
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

async function callOllama(config, systemPrompt, userInput) {
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    }),
  });
  const data = await response.json();
  return data.message.content;
}

async function callOpenAI(config, systemPrompt, userInput) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(config, systemPrompt, userInput) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01', // Make sure this matches Anthropic's current API version
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}
