/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/prop-types */
import { getCurrentUser } from '@root/src/lib/supabase';
import Dropdown from '@root/src/components/Dropdown';
import TweetConfig from '@root/src/components/TweetConfig';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createPortal } from 'react-dom';
import { actionTypes } from '../../../constant/actionTypes';
import {
  findButtonsByText,
  findDivsByText,
  findClosestParent,
  findClosest,
  clearContent,
} from '@root/src/lib/extension';

const Loader = () => {
  return (
    <div role="status" className="custom-loader">
      <svg
        aria-hidden="true"
        className="custom-loader-svg"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
};

const AiTweetToolbar = ({ dispatch, state, handleGenerateAiTweet, loader, handleConfig }) => {
  return (
    <div
      className="twittity"
      style={{
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '5',
      }}>
      <Dropdown dispatch={dispatch} promptList={state.promptList} activePrompt={state.activePrompt} />
      <button
        id="ai-tweet-button"
        onClick={handleGenerateAiTweet}
        style={{
          display: 'flex',
          margin: '0 5px',
          alignItems: 'center',
          fontFamily:
            'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: 'rgb(29, 161, 242)',
          cursor: 'pointer',
          color: 'white',
          height: '36px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '15px',
          fontWeight: 'bold',
          float: 'right',
          borderWidth: 'initial',
          borderStyle: 'none',
          borderColor: 'initial',
          borderImage: 'initial',
          borderRadius: '25px',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(18, 129, 201)')
        }
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(29, 155, 240)')
        }
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(14, 106, 166)')
        }
        onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgb(29, 155, 240)';
        }}>
        <span>{loader && <Loader />}</span>
        <span>Generate AI Tweet</span>
      </button>
      <button
        onClick={handleConfig}
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily:
            'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: 'rgb(29, 161, 242)',
          cursor: 'pointer',
          color: 'white',
          height: '36px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '15px',
          fontWeight: 'bold',
          float: 'right',
          borderWidth: 'initial',
          borderStyle: 'none',
          borderColor: 'initial',
          borderImage: 'initial',
          borderRadius: '25px',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(18, 129, 201)')
        }
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(29, 155, 240)')
        }
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = 'rgb(14, 106, 166)')
        }
        onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = 'rgb(29, 155, 240)';
        }}>
        <span>Config</span>
      </button>
    </div>
  );
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_OPEN_AI_KEY':
      return {
        ...state,
        openAiKey: action.payload,
      };
    case 'SET_CONFIG_TOGGLE':
      return {
        ...state,
        isConfigOpen: !state.isConfigOpen,
      };
    case 'SET_PROMPT_LIST':
      return {
        ...state,
        promptList: action.payload,
      };
    case 'SET_ACTIVE_PROMPT':
      return {
        ...state,
        activePrompt: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
  }
  // ...
}

export default function NewApp() {
  const [loader, setLoader] = useState(false);

  const [state, dispatch] = useReducer(reducer, {
    openAiKey: '',
    promptList: [
      { value: 'general', label: 'Your are tweet expert' },
      { value: 'genera2', label: 'Your are tweet export' },
    ],
    activePrompt: 'general',
    user: {},
  });
  const [activeUrl, setActiveUrl] = useState(document.location.href);
  const [refresh, setRefresh] = useState(null);
  const [inputText, setInputText] = useState('');

  const handleResetOpenAi = () => {
    chrome.storage.sync.remove(['open_ai_key'], function () {
      dispatch({ type: 'SET_OPEN_AI_KEY', payload: '' });
    });
  };

  const chatModel = useCallback(
    () => {
      return new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || state.openAiKey,
      });
    },
    [state.openAiKey], // Add an empty array as the second argument
  );

  useEffect(() => {
    if (!state.openAiKey) {
      chrome?.storage?.sync.get(/* String or Array */ ['open_ai_key', 'promptList'], function (items) {
        dispatch({ payload: items.open_ai_key || '', type: 'SET_OPEN_AI_KEY' });
        dispatch({ payload: items.promptList || '', type: 'SET_PROMPT_LIST' });
      });
    }
  }, [state.openAiKey]);

  useEffect(() => {
    document.addEventListener('input', function (e) {
      if ((e.target as HTMLElement).getAttribute('role') === 'textbox') {
        const text = (e.target as HTMLElement).textContent;
        // Process the text and prepare suggestions
        setInputText(text);
      }
    });
  }, []);

  useEffect(() => {
    const observeUrlChange = () => {
      let oldHref = document.location.href;
      const body = document.querySelector('body');
      const observer = new MutationObserver(mutations => {
        if (oldHref !== document.location.href) {
          oldHref = document.location.href;
          setActiveUrl(oldHref);
        }
      });
      observer.observe(body, { childList: true, subtree: true });
    };
    observeUrlChange();
  }, []);

  useEffect(() => {
    const toolSuit_id = 'tweetify-ai';
    const timeoutId = setInterval(() => {
      (async () => {
        // if (activeUrl.includes('/compose')) {
        //   await waitForElm('[data-testid="unsentButton"]');
        // }
        for (const [postType, requestType] of Object.entries(actionTypes)) {
          let tweetBoxes = findDivsByText(postType) || findButtonsByText(postType);

          if (window.location.host === 'pro.twitter.com') {
            tweetBoxes = findButtonsByText(postType);
          }

          if (tweetBoxes) {
            tweetBoxes.forEach(async tweetBox => {
              if (tweetBox) {
                let toolbar = tweetBox.closest('[data-testid="toolBar"]');

                if (!toolbar) {
                  toolbar = findClosestParent(tweetBox, '[data-testid="toolBar"]');
                }

                if (toolbar && !toolbar.parentNode.querySelector(`#${toolSuit_id}`)) {
                  const toolSuit = document.createElement('div');
                  toolSuit.id = toolSuit_id;

                  setRefresh(crypto.randomUUID());
                  toolbar.parentNode.prepend(toolSuit);

                  // const toolbarElement = createToolbarElement(requestType, postType, isTweet, toneTypes, inspirationTypes);
                  // toolbarElement.querySelector('button').addEventListener('click', async event => {
                  // await handleInspireButtonClick(event, requestType, isTweet, postType);
                  // });
                }
              }
            });
          }
        }
      })();
    }, 700);

    return () => {
      clearInterval(timeoutId);
    };
    // const activeUrlArr = activeUrl.split('/');
  }, []);

  const handleConfig = () => {
    dispatch({ type: 'SET_CONFIG_TOGGLE' });
  };

  const handleGenerateAiTweet = async event => {
    if (!state.openAiKey) {
      return dispatch({ type: 'SET_CONFIG_TOGGLE' });
    }
    setLoader(true);
    try {
      const twitterPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a social media expert skilled in creating engaging and shareable content. Your task is to take the following user-provided tweet and rewrite it to maximize engagement. Engagement includes likes, retweets, comments, and shares. Use a compelling tone, add relevant hashtags, and incorporate a call-to-action where appropriate. Ensure the tweet is clear, concise, and attention-grabbing',
        ],
        ['user', '{input}'],
      ]);
      const chain = twitterPrompt.pipe(chatModel);
      const response: any = await chain.invoke({
        input: inputText,
      });

      const contentEditable = findClosest(document.getElementById('ai-tweet-button'), '[contenteditable="true"]');

      if (contentEditable) {
        setTimeout(() => {
          clearContent(contentEditable);
          contentEditable.dispatchEvent(new InputEvent('textInput', { data: response.content, bubbles: true }));
        }, 100);
      }
      // document.querySelector('[data-text]').textContent = response.content;
      // document.querySelector('[data-text]').dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    } catch (err) {
      console.log(err);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      {[...document.querySelectorAll("[id='tweetify-ai']")].map((el, index) => {
        return createPortal(
          <AiTweetToolbar
            handleConfig={handleConfig}
            loader={loader}
            key={index}
            dispatch={dispatch}
            state={state}
            handleGenerateAiTweet={handleGenerateAiTweet}
          />,
          el as Element | DocumentFragment,
          crypto.randomUUID(),
        );
      })}
      {state.isConfigOpen && (
        <TweetConfig
          handleResetOpenAi={handleResetOpenAi}
          toggleModal={() => {
            dispatch({ type: 'SET_CONFIG_TOGGLE' });
          }}
          promptList={state.promptList}
          activePrompt={state.activePrompt}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}
