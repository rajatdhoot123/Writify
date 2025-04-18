/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { findClosestParent, findClosest, clearContent } from '@root/src/lib/extension';
import useStore from '@root/src/lib/store';
import { createPortal } from 'react-dom';
import Loader from '@root/src/components/loader';
import toast from 'react-hot-toast';
import Dropdown from '@root/src/components/Dropdown';

const toolSuit_id = 'slacker-ai';

const AiTweetToolbar = ({ handleGenerateAiTweet, loader, dispatch, promptList, activePrompt }) => {
  return (
    <div
      className="twittity"
      style={{
        borderRadius: '6px',
        marginLeft: '4px',
        backgroundColor: '#007a5a',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px',
        padding: '0 2px',
      }}>
      <div style={{ maxWidth: '120px', minWidth: '80px' }}>
        <Dropdown dispatch={dispatch} promptList={promptList} activePrompt={activePrompt} theme="slack" />
      </div>
      <button style={{ margin: 'auto 2px', display: 'flex' }} onClick={handleGenerateAiTweet}>
        {loader ? (
          <Loader source="slack" />
        ) : (
          <svg
            style={{ height: '16px', width: '16px' }}
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg">
            <path d="m22 2-7 20-4-9-9-4Z"></path>
            <path d="M22 2 11 13"></path>
          </svg>
        )}
      </button>

      <button
        style={{ margin: 'auto 2px', display: 'flex' }}
        onClick={async () => {
          await chrome.runtime.sendMessage({
            action: 'OPEN_SETTING_PAGE',
          });
        }}>
        <svg
          style={{ height: '16px', width: '16px' }}
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 512 512"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
            d="M262.29 192.31a64 64 0 1 0 57.4 57.4 64.13 64.13 0 0 0-57.4-57.4zM416.39 256a154.34 154.34 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.48 164.48 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22 155.3 155.3 0 0 1-21.46-12.57 16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.48 164.48 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22 155.3 155.3 0 0 1 21.46 12.57 16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47z"></path>
        </svg>
      </button>
    </div>
  );
};

const Slack = () => {
  const [loader, setLoader] = useState(false);
  const [refresh, setRefresh] = useState(window.crypto.randomUUID());
  const [state, dispatch] = useStore();

  const handleGenerateAiTweet = useCallback(
    async event => {
      // Add more detailed logging
      console.log('HandleGenerateAiTweet State:', {
        fullState: state,
        modelConfig: state?.modelConfig,
        promptList: state?.promptList,
      });
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
        const contentEditable = findClosestParent(event.target, '.ql-editor');

        const input = (contentEditable as HTMLElement).textContent;
        const activePromptObj = state.promptList.find(p => p.value === state.settings.active_prompt);

        const payload = {
          contents: [
            {
              parts: [
                { text: activePromptObj?.description || '' }, // System prompt
                { text: '\n\n' }, // Separator
                { text: input || '' }, // User input
              ],
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

        if (contentEditable) {
          contentEditable.focus();
          setTimeout(() => {
            clearContent(contentEditable);
            // Dispatch an input event to simulate user input
            contentEditable.querySelector('p').innerText = improvedText;
          }, 200);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoader(false);
      }
    },
    [state],
  );

  useEffect(() => {
    setInterval(() => {
      const editors = document.getElementsByClassName('ql-editor');

      [...editors].forEach(el => {
        const toolbar = findClosest(el, '[data-qa=wysiwyg-container_suffix]');
        if (toolbar && !toolbar.querySelector(`#${toolSuit_id}`)) {
          const toolSuit = document.createElement('div');
          toolSuit.id = toolSuit_id;
          // toolSuit.className =
          //   'c-button-unstyled c-icon_button c-icon_button--size_small c-wysiwyg_container__button c-wysiwyg_container__button--send c-icon_button--default';
          // toolSuit.textContent = 'AI';

          // toolSuit.innerHTML = `<p style="margin: auto;">AI</p>`;
          // toolSuit.onclick = handleGenerateAiTweet;
          toolbar.append(toolSuit);
          setRefresh(window.crypto.randomUUID());
        }
      });
    }, 2000);
  }, [handleGenerateAiTweet]);

  return (
    <div>
      {[...document.querySelectorAll(`[id='${toolSuit_id}']`)].map((el, index) => {
        return createPortal(
          <AiTweetToolbar
            loader={loader}
            key={index}
            handleGenerateAiTweet={handleGenerateAiTweet}
            dispatch={dispatch}
            promptList={state.promptList}
            activePrompt={state.settings.active_prompt}
          />,
          el as Element | DocumentFragment,
          crypto.randomUUID(),
        );
      })}
    </div>
  );
};

export default Slack;
