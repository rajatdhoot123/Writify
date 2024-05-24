/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useReducer, useCallback } from 'react';
import { findClosestParent, findClosest, clearContent } from '@root/src/lib/extension';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

function reducer(state, action) {
  switch (action.type) {
    case 'SET_OPEN_AI_KEY':
      return {
        ...state,
        openAiKey: action.payload,
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
  }
}

const Slack = () => {
  const [loader, setLoader] = useState(false);

  const [state, dispatch] = useReducer(reducer, {
    openAiKey: '',
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

  const chatModel = useCallback(
    () => {
      return new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || state.openAiKey,
      });
    },
    [state.openAiKey], // Add an empty array as the second argument
  );

  const handleGenerateAiTweet = useCallback(
    async event => {
      if (!state.openAiKey) {
        // Handle
        return;
      }

      setLoader(true);
      try {
        const contentEditable = findClosestParent(event.target, '.ql-editor');

        const input = (contentEditable as HTMLElement).textContent;

        const twitterPrompt = ChatPromptTemplate.fromMessages([
          ['system', state.promptList.find(prompt => prompt.value === state.activePrompt).label],
          ['user', '{input}'],
        ]);
        const chain = twitterPrompt.pipe(chatModel);
        const response: any = await chain.invoke({
          input,
        });

        if (contentEditable) {
          contentEditable.focus();
          setTimeout(() => {
            clearContent(contentEditable);
            // Dispatch an input event to simulate user input
            contentEditable
              .querySelector('p')
              .dispatchEvent(new InputEvent('textInput', { data: response.content, bubbles: true }));
          }, 200);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoader(false);
      }
    },
    [chatModel, state.activePrompt, state.openAiKey, state.promptList],
  );

  useEffect(() => {
    setInterval(() => {
      const toolSuit_id = 'slacker-ai';
      const editors = document.getElementsByClassName('ql-editor');

      [...editors].forEach(el => {
        const toolbar = findClosest(el, '[data-qa=wysiwyg-container_suffix]');
        if (toolbar && !toolbar.querySelector(`#${toolSuit_id}`)) {
          const toolSuit = document.createElement('div');
          toolSuit.id = toolSuit_id;
          toolSuit.textContent = 'AI';
          toolSuit.onclick = handleGenerateAiTweet;
          toolbar.append(toolSuit);
        }
      });
    }, 2000);
  }, [handleGenerateAiTweet]);

  return null;
};

export default Slack;
