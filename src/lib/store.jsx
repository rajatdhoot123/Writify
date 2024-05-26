import { useEffect, useReducer } from 'react';
import { getStorageData, setStorageData } from '@root/src/lib/helper';
import { OLLAMA_MODELS, GPT_MODELS } from '@root/src/constant';

export const getModelType = model => {
  if (OLLAMA_MODELS.find(({ value }) => value === model)) {
    return 'ollama';
  } else if (GPT_MODELS.find(({ value }) => value === model)) {
    return 'gpt';
  } else {
    return '';
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_OPENAI_KEY':
      return {
        ...state,
        ai_key: action.payload,
      };
    case 'SET_OLLAMA_HOST':
      return {
        ...state,
        ollama_host: action.payload,
      };
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
    case 'SET_STATE':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_AI_MODEL':
      return {
        ...state,
        ai_model: action.payload,
        model_type: getModelType(action.payload),
      };
  }
}

const useStore = () => {
  const [state, dispatch] = useReducer(reducer, {
    isStateSync: crypto.randomUUID(),
    isStateLoaded: false,
    ai_model: '',
    ai_key: '',
    ollama_host: '',
    model_type: '',
    promptList: [
      {
        value: 'All-in-One AI Master Agent for Writing Tweets',
        label: `You are an AI assistant skilled in writing engaging and effective tweets for a wide variety of purposes. Your goal is to craft tweets that are concise, compelling, and tailored to the specific context or audience. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. You should be able to write tweets for different tones, such as informative, persuasive, humorous, or inspirational, while maintaining a natural and authentic voice. Additionally, you should incorporate relevant hashtags, mentions, and other elements to enhance the tweet's visibility and engagement. Please provide a draft tweet based on the provided context or topic.`,
      },
      {
        value: 'Improve My Writing Agent',
        label: ` You are an AI assistant specializing in improving and refining written content, particularly tweets. Your task is to take an existing draft tweet and enhance its grammar, clarity, and overall effectiveness. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. This may involve correcting any grammatical or spelling errors, rephrasing sentences for better flow and conciseness, and ensuring that the message is conveyed in a compelling and readable manner. Additionally, you should suggest ways to make the tweet more engaging, such as by incorporating relevant hashtags, mentions, or other elements that could increase its visibility and impact, while maintaining a natural and authentic voice. Please provide an improved version of the draft tweet, along with brief explanations for any significant changes made.`,
      },
      {
        value: 'Daily Tech Quote Writer Agent',
        label: `You are an AI assistant specializing in generating motivational and thought-provoking quotes related to technology and software development. Your task is to create a daily quote that can inspire and encourage developers, engineers, and tech enthusiasts. Avoid using exaggerating or "bluff" words. Keep the language simple, straightforward, and with a human touch. The quote should be concise, memorable, and capture an insightful or inspiring message about the ever-evolving world of technology, the challenges and rewards of coding, or the importance of continuous learning and innovation, while maintaining a natural and authentic voice. The quote should be tailored to be shareable on social media platforms like Twitter, so it should be attention-grabbing and suitable for a tweet. Please provide a fresh and engaging tech-related quote for the day.`,
      },
    ],
    activePrompt: 'All-in-One AI Master Agent for Writing Tweets',
    user: {},
  });

  useEffect(() => {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      switch (message.action) {
        case 'UPDATE_TAB': {
          const response = await getStorageData(Object.keys(state));
          dispatch({ type: 'SET_STATE', payload: { ...response, isStateLoaded: true } });
          return;
        }
      }
      return true;
      // return true <- this and the callback in background.js are what caused a crash in extensions page of my Google chrome
    });

    return () => {
      chrome.runtime.onMessage.removeListener(() => {});
    };
  }, [dispatch, state]);

  useEffect(() => {
    (async () => {
      if (!state.isStateLoaded) {
        const response = await getStorageData(Object.keys(state));
        dispatch({ type: 'SET_STATE', payload: { ...response, isStateLoaded: true } });
      }
    })();
  }, [state]);

  useEffect(() => {
    (async () => {
      await setStorageData({ ...state, isStateLoaded: true });
    })();
  }, [state]);

  return [state, dispatch];
};

export default useStore;
