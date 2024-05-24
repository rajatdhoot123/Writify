/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/prop-types */
import { getCurrentUser } from '@root/src/lib/supabase';
import Dropdown from '@root/src/components/Dropdown';
import { useCallback, useEffect, useState } from 'react';
import useStore from '@root/src/lib/store';
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
import toast from 'react-hot-toast';
import Loader from '@root/src/components/loader';


const AiTweetToolbar = ({ dispatch, state, handleGenerateAiTweet, loader }) => {
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

      <button
        className="tweet-button"
        onClick={async () => {
          await chrome.runtime.sendMessage({
            action: 'OPEN_SETTING_PAGE',
          });
        }}>
        <span>Settings</span>
      </button>
      <button className="tweet-button" id="ai-tweet-button" onClick={handleGenerateAiTweet}>
        <span>{loader && <Loader source="twitter" />}</span>
        <span>AI Tweet</span>
      </button>
    </div>
  );
};

export default function NewApp() {
  const [state, dispatch] = useStore();
  const [loader, setLoader] = useState(false);

  // const [activeUrl, setActiveUrl] = useState(document.location.href);
  const [refresh, setRefresh] = useState(null);

  const chatModel = useCallback(
    () => {
      return new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || state.openAiKey,
      });
    },
    [state.openAiKey], // Add an empty array as the second argument
  );

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

  const handleGenerateAiTweet = async event => {
    if (!state.openAiKey) {
      return toast.custom(
        <div className="bg-red-500 font-semibold p-2 text-white rounded-md z-[999] relative text-sm">
          Set Open AI config key click{' '}
          <button
            onClick={async () => {
              await chrome.runtime.sendMessage({
                action: 'OPEN_SETTING_PAGE',
              });
            }}>
            Settings
          </button>
        </div>,
      );
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
