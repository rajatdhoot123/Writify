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

function reducer(state, action) {
  switch (action.type) {
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

const OpenAiKeyModal = ({ open_ai_key, set_open_ai_key, handleResetOpenAi, setIsModalOpen }) => {
  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: { open_ai_key: string } = { open_ai_key: '' }; // Initialize the data object with the required open_ai_key property
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    chrome?.storage?.sync?.set(data, function () {
      //  A data saved callback omg so fancy
      set_open_ai_key(data.open_ai_key);
    });
  };

  const handleStopPropagation = e => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleStopPropagation}
      className="relative z-[9999]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-[9999] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="m-5">
              {open_ai_key ? (
                <button
                  onClick={handleResetOpenAi}
                  type="submit"
                  className="w-full rounded-md p-2 bg-blue-600 text-sm font-semibold text-white transition-all duration-200 ease-in-out group-focus-within:bg-blue-400 group-focus-within:hover:bg-blue-600">
                  Reset Open Ai Key
                </button>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="group w-full">
                    <label
                      htmlFor="8"
                      className="inline-block w-full text-sm font-bold text-gray-700 transition-all duration-200 ease-in-out group-focus-within:text-black mb-2">
                      Enter Your Chat Gpt Api Key
                    </label>
                    <div className="relative flex items-center">
                      <input
                        name="open_ai_key"
                        id="8"
                        type="text"
                        className="peer relative h-10 w-full rounded-md bg-gray-50 pl-4 pr-20 outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-white focus:drop-shadow-lg"
                      />
                      <button
                        type="submit"
                        className="absolute right-0 h-10 w-16 rounded-r-md bg-blue-200 text-xs font-semibold text-white transition-all duration-200 ease-in-out group-focus-within:bg-blue-400 group-focus-within:hover:bg-blue-600">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SuggestionModal = ({
  input,
  setIsModalOpen,
  openAiKey,
  handleResetOpenAi,
  promptList,
  activePrompt,
  dispatch,
}: any) => {
  const [loader, setLoader] = useState(false);
  const chatModel = useCallback(
    () => {
      return new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || openAiKey,
      });
    },
    [openAiKey], // Add an empty array as the second argument
  );
  const [suggestions, setSuggestions] = useState({});

  useEffect(() => {
    (async () => {
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
        const response = await chain.invoke({
          input,
        });
        setLoader(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSuggestions(response as unknown as any[]); // Update the type of suggestions
      } catch (err) {
        setLoader(false);
      }
    })();
  }, [chatModel, input]);

  const handleStopPropagation = e => {
    e.stopPropagation();
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      onClick={handleStopPropagation}
      className="relative z-[9999]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-[9999] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className='my-2'>
                <Dropdown dispatch={dispatch} promptList={promptList} activePrompt={activePrompt} />
              </div>
              {loader && (
                <div role="status" className="flex justify-center items-center">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
              )}
              <div>
                <div className="font-semibold">Your tweet</div>
                <div className="whitespace-pre-wrap">{input}</div>
                <div className="w-full h-0.5 border my-4" />
                <div className="font-semibold">AI Tweet</div>
                <div className="whitespace-pre-wrap">{(suggestions as { content?: string })?.content}</div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="mt-3 ml-2 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Cancel
              </button>
              <button
                onClick={handleResetOpenAi}
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Reset OpenAi Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to update the Twitter textbox
function updateTwitterTextbox(newText) {
  // Select the element with the role 'textbox'
  const textbox = document.querySelector('[role="textbox"]');

  // Check if the textbox exists
  if (textbox) {
    // Select the first child element within the textbox
    const firstChild = textbox.firstChild;

    // Check if the first child exists
    if (firstChild) {
      // Find the span with the attribute data-text="true"
      const innerSpan = (firstChild as HTMLElement).querySelector('[data-text="true"]');

      // Check if the inner span exists
      if (innerSpan) {
        // Update the text content of the inner span
        innerSpan.textContent = newText;

        // Trigger input events to ensure that Twitter recognizes the change
        // Blur and focus again to trigger any focus-related updates
        (textbox as HTMLInputElement).blur();
        (textbox as HTMLInputElement).focus();
      } else {
        console.error('Inner span element not found');
      }
    } else {
      console.error('First child element not found');
    }
  } else {
    console.error('Textbox element not found');
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { promptList: [], activePrompt: 0, user: {} });
  const [open_ai_key, set_open_ai_key] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const handleResetOpenAi = () => {
    chrome.storage.sync.remove(['open_ai_key'], function () {
      set_open_ai_key('');
    });
  };

  useEffect(() => {
    if (!open_ai_key) {
      chrome?.storage?.sync.get(/* String or Array */ ['open_ai_key'], function (items) {
        set_open_ai_key(items.open_ai_key);
      });
    }
  }, [open_ai_key]);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        dispatch({ payload: user, type: 'SET_USER' });
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

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
    chrome?.storage?.sync?.get(['promptList'], data => {
      if (data.promptList) {
        dispatch({ type: 'SET_PROMPT_LIST', payload: data.promptList });
      }
    });
  }, [dispatch]);

  const handleCopy = () => {
    setIsModalOpen(true);
  };

  const handleConfig = () => {
    dispatch({ type: 'SET_CONFIG_TOGGLE' });
  };

  if (!inputText) {
    return null;
  }

  console.log(state);
  return (
    <div>
      <div>
        <button className="bg-indigo-500 text-white rounded-md px-2 py-1 ml-2" onClick={handleCopy}>
          AI tweet
        </button>
        <button onClick={handleConfig} className="bg-indigo-500 text-white rounded-md px-2 py-1 ml-2">
          Config
        </button>
      </div>
      {state.isConfigOpen && (
        <TweetConfig promptList={state.promptList} activePrompt={state.activePrompt} dispatch={dispatch} />
      )}
      {isModalOpen && !open_ai_key && (
        <OpenAiKeyModal
          setIsModalOpen={setIsModalOpen}
          handleResetOpenAi={handleResetOpenAi}
          open_ai_key={open_ai_key}
          set_open_ai_key={set_open_ai_key}
        />
      )}
      {isModalOpen && open_ai_key && (
        <SuggestionModal
          dispatch={dispatch}
          promptList={state.promptList}
          activePrompt={state.activePrompt}
          openAiKey={open_ai_key}
          input={inputText}
          setIsModalOpen={setIsModalOpen}
          handleResetOpenAi={handleResetOpenAi}
        />
      )}
    </div>
  );
}
