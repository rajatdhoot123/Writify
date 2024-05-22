/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
// src/components/NotionLikeList.js
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

// eslint-disable-next-line react/prop-types
const PromptList = ({ dispatch, activePrompt, promptList = [], handleResetOpenAi, openAiKey }) => {
  const openAiFormRef = useRef(null);
  const addItem = newItem => {
    if (newItem.value.trim() !== '' && newItem.label.trim() !== '') {
      dispatch({ type: 'SET_PROMPT_LIST', payload: [...promptList, newItem] });
      chrome?.storage?.sync?.set({ promptList: [...promptList, newItem] });
    }
  };

  const deleteItem = value => {
    const updatedItems = promptList.filter(prompt => prompt.value !== value);
    dispatch({ type: 'SET_PROMPT_LIST', payload: updatedItems });
    chrome?.storage?.sync?.set({ promptList: updatedItems });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    addItem({ label: data.newItem, value: data.alias });
    e.currentTarget.reset();
  };

  const handleOpenAiSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { open_ai_key: '' };
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    chrome?.storage?.sync?.set(data, function () {
      //  A data saved callback omg so fancy
      dispatch({ type: 'SET_OPEN_AI_KEY', payload: data.open_ai_key });
      toast.success('Key Saved');
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4 text-black">Twitter AI Prompts</h1>
      <div className="flex gap-6">
        <div className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="flex mb-4">
              <div className="space-y-2">
                <input
                  required
                  name="alias"
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg w-full rounded-md bg-white text-black"
                  placeholder="Enter Agent Name"
                />
                <textarea
                  required
                  name="newItem"
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg w-full rounded-md bg-white text-black"
                  placeholder="Enter Your Prompt"
                />
              </div>
            </div>
            <button type="submit" className="p-2 bg-blue-500 text-white rounded-md w-full">
              Add
            </button>
          </form>
          <form ref={openAiFormRef} onSubmit={handleOpenAiSubmit}>
            <div className="group w-full">
              <label
                htmlFor="8"
                className="inline-block w-full text-sm font-bold text-gray-700 transition-all duration-200 ease-in-out group-focus-within:text-black mb-2">
                Enter Your Chat Gpt Api Key
              </label>
              <div className="relative flex items-center">
                <input
                  required
                  defaultValue={openAiKey}
                  name="open_ai_key"
                  id="8"
                  type="text"
                  className="text-black peer relative h-10 w-full rounded-md bg-gray-50 pl-4 pr-20 outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-white focus:drop-shadow-lg"
                />
                <button
                  type="submit"
                  className="absolute right-0 h-10 w-16 rounded-r-md bg-blue-200 text-xs font-semibold text-white transition-all duration-200 ease-in-out group-focus-within:bg-blue-400 group-focus-within:hover:bg-blue-600">
                  Save
                </button>
              </div>
            </div>
          </form>
          <button
            onClick={() => {
              openAiFormRef?.current?.reset();
              handleResetOpenAi();
            }}
            className=" rounded-md p-2 bg-blue-600 text-sm font-semibold text-white transition-all duration-200 ease-in-out group-focus-within:bg-blue-400 group-focus-within:hover:bg-blue-600">
            Reset Open Ai Key
          </button>
        </div>
        <ul className="w-full">
          {promptList.map(item => (
            <li
              onClick={() => dispatch({ type: 'SET_ACTIVE_PROMPT', payload: item.value })}
              key={item.value}
              className={`text-black flex cursor-pointer justify-between items-center p-2 break-normal ${activePrompt === item.value ? 'border-blue-300 border rounded-md' : 'border-gray-200 border-b'}`}>
              <p className="break-all">{item.label}</p>
              {promptList.length > 1 && (
                <button onClick={() => deleteItem(item.value)} className="text-gray-500">
                  <svg
                    className="h-6 w-6"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg">
                    <path fill="none" d="M0 0h24v24H0V0z"></path>
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4z"></path>
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PromptList;
