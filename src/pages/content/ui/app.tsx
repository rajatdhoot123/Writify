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
import Scrapper from '@root/src/components/Scrapper';
import { setStorageData } from '@root/src/lib/helper';

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
        gap: '2',
      }}>
      <Dropdown dispatch={dispatch} promptList={state.promptList} activePrompt={state.activePrompt} />

      <button className="tweet-button" onClick={handleConfig}>
        <span>Add Agent</span>
      </button>
      <button className="tweet-button" id="ai-tweet-button" onClick={handleGenerateAiTweet}>
        <span>{loader && <Loader />}</span>
        <span>AI Tweet</span>
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
}

export default function NewApp() {
  const [loader, setLoader] = useState(false);

  const [state, dispatch] = useReducer(reducer, {
    openAiKey: '',
    promptList: [
      {
        value: 'All-in-One AI Master Agent for Writing Tweets',
        label: `You are an AI assistant skilled in writing engaging and effective tweets for a wide variety of purposes. Your goal is to craft tweets that are concise, compelling, and tailored to the specific context or audience. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. You should be able to write tweets for different tones, such as informative, persuasive, humorous, or inspirational, while maintaining a natural and authentic voice. Additionally, you should incorporate relevant hashtags, mentions, and other elements to enhance the tweet's visibility and engagement. Please provide a draft tweet based on the provided context or topic.`,
      },
      {
        value: 'Improve My Writing Agent',
        label: ` You are an AI assistant specializing in improving and refining written content, particularly tweets. Your task is to take an existing draft tweet and enhance its grammar, clarity, and overall effectiveness. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. This may involve correcting any grammatical or spelling errors, rephrasing sentences for better flow and conciseness, and ensuring that the message is conveyed in a compelling and readable manner. Additionally, you should suggest ways to make the tweet more engaging, such as by incorporating relevant hashtags, mentions, or other elements that could increase its visibility and impact, while maintaining a natural and authentic voice. Please provide an improved version of the draft tweet, along with brief explanations for any significant changes made.`,
      },
      {
        value: 'Daily Tech Quote Writer Agent',
        label: `You are an AI assistant specializing in generating motivational and thought-provoking quotes related to technology and software development. Your task is to create a daily quote that can inspire and encourage developers, engineers, and tech enthusiasts. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. The quote should be concise, memorable, and capture an insightful or inspiring message about the ever-evolving world of technology, the challenges and rewards of coding, or the importance of continuous learning and innovation, while maintaining a natural and authentic voice. The quote should be tailored to be shareable on social media platforms like Twitter, so it should be attention-grabbing and suitable for a tweet. Please provide a fresh and engaging tech-related quote for the day.`,
      },
    ],
    activePrompt: 'All-in-One AI Master Agent for Writing Tweets',
    user: {},
  });
  // const [activeUrl, setActiveUrl] = useState(document.location.href);
  const [refresh, setRefresh] = useState(null);

  useEffect(() => {
    console.log('----------+++++==========');
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'UPDATE_TAB':
          return '';
      }
      return true;
      // return true <- this and the callback in background.js are what caused a crash in extensions page of my Google chrome
    });
  }, []);

  const chatModel = useCallback(
    () => {
      return new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || state.openAiKey,
      });
    },
    [state.openAiKey], // Add an empty array as the second argument
  );

  // useEffect(() => {
  //   if (!state.openAiKey) {
  //     chrome?.storage?.sync.get(/* String or Array */ ['open_ai_key', 'promptList'], function (items) {
  //       dispatch({ payload: items.open_ai_key || '', type: 'SET_OPEN_AI_KEY' });
  //       if (items.promptList) {
  //         dispatch({ payload: items.promptList || '', type: 'SET_PROMPT_LIST' });
  //       }
  //     });
  //   }
  // }, [state.openAiKey]);

  useEffect(() => {
    (async () => {
      await setStorageData(state);
    })();
  }, [state]);

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
      const contentEditable = findClosest(document.getElementById('ai-tweet-button'), '[contenteditable="true"]');

      const input = (contentEditable as HTMLElement).textContent;

      const twitterPrompt = ChatPromptTemplate.fromMessages([
        ['system', state.promptList.find(prompt => prompt.value === state.activePrompt).label],
        ['user', '{input}'],
      ]);
      const chain = twitterPrompt.pipe(chatModel);
      const response: any = await chain.invoke({
        input,
      });

      if (contentEditable) {
        contentEditable.focus();
        setTimeout(() => {
          clearContent(contentEditable);
          // Dispatch an input event to simulate user input
          contentEditable.dispatchEvent(new InputEvent('textInput', { data: response.content, bubbles: true }));
        }, 200);
      }
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
      <Scrapper />
    </div>
  );
}
