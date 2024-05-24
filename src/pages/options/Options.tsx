import React from 'react';
import '@pages/options/Options.css';
import TweetConfig from '@root/src/components/TweetConfig';
import useStore from '@root/src/lib/store';

const Options: React.FC = () => {
  const [state, dispatch] = useStore();

  const handleResetOpenAi = () => {
    chrome.storage.sync.remove(['open_ai_key'], function () {
      dispatch({ type: 'SET_OPEN_AI_KEY', payload: '' });
    });
  };

  return (
    <div className="container mx-auto my-12">
      <TweetConfig
        openAiKey={state.openAiKey}
        handleResetOpenAi={handleResetOpenAi}
        toggleModal={() => {
          dispatch({ type: 'SET_CONFIG_TOGGLE' });
        }}
        promptList={state.promptList}
        activePrompt={state.activePrompt}
        dispatch={dispatch}
      />
    </div>
  );
};

export default Options;
