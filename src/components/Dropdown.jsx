/* eslint-disable react/prop-types */
import React from 'react';

const Dropdown = ({ activePrompt, promptList, dispatch }) => {
  return (
    <>
      <div className="relative inline-block w-64">
        <select
          onChange={e => {
            dispatch({ type: 'SET_ACTIVE_PROMPT', payload: e.target.value });
          }}
          value={activePrompt}
          className="block w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
          {promptList.map((prompt, index) => (
            <option value={index} key={prompt}>
              {prompt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default Dropdown;
