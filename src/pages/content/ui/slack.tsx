/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { findClosestParent, findClosest, clearContent } from '@root/src/lib/extension';
import useStore, { getModelType } from '@root/src/lib/store';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createPortal } from 'react-dom';
import Loader from '@root/src/components/loader';
import toast from 'react-hot-toast';

const toolSuit_id = 'slacker-ai';

const AiTweetToolbar = ({ handleGenerateAiTweet, loader }) => {
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
        gap: '2',
      }}>
      <button style={{ margin: 'auto 6px', display: 'flex' }} onClick={handleGenerateAiTweet}>
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
        style={{ margin: 'auto 6px', display: 'flex' }}
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
  const [state] = useStore();

  const useChatModel: any = [{ ad: 'dakf' }];
  const [chatModel] = useChatModel();

  const handleGenerateAiTweet = useCallback(
    async event => {
      if (!(state.ai_model && (getModelType(state)?.[0]?.type === 'ollama' ? state.ollama_host : state.ai_key))) {
        return toast.custom(
          <div className="bg-red-500 font-semibold p-2 text-white rounded-md z-[999] relative text-sm">
            Select model and api key or host from
            <button
              onClick={async () => {
                await chrome.runtime.sendMessage({
                  action: 'OPEN_SETTING_PAGE',
                });
              }}>
              setting button
            </button>
          </div>,
        );
      }

      setLoader(true);
      try {
        const contentEditable = findClosestParent(event.target, '.ql-editor');

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
            contentEditable.querySelector('p').innerText = response.content;
          }, 200);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoader(false);
      }
    },
    [chatModel, state.activePrompt, state.openAiKey, state.promptList],
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
          <AiTweetToolbar loader={loader} key={index} handleGenerateAiTweet={handleGenerateAiTweet} />,
          el as Element | DocumentFragment,
          crypto.randomUUID(),
        );
      })}
    </div>
  );
};

export default Slack;
