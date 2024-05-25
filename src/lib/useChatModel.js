import { ChatOpenAI } from '@langchain/openai';
import { useEffect, useState } from 'react';

const useChatModel = ({ model, ai_key, model_type }) => {
  const [chatModel, setChatModel] = useState(null);

  useEffect(() => {
    if (ai_key && model && model_type) {
      setChatModel(
        new ChatOpenAI({
          apiKey: ai_key,
          model,
        }),
      );
    }
  }, [ai_key, model, model_type]);
  return [chatModel];
};

export default useChatModel;
