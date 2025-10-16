/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/prop-types */
import Dropdown from '@root/src/components/Dropdown';
import { useEffect, useState } from 'react';
import useStore from '@root/src/lib/store';
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
import TweetIntelligenceButton from '@root/src/components/TweetIntelligenceButton';
import TweetIntelligenceViewer from '@root/src/components/TweetIntelligenceViewer';
import toast from 'react-hot-toast';
import Loader from '@root/src/components/loader';
import { Settings } from 'lucide-react';
import { getPromptText } from '@root/lib/prompt';

const AiTweetToolbar = ({ dispatch, state, handleGenerateAiTweet, loader }) => {
  // Define tone options similar to how promptList is structured
  const toneList = [
    { value: 'friendly', label: 'Friendly', description: 'Friendly tone' },
    { value: 'formal', label: 'Formal', description: 'Formal tone' },
    { value: 'witty', label: 'Witty', description: 'Witty tone' },
  ];

  return (
    <div
      className="twittity"
      style={{
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
      {/* Prompt Dropdown */}
      <div style={{ flex: 1 }}>
        <Dropdown
          theme="twitter"
          dispatch={dispatch}
          promptList={state.promptList}
          activePrompt={state.settings.active_prompt}
          displayLabel={state.promptList.find(p => p.value === state.settings.active_prompt)?.label}
        />
      </div>
      {/* Tone Dropdown */}
      <div style={{ flex: 1 }}>
        <Dropdown
          theme="twitter"
          dispatch={dispatch}
          promptList={toneList}
          activePrompt={state.settings?.tone || 'friendly'}
          type="tone"
          displayLabel={toneList.find(p => p.value === state.settings?.tone)?.label || 'Friendly'}
        />
      </div>
      {/* Settings Icon Button */}
      <button
        className="tweet-button"
        onClick={async () => {
          await chrome.runtime.sendMessage({
            action: 'OPEN_SETTING_PAGE',
          });
        }}
        style={{
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgb(29, 155, 240)',
        }}>
        <Settings size={18} />
      </button>

      {/* AI Tweet Button */}
      <button
        className="tweet-button"
        id="ai-tweet-button"
        onClick={handleGenerateAiTweet}
        style={{
          backgroundColor: 'rgb(29, 155, 240)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '9999px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '15px',
        }}>
        {loader && <Loader source="twitter" />}
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

  const handleGenerateAiTweet = async () => {
    // For Ollama models, check if model and host are selected
    // For other models, these checks are not needed
    const needsOllamaConfig = state.modelConfig.type === 'ollama';
    const hasModelSelected = needsOllamaConfig ? !!state.modelConfig.model : true;
    const hasValidHost = needsOllamaConfig ? !!state.modelConfig.host : true;

    // Show error if any required config is missing
    if (!state.modelConfig.type || !hasModelSelected || !hasValidHost) {
      let errorMessage = 'Please ';
      if (!state.modelConfig.type) {
        errorMessage += 'select a model type';
      } else if (!hasModelSelected) {
        errorMessage += 'select a model';
      } else {
        errorMessage += 'provide valid Ollama host';
      }

      return toast.custom(
        <div className="bg-red-500 font-semibold p-2 text-white rounded-md z-[999] relative text-sm">
          {errorMessage} in the
          <button
            onClick={async () => {
              await chrome.runtime.sendMessage({
                action: 'OPEN_SETTING_PAGE',
              });
            }}>
            {' settings'}
          </button>
        </div>,
      );
    }
    setLoader(true);
    try {
      const contentEditable = findClosest(document.getElementById('ai-tweet-button'), '[contenteditable="true"]');
      const input = (contentEditable as HTMLElement).textContent;

      // Find the active prompt from state's promptList (includes both built-in and custom prompts)
      const activePromptObj = state.promptList.find(p => p.value === state.settings.active_prompt);

      if (!activePromptObj) {
        throw new Error('No prompt selected');
      }

      // Generate prompt text based on whether it's custom or built-in
      const systemPrompt = getPromptText(activePromptObj, state.settings?.tone || 'friendly');

      // Prepare payload with the system prompt
      const payload = {
        contents: [
          {
            parts: [{ text: systemPrompt }, { text: '\n\n' }, { text: input || '' }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          response_mime_type: 'application/json',
          response_schema: {
            type: 'OBJECT',
            properties: {
              improved_text: { type: 'STRING' },
              explanation: { type: 'STRING' },
            },
            required: ['improved_text'],
          },
        },
      };

      const response: any = await chrome.runtime.sendMessage({
        action: 'CALL_LLM',
        payload,
      });

      if (contentEditable) {
        contentEditable.focus();
        setTimeout(() => {
          clearContent(contentEditable);

          try {
            // Handle the nested Gemini API response structure
            let improvedText = '';

            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
              // Parse the JSON string from the text field
              const parsedResponse = JSON.parse(response.candidates[0].content.parts[0].text);
              improvedText = parsedResponse.improved_text;

              // Optionally log the explanation
              if (parsedResponse.explanation) {
                console.log('Explanation:', parsedResponse.explanation);
              }
            } else if (response.error) {
              improvedText = response.error;
            }

            contentEditable.dispatchEvent(
              new InputEvent('textInput', {
                data: improvedText,
                bubbles: true,
              }),
            );
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            contentEditable.dispatchEvent(
              new InputEvent('textInput', {
                data: 'Error processing response',
                bubbles: true,
              }),
            );
          }
        }, 200);
      }
    } catch (err) {
      console.error('Error generating tweet:', err);
      toast.error('Failed to generate tweet');
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
      <TweetIntelligenceButton />
      <TweetIntelligenceViewer />
    </div>
  );
}
