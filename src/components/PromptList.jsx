/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
// src/components/NotionLikeList.js
import React from 'react';
import { Input } from '@root/components/ui/input';
import { Button } from '@root/components/ui/button';
import { Textarea } from '@root/components/ui/textarea';
import { Card } from '@root/components/ui/card';
import slugify from 'slugify';

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
    if (activePrompt === value) {
      dispatch({ type: 'SET_ACTIVE_PROMPT', payload: updatedItems[0].value });
    }
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
    addItem({ description: data.newItem, label: data.alias, value: slugify(data.alias) });
    e.currentTarget.reset();
  };

  return (
    <div className="w-full">
      <div className=" gap-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-4 text-black">AI Prompts</h1>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex mb-4 w-full">
              <div className="space-y-2 w-full">
                <Input required className="w-full" name="alias" type="text" placeholder="Enter Agent Name" />
                <Textarea className="w-full" required name="newItem" type="text" placeholder="Enter Your Prompt" />
              </div>
            </div>
            <Button className="w-full" type="submit">
              Add
            </Button>
          </form>
        </div>
        <ul className="w-full text-base">
          {promptList.map(item => (
            <li
              className="cursor-pointer"
              onClick={() => dispatch({ type: 'SET_ACTIVE_PROMPT', payload: item.value })}
              key={item.value}>
              <Card className={`my-4 p-5 relative ${activePrompt === item.value ? 'bg-blue-100' : ''}`}>
                <div>
                  <div className="font-semibold mb-2">{item.label}</div>
                  <p className="break-all">{item.description}</p>
                </div>
                {promptList.length > 1 && (
                  <button onClick={() => deleteItem(item.value)} className="text-gray-500 absolute top-2 right-2">
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
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PromptList;
