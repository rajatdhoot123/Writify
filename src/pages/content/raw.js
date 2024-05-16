async function generateInspiration(apiKey, keywords, toneTypeName, tool, inspirationTypeId, replyingTo, language) {
  try {
    const body = {
      keywords,
      tool,
      inspirationTypeId,
      'tone-type-name': toneTypeName,
      language,
    };
    if (replyingTo) body.replyingTo = replyingTo;

    const response = await fetch('https://TweetAI.com/api/v1/rest/inspiration/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    return response.json();
  } catch (error) {
    alert(`Sorry, an error occurred, please try again later and contact support quoting this error: ${error}`);
    console.error('Error occurred:', error);
    return null;
  }
}

async function validateApiKey(apiKey) {
  try {
    const response = await fetch('https://TweetAI.com/api/v1/rest/key/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.json();
  } catch (error) {
    alert(`Sorry, an error occurred, please try again later and contact support quoting this error: ${error}`);
    console.error('Error occurred:', error);
    return null;
  }
}

const findClosest = (element, selector) => {
  let currentElement = element;
  while (currentElement.parentNode && !currentElement.querySelector(selector)) {
    currentElement = currentElement.parentNode;
  }
  return currentElement.querySelector(selector);
};

const filterElements = (selector, text) => {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).filter(element => RegExp(text).test(element.textContent));
};

const findButtonByText = text => {
  const buttons = document.querySelectorAll('div[role="button"]');
  return Array.from(buttons).find(button => button.textContent === text);
};

const findAllButtonsByText = text => {
  const buttons = document.querySelectorAll('div[role="button"]');
  return Array.from(buttons).filter(button => button.textContent === text);
};

const findAllDivsByText = text => {
  const divs = document.querySelectorAll('div');
  return Array.from(divs).filter(div => div.textContent === text);
};

const spinnerSvg = `
  <svg class="animate-spin mx-auto h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
`;

async function main() {
  const actionTypes = {
    Post: 'tweet',
    Reply: 'reply',
    Posten: 'tweet',
    Antworten: 'reply',
    Objavi: 'tweet',
    Odgovori: 'reply',
    Posting: 'tweet',
    Balas: 'reply',
    Postovat: 'tweet',
    Odpovědět: 'reply',

    Plaatsen: 'tweet',
    Beantwoorden: 'reply',
    'I-post': 'tweet',
    Sumagot: 'reply',

    Julkaise: 'tweet',
    Vastaa: 'reply',
    Poster: 'tweet',
    Répondre: 'reply',
    Δημοσίευση: 'tweet',
    Απάντηση: 'reply',
    פרסם: 'tweet',
    השב: 'reply',
    पोस्ट: 'tweet',
    'जवाब दें': 'reply',
    Bejegyzés: 'tweet',
    Válasz: 'reply',
    Pubblica: 'tweet',
    Rispondi: 'reply',
    ポストする: 'tweet',
    返信: 'reply',
    게시하기: 'tweet',
    답글: 'reply',
    Publiser: 'tweet',
    Svar: 'reply',
    'Opublikuj wpis ': 'tweet',
    Odpowiedz: 'reply',
    Postar: 'tweet',
    Responder: 'reply',
    Postare: 'tweet',
    Răspunde: 'reply',
    'Опубликовать пост': 'tweet',
    Ответить: 'reply',
    发帖: 'tweet',
    回复: 'reply',
    'Uverejniť ': 'tweet',
    Odpovedať: 'reply',
    Postear: 'tweet',
    'Gör ett inlägg': 'tweet',
    Svara: 'reply',
    發佈: 'tweet',
    回覆: 'reply',
    Gönder: 'tweet',
    Yanıtla: 'reply',
    'Опублікувати пост': 'tweet',
    Відповісти: 'reply',
    Đăng: 'tweet',
    'Trả lời': 'reply',
  };

  const inspirationTypes = {
    'Viral (best effort)': '6',
    'Question (high engagement)': '3',
    // ... (other types)
  };

  const toneTypes = {
    Positive: '8',
    'One word / Very short': '15',
    // ... (other types)
  };

  for (const [selectorText, requestType] of Object.entries(actionTypes)) {
    const isTweet = requestType === 'tweet';
    const boxes = isTweet ? findAllDivsByText(selectorText) : findAllButtonsByText(selectorText);

    boxes.forEach(box => {
      if (box) {
        const toolbar = box.closest('[data-testid="toolBar"]');
        if (toolbar && !toolbar.parentNode.querySelector('#tweetai-toolbar')) {
          const toolbarDiv = document.createElement('div');
          toolbarDiv.id = 'tweetai-toolbar';
          toolbarDiv.className = 'tweetai-ext flex flex-row justify-between';

          const input = document.createElement('input');
          input.type = 'text';
          input.id = 'ext-input-keywords';
          input.className = 'ext-input-keywords w-1/4 focus:outline-none focus:ring-0 border-inherit';
          input.placeholder = 'Keywords...';
          input.autocomplete = 'off';

          const button = document.createElement('button');
          button.innerText = isTweet ? 'Inspire Tweet' : 'Inspire Reply';
          button.title = 'Clicking this will NOT post anything.';
          button.className = 'tweetai-btn leading-5 w-1/3 ml-auto tooltip text-center hover:cursor-pointer';

          const select = document.createElement('select');
          select.id = 'tweetai-inspiration-type';
          select.className = 'inspiration-type w-1/3 form-select focus:ring-0';

          const options = isTweet ? inspirationTypes : toneTypes;
          Object.entries(options).forEach(([name, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.innerText = name;
            select.appendChild(option);
          });

          toolbarDiv.append(input, select, button);
          toolbar.parentNode.prepend(toolbarDiv);

          button.addEventListener('click', async event => {
            event.preventDefault();

            const spinner = document.createElement('span');
            spinner.className = 'tweetai-spinner';
            spinner.innerHTML = spinnerSvg;

            button.innerText = '';
            button.disabled = true;
            button.appendChild(spinner);

            const apiKey = await getStorageValue('tweetaiApiKey');
            const toneOfVoice = await getStorageValue('toneOfVoice');
            const language = await getStorageValue('language');
            const keywords = input.value;
            const inspirationTypeId = select.value;
            const replyText = isTweet ? null : box.textContent.trim();

            if (!apiKey) {
              showApiKeyPrompt();
              button.innerText = isTweet ? 'Inspire Tweet' : 'Inspire Reply';
              button.disabled = false;
              return;
            }

            const inspiration = await generateInspiration(
              apiKey,
              keywords,
              toneOfVoice,
              requestType,
              inspirationTypeId,
              replyText,
              language,
            );

            if (inspiration?.success) {
              const inspirationText = inspiration.inspiration
                .replace('#Reply', '')
                .replace('" #Reply"', '')
                .replace('Reply: ');
              const contentEditable = findClosest(event.target, '[contenteditable="true"]');
              if (contentEditable) {
                setTimeout(() => {
                  clearContent(contentEditable);
                  contentEditable.dispatchEvent(new InputEvent('textInput', { data: inspirationText, bubbles: true }));
                }, 100);
              }
            } else {
              showOutOfCreditsPrompt();
            }

            button.innerText = isTweet ? 'Inspire Tweet' : 'Inspire Reply';
            button.disabled = false;
          });
        }
      }
    });
  }
}

function clearContent(element) {
  if (element.contentEditable === 'true') {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    element.dispatchEvent(event);
  }
}

function getStorageValue(key) {
  return new Promise(resolve => {
    chrome.storage.sync.get(key, result => {
      resolve(result[key]);
    });
  });
}

function showApiKeyPrompt() {
  // ... (implementation)
}

function showOutOfCreditsPrompt() {
  // ... (implementation)
}

setInterval(main, 750);
