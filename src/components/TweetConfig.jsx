/* eslint-disable react/prop-types */
import PromptList from './PromptList';

const TweetConfig = ({ dispatch, activePrompt, promptList, toggleModal, handleResetOpenAi, openAiKey }) => {
  return (
    <PromptList
      openAiKey={openAiKey}
      handleResetOpenAi={handleResetOpenAi}
      promptList={promptList}
      activePrompt={activePrompt}
      dispatch={dispatch}
    />
  );
};

export default TweetConfig;
