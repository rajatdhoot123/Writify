/* eslint-disable react/prop-types */
import React from 'react';

const Dropdown = ({ activePrompt, promptList, dispatch }) => {
  return (
    <>
      <select
        onChange={e => {
          dispatch({ type: 'SET_ACTIVE_PROMPT', payload: e.target.value });
        }}
        value={activePrompt}
        style={{
          maxWidth: '240px',
          flex: '1',
          height: '36px',
          cursor: 'pointer',
          color: 'rgb(29, 161, 242)',
          fontWeight: '700',
          fontFamily:
            'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgb(29, 161, 242)',
          borderImage: 'initial',
          borderRadius: '9999px',
          padding: '3px 14px',
        }}>
        {promptList.map(prompt => (
          <option value={prompt.value} key={prompt.value}>
            {prompt.value}
          </option>
        ))}
      </select>
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '0.5rem',
          color: '#4a5568',
          transition: 'transform 0.3s', // Add smooth transition
        }}>
        <svg
          style={{
            fill: 'currentColor',
            height: '1rem',
            width: '1rem',
            transform: 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20">
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </div>
    </>
  );
};
export default Dropdown;
