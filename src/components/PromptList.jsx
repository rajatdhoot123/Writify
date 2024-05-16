/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
// src/components/NotionLikeList.js
import React from 'react';

// eslint-disable-next-line react/prop-types
const PromptList = ({ dispatch, activePrompt, promptList = [] }) => {
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

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Twitter AI Prompts</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex mb-4">
          <div className="space-y-2">
            <input
              required
              name="alias"
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-l-lg w-full rounded-md"
              placeholder="Prompt Alias"
            />
            <textarea
              required
              name="newItem"
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-l-lg w-full rounded-md"
              placeholder="Add a new item"
            />
          </div>
        </div>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded-md w-full">
          Add
        </button>
      </form>
      <ul className="mt-5">
        {promptList.map(item => (
          <li
            onClick={() => dispatch({ type: 'SET_ACTIVE_PROMPT', payload: item.value })}
            key={item.value}
            className={`flex cursor-pointer justify-between items-center p-2 break-normal ${activePrompt === item.value ? 'border-blue-300 border rounded-md' : 'border-gray-200 border-b'}`}>
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
  );
};

export default PromptList;
