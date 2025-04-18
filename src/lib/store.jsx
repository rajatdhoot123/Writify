import { useEffect, useReducer } from 'react';
import { getStorageData, setStorageData } from '@root/src/lib/helper';
import { GPT_MODELS, CLAUDE_MODELS } from '@root/src/constant';
import { PROMPTS } from '@root/lib/prompt';
import slugify from 'slugify';

export const getModelType = state => {
  return state.all_ai_models.filter(model => {
    return model.type === state.modelConfig.type;
  });
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODEL_CONFIG':
      return {
        ...state,
        modelConfig: {
          ...(action.payload.type === 'gemini'
            ? {
                type: 'gemini',
                model: '',
                host: '',
              }
            : {
                ...state.modelConfig,
                ...action.payload,
              }),
        },
        ollama_host: action.payload.type === 'ollama' ? action.payload.host : 'http://localhost:11434',
      };
    case 'SET_OLLAMA_MODELS':
      return {
        ...state,
        all_ai_models: state.all_ai_models.map(model => {
          if (model.type === 'ollama') {
            return {
              ...model,
              value: action.payload,
            };
          } else {
            return model;
          }
        }),
      };
    case 'SET_OLLAMA_HOST':
      return {
        ...state,
        modelConfig: {
          ...state.modelConfig,
          host: action.payload,
        },
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
        settings: {
          ...state.settings,
          active_prompt: action.payload,
        },
      };
    case 'SET_TONE':
      return {
        ...state,
        settings: {
          ...state.settings,
          tone: action.payload,
        },
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
    case 'ADD_PROMPT':
      return {
        ...state,
        promptList: [
          ...state.promptList,
          {
            ...action.payload,
            value: slugify(action.payload.label, { lower: true }),
            isCustom: true,
            promptText: tone => action.payload.description,
          },
        ],
      };
    case 'UPDATE_PROMPT':
      return {
        ...state,
        promptList: state.promptList.map(prompt =>
          prompt.value === action.payload.value
            ? {
                ...action.payload,
                value: prompt.isCustom ? slugify(action.payload.label, { lower: true }) : action.payload.value,
                isCustom: prompt.isCustom,
                promptText: prompt.isCustom ? tone => action.payload.description : prompt.promptText,
              }
            : prompt,
        ),
      };
    case 'DELETE_PROMPT':
      return {
        ...state,
        promptList: state.promptList.filter(prompt => prompt.value !== action.payload),
        settings: {
          ...state.settings,
          active_prompt: state.settings.active_prompt === action.payload 
            ? state.promptList[0]?.value || '' 
            : state.settings.active_prompt
        },
      };
    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: {
          tone: 'friendly',
          active_prompt: PROMPTS[0].value,
        },
      };
    default:
      return state;
  }
}

const useStore = () => {
  const [state, dispatch] = useReducer(reducer, {
    isStateLoaded: false,
    ollama_host: 'http://localhost:11434',
    settings: {
      tone: 'friendly',
      active_prompt: PROMPTS[0].value,
    },
    modelConfig: {
      type: '',
      host: '',
      model: '',
    },
    all_ai_models: [
      {
        label: 'Select AI Models',
        type: 'gpt',
        value: GPT_MODELS,
      },
      {
        label: 'Select AI Models',
        type: 'claude',
        value: CLAUDE_MODELS,
      },
      {
        label: 'Ollama',
        type: 'ollama',
        value: [],
      },
    ],
    promptList: PROMPTS,
    user: {},
  });

  useEffect(() => {
    const messageListener = async (message) => {
      console.log('message', message);
      if (message.action === 'UPDATE_TAB') {
        const response = await getStorageData(Object.keys(state));
        console.log('response', response);
        dispatch({ type: 'SET_STATE', payload: { ...response, isStateLoaded: true } });
      }
    };

    // Add the listener
    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [state]); // Add state as dependency to access latest state keys

  useEffect(() => {
    if (state.isStateLoaded) {
      (async () => {
        try {
          await setStorageData({
            ...state,
            modelConfig: state.modelConfig,
            isStateLoaded: true,
          });
        } catch (error) {
          console.error('Error saving state:', error);
        }
      })();
    }
  }, [state]);

  useEffect(() => {
    if (!state.isStateLoaded) {
      (async () => {
        try {
          const data = await getStorageData(Object.keys(state));
          if (data?.modelConfig) {
            dispatch({
              type: 'SET_STATE',
              payload: {
                ...data,
                isStateLoaded: true,
              },
            });
          }
        } catch (error) {
          console.error('Error loading state:', error);
        }
      })();
    }
  }, [state, state.isStateLoaded]);

  return [state, dispatch];
};

export default useStore;
