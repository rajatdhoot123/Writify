/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import PromptList from './PromptList';

const TweetConfig = ({ dispatch, activePrompt, promptList, toggleModal, handleResetOpenAi, openAiKey }) => {
  return (
    <div
      onClick={e => e.stopPropagation()}
      className="relative z-[9999]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-[9999] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-scroll rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-1/2 max-h-[50vh]">
            <button onClick={toggleModal} className="absolute right-2 top-2">
              <svg
                className="h-6 w-6 text-black"
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
              </svg>
            </button>
            <div className="m-5">
              <PromptList
                openAiKey={openAiKey}
                handleResetOpenAi={handleResetOpenAi}
                promptList={promptList}
                activePrompt={activePrompt}
                dispatch={dispatch}
              />
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 sticky bottom-0">
              <button
                onClick={toggleModal}
                type="button"
                className="mt-3 ml-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Start Writing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetConfig;
