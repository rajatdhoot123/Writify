import React, { Fragment } from 'react';
import '@pages/options/Options.css';
import TweetConfig from '@root/src/components/TweetConfig';
import useStore, { getModelType } from '@root/src/lib/store';
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
import { OLLAMA_MODELS, GPT_MODELS } from '@root/src/constant';

const Options: React.FC = () => {
  const [state, dispatch] = useStore();

  const handleResetOpenAi = () => {
    chrome.storage.sync.remove(['open_ai_key'], function () {
      dispatch({ type: 'SET_OPEN_AI_KEY', payload: '' });
    });
  };

  console.log(state);

  return (
    <div className="flex container mx-auto my-12 ">
      <div className="space-y-4 w-1/2 p-5">
        <Select
          value={state.ai_model}
          onValueChange={async e => {
            dispatch({ type: 'SET_AI_MODEL', payload: e });
            if (getModelType(e) === 'gpt') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OPENAI',
                payload: state,
              });
            } else if (getModelType(e) === 'ollama') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OLLAMA',
                payload: state,
              });
            }
            // dispatch({ type: getModelType(e) });
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Modals" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[
                {
                  label: 'Select AI Models',
                  value: GPT_MODELS,
                },
                {
                  label: 'Ollama',
                  value: OLLAMA_MODELS,
                },
              ].map(({ label, value }) => (
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
            if (getModelType(e) === 'gpt') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OPENAI',
                payload: state,
              });
            } else if (getModelType(e) === 'ollama') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OLLAMA',
                payload: state,
              });
            }
          }}
          placeholder="Enter Open Ai Chat GPT Key"
        />
        <Input
          type="text"
          value={state.ollama_host}
          onChange={async e => {
            dispatch({ type: 'SET_OLLAMA_HOST', payload: e.target.value });
            if (getModelType(e) === 'gpt') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OPENAI',
                payload: state,
              });
            } else if (getModelType(e) === 'ollama') {
              await chrome.runtime.sendMessage({
                action: 'INIT_OLLAMA',
                payload: state,
              });
            }
          }}
          placeholder={'Enter Ollama Host'}
        />
      </div>
      <div className="w-1/2 p-5">
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
    </div>
  );
};

export default Options;
