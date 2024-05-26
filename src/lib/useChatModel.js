import { ChatOpenAI } from '@langchain/openai';
import { Ollama } from '@langchain/community/llms/ollama';
import { useEffect, useState } from 'react';

const useChatModel = ({ ai_key, model_type, ai_model, ollama_host }) => {
  const [chatModel, setChatModel] = useState(null);

  useEffect(() => {
    (async () => {
      if (model_type) {
        if (model_type === 'ollama' && ollama_host) {
          const ollama = new Ollama({
            baseUrl: ollama_host, // Default value
            model: ai_model, // Default value
          });

          setChatModel(ollama);
        } else if (model_type === 'gpt') {
          setChatModel(
            new ChatOpenAI({
              apiKey: ai_key,
              model: ai_model,
            }),
          );
        }
      }
    })();
  }, [ai_key, ai_model, model_type, ollama_host]);
  return [chatModel];
};

export default useChatModel;
