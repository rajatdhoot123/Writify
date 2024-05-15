/* eslint-disable react/prop-types */
import PromptList from './PromptList';

const TweetConfig = ({ dispatch, activePrompt, promptList }) => {
  return (
    <div className="fixed w-72 right-0 top-0 h-screen overflow-scroll bg-white p-5">
      <button
        onClick={() => {
          dispatch({ type: 'SET_CONFIG_TOGGLE' });
        }}
        className="absolute right-4 top-4">
        <svg
          stroke="currentColor"
          fill="currentColor"
          className="h-6 w-6"
          strokeWidth="0"
          viewBox="0 0 512 512"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg">
          <path d="m289.94 256 95-95A24 24 0 0 0 351 127l-95 95-95-95a24 24 0 0 0-34 34l95 95-95 95a24 24 0 1 0 34 34l95-95 95 95a24 24 0 0 0 34-34z"></path>
        </svg>
      </button>
      <h1>Twitter Config</h1>
      <div>
        <PromptList promptList={promptList} activePrompt={activePrompt} dispatch={dispatch} />
      </div>
    </div>
  );
};

export default TweetConfig;
