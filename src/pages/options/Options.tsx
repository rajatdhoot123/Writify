import React, { Fragment, useEffect } from 'react';
import '@pages/options/Options.css';
import TweetConfig from '@root/src/components/TweetConfig';
import useStore from '@root/src/lib/store';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@root/src/components/ui/select';
import { Input } from '@root/src/components/ui/input';
import toast from 'react-hot-toast';

const Options: React.FC = () => {
  const [state, dispatch] = useStore();

  useEffect(() => {
    if (state?.ai_model) {
      chrome.runtime.sendMessage({
        action: 'INIT_OLLAMA',
        payload: { ollama_host: state.ollama_host, ai_model: state.ai_model },
      });
      chrome.runtime.sendMessage({
        action: 'INIT_OPENAI',
        payload: { ai_key: state.ai_key, ai_model: state.ai_model },
      });
    }
  }, [state.ai_key, state.ai_model, state.ollama_host]);

  useEffect(() => {
    setTimeout(() => {
      (async () => {
        try {
          const response = await fetch(`${state.ollama_host}/api/tags`, {
            method: 'GET',
            credentials: 'include',
          });
          const { models } = await response.json();
          dispatch({ type: 'SET_OLLAMA_MODELS', payload: models.map(m => ({ value: m.model, label: m.name })) });
        } catch (err) {
          dispatch({ type: 'SET_OLLAMA_MODELS', payload: [] });
          toast.error('Ollama is not connected');
        }
      })();
    }, 2000);
  }, [dispatch, state.ollama_host]);

  return (
    <div className="flex container mx-auto my-12 ">
      <div className="space-y-4 w-1/2 p-5">
        <Select
          value={state.ai_model}
          onValueChange={async e => {
            dispatch({ type: 'SET_AI_MODEL', payload: e });
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Modals" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {state.all_ai_models.map(({ label, value }) => (
                <Fragment key={value}>
                  <SelectLabel>{label}</SelectLabel>
                  {value.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </Fragment>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={state.ai_key}
          onChange={async e => {
            dispatch({ type: 'SET_OPENAI_KEY', payload: e.target.value });
          }}
          placeholder="Enter Open Ai Chat GPT Key"
        />
        <Input
          type="text"
          value={state.ollama_host}
          onChange={async e => {
            dispatch({ type: 'SET_OLLAMA_HOST', payload: e.target.value });
          }}
          placeholder={'Enter Ollama Host'}
        />
      </div>
      <div className="w-1/2 p-5">
        <TweetConfig
          openAiKey={state.openAiKey}
          toggleModal={() => {
            dispatch({ type: 'SET_CONFIG_TOGGLE' });
          }}
          promptList={state.promptList}
          activePrompt={state.activePrompt}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
};

export default Options;
