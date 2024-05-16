async function generateInspiration(apiKey, keywords, toneType, tool, inspirationTypeId, replyingTo, language) {
  try {
    const requestBody = {
      keywords,
      tool,
      inspirationTypeId,
      'tone-type-name': toneType,
      language,
    };
    if (replyingTo) requestBody.replyingTo = replyingTo;

    const response = await fetch('https://TweetAI.com/api/v1/rest/inspiration/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  } catch (error) {
    alert('Sorry, an error occurred, please try again later and contact support quoting this error: ' + error);
    console.error('Error occurred:', error);
    return null;
  }
}

// Function to validate the API key
async function validateApiKey(apiKey) {
  try {
    const response = await fetch('https://TweetAI.com/api/v1/rest/key/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}),
    });

    return response.json();
  } catch (error) {
    alert('Sorry, an error occurred, please try again later and contact support quoting this error: ' + error);
    console.error('Error occurred:', error);
    return null;
  }
}

// Utility function to find the closest parent element matching a selector
const findClosestParent = (element, selector) => {
  let parent = element;
  while (parent.parentNode && !parent.querySelector(selector)) {
    parent = parent.parentNode;
  }
  return parent.querySelector(selector);
};

// Function to filter elements by text content
function filterElementsByText(selector, text) {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).filter(element => RegExp(text).test(element.textContent));
}

// Function to find a button by its text content
function findButtonByText(text) {
  const buttons = document.querySelectorAll('div[role="button"]');
  for (const button of buttons) {
    if (button.textContent === text) {
      return button;
    }
  }
  return null;
}

// Function to find multiple buttons by their text content
function findButtonsByText(text) {
  const buttons = document.querySelectorAll('div[role="button"]');
  const matchedButtons = [];
  for (const button of buttons) {
    if (button.textContent === text) {
      matchedButtons.push(button);
    }
  }
  return matchedButtons.length > 0 ? matchedButtons : null;
}

// Function to find multiple divs by their text content
function findDivsByText(text) {
  const divs = document.querySelectorAll('div');
  const matchedDivs = [];
  for (const div of divs) {
    if (div.textContent === text) {
      matchedDivs.push(div);
    }
  }
  return matchedDivs.length > 0 ? matchedDivs : null;
}

// SVG spinner element
const spinnerSvg = `
<svg class="animate-spin mx-auto -ml-1- mr-3- mt-1- h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>`;

// Main function to initialize the extension
async function initializeExtension() {
  const postTypes = {
    Post: 'tweet',
    Reply: 'reply',
    // Add other post types here...
  };

  const inspirationTypes = {
    'Viral (best effort)': '6',
    'Question (high engagement)': '3',
    // Add other inspiration types here...
  };

  const toneTypes = {
    Positive: '8',
    'One word / Very short': '15',
    // Add other tone types here...
  };

  for (const [postType, requestType] of Object.entries(postTypes)) {
    let isTweet = true;
    let tweetBoxes = findDivsByText(postType);
    if (window.location.host === 'pro.twitter.com') {
      tweetBoxes = findButtonsByText(postType);
    }

    if (tweetBoxes) {
      tweetBoxes.forEach(async (tweetBox, index) => {
        if (tweetBox) {
          let toolbar = tweetBox.closest('[data-testid="toolBar"]');
          if (!toolbar) {
            toolbar = findClosestParent(tweetBox, 'data-testid="toolBar"');
          }

          if (toolbar && !toolbar.parentNode.querySelector('#tweetai-toolbar')) {
            const toolbarElement = createToolbarElement(requestType, postType, isTweet, toneTypes, inspirationTypes);
            toolbar.parentNode.prepend(toolbarElement);

            toolbarElement.querySelector('button').addEventListener('click', async event => {
              await handleInspireButtonClick(event, requestType, isTweet, postType);
            });
          }
        }
      });
    }
  }
}

// Function to create the toolbar element
function createToolbarElement(requestType, postType, isTweet, toneTypes, inspirationTypes) {
  const toolbar = document.createElement('div');
  toolbar.id = 'tweetai-toolbar';
  toolbar.className = 'tweetai-ext flex flex-row justify-between';

  const keywordsInput = document.createElement('input');
  keywordsInput.type = 'text';
  keywordsInput.id = 'ext-input-keywords';
  keywordsInput.className =
    'ext-input-keywords w-[28%]- w-1/4 focus:outline-none focus:ring-0 focus:ring-offset-0 border-inherit';
  keywordsInput.placeholder = 'Keywords...';
  keywordsInput.autocomplete = 'off';

  const inspireButton = document.createElement('button');
  inspireButton.innerText = postType === 'reply' ? 'Inspire Reply' : 'Inspire Tweet';
  inspireButton.title = 'Clicking this will NOT post anything.';
  inspireButton.className =
    'tweetai-btn leading-5 sm:w-[26%]- w-1/3 ml-auto tooltip text-center leading-9- hover:cursor-pointer';

  const inspirationTypeSelect = document.createElement('select');
  inspirationTypeSelect.id = 'tweetai-inspiration-type';
  inspirationTypeSelect.className = 'inspiration-type w-[30%]- w-1/3 form-select- focus:ring-0 focus:ring-offset-0';

  const types = postType === 'reply' ? toneTypes : inspirationTypes;
  for (const [typeName, typeValue] of Object.entries(types)) {
    const option = document.createElement('option');
    option.value = typeValue;
    option.innerText = typeName;
    inspirationTypeSelect.appendChild(option);
  }

  toolbar.appendChild(keywordsInput);
  toolbar.appendChild(inspirationTypeSelect);
  toolbar.appendChild(inspireButton);

  return toolbar;
}

// Function to handle the click event of the inspire button
async function handleInspireButtonClick(event, requestType, isTweet, postType) {
  event.preventDefault();

  const inspireButton = event.target;
  const originalButtonText = inspireButton.innerText;
  const spinner = document.createElement('span');
  spinner.className = 'tweetai-spinner';
  spinner.innerHTML = spinnerSvg;

  inspireButton.innerText = '';
  inspireButton.disabled = true;
  inspireButton.appendChild(spinner);

  const apiKey = await getApiKey();
  const toneType = await getToneOfVoice();
  const language = await getLanguage();

  if (!apiKey) {
    showApiKeyInput();
    resetInspireButton(inspireButton, originalButtonText);
    return;
  }

  const inspirationType = document.getElementById('tweetai-inspiration-type').value;
  const keywords = document.getElementById('ext-input-keywords').value;

  const response = await generateInspiration(apiKey, keywords, toneType, requestType, inspirationType, null, language);

  if (!response?.success) {
    showNoCreditsMessage();
    resetInspireButton(inspireButton, originalButtonText);
    return;
  }

  if (response?.inspiration) {
    const inspirationText = response.inspiration.replace('#Reply', '').replace('" #Reply"', '').replace('Reply: ');
    const tweetBox = findClosestParent(event.target, '[contenteditable="true"]');

    setTimeout(() => {
      clearContentEditable(tweetBox);
      tweetBox.dispatchEvent(
        new InputEvent('textInput', {
          data: inspirationText,
          bubbles: true,
        }),
      );
    }, 100);
  }

  resetInspireButton(inspireButton, originalButtonText);
}

// Function to reset the inspire button to its original state
function resetInspireButton(button, originalText) {
  button.innerText = originalText;
  button.disabled = false;
}

// Function to clear the content of a contenteditable element
function clearContentEditable(element) {
  if (element.focus && element.contentEditable === 'true') {
    const range = document.createRange();
    range.selectNodeContents(element);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const deleteEvent = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
    });
    element.dispatchEvent(deleteEvent);
  }
}

// Function to get the API key from storage
function getApiKey() {
  return new Promise(resolve => {
    chrome.storage.sync.get('tweetaiApiKey', ({ tweetaiApiKey }) => {
      resolve(tweetaiApiKey);
    });
  });
}

// Function to get the tone of voice from storage
function getToneOfVoice() {
  return new Promise(resolve => {
    chrome.storage.sync.get('toneOfVoice', ({ toneOfVoice }) => {
      resolve(toneOfVoice);
    });
  });
}

// Function to get the language from storage
function getLanguage() {
  return new Promise(resolve => {
    chrome.storage.sync.get('language', ({ language }) => {
      resolve(language);
    });
  });
}

// Function to show the API key input form
function showApiKeyInput() {
  // Implement the function to show the API key input form
}

// Function to show the no credits message
function showNoCreditsMessage() {
  // Implement the function to show the no credits message
}

// Function to check if the background is dark
function isDarkBackground() {
  const body = document.querySelector('body');
  const backgroundColor = window.getComputedStyle(body).getPropertyValue('background-color');
  return backgroundColor.toLowerCase() !== 'rgb(255, 255, 255)' && backgroundColor.toLowerCase() !== '#ffffff';
}

// Function to find the closest element with a specific attribute
function findClosestElementWithAttribute(element, attribute) {
  let currentElement = element;
  while (currentElement) {
    if (currentElement.getAttribute(attribute)) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  for (currentElement = element; currentElement; currentElement = currentElement.parentElement) {
    const elements = currentElement.querySelectorAll(`[${attribute}]`);
    if (elements.length > 0) {
      return elements[0];
    }
  }
  return null;
}

// Function to check if the current tab URL starts with a specific prefix
function isCurrentTabUrlStartsWith(prefix) {
  return new Promise(resolve => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs && tabs[0]) {
          const urlStartsWithPrefix = tabs[0].url.startsWith(prefix);
          resolve(urlStartsWithPrefix);
        } else {
          resolve(false);
        }
      })
      .catch(() => {
        resolve(false);
      });
  });
}

// Initialize the extension at regular intervals
setInterval(initializeExtension, 750);

// Additional styles
const additionalStyles = '';
const debugMode = false;
