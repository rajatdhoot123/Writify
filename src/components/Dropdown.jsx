/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const themes = {
  twitter: {
    button: {
      height: '36px',
      color: '#ffffff',
      backgroundColor: 'rgb(29, 161, 242)',
      fontSize: '14px',
      fontWeight: '700',
      fontFamily: 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      border: 'none',
      borderRadius: '9999px',
      width: '100%',
    },
    dropdown: {
      backgroundColor: '#ffffff',
      border: '1px solid rgb(239, 243, 244)',
      boxShadow: 'rgb(101 119 134 / 20%) 0px 0px 15px, rgb(101 119 134 / 15%) 0px 0px 3px 1px',
      borderRadius: '16px',
    },
    item: {
      color: 'rgb(15, 20, 25)',
      hoverBg: 'rgb(247, 249, 249)',
      activeBg: 'rgb(239, 243, 244)',
      fontSize: '15px',
    },
  },
  slack: {
    button: {
      height: '28px',
      color: 'white',
      backgroundColor: 'transparent',
      fontSize: '13px',
      fontWeight: '500',
      border: 'none',
      borderRadius: '4px',
    },
    dropdown: {
      backgroundColor: '#ffffff',
      border: '1px solid #ddd',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderRadius: '4px',
    },
    item: {
      color: '#1a1a1a',
      hoverBg: '#f5f5f5',
      activeBg: '#f5f5f5',
      fontSize: '13px',
    },
  },
};

const Dropdown = ({ dispatch, promptList, activePrompt, type = 'prompt', theme = 'slack' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const currentTheme = themes[theme];

  const handleSelect = value => {
    if (type === 'tone') {
      dispatch({
        type: 'SET_TONE',
        payload: value,
      });
    } else {
      dispatch({
        type: 'SET_ACTIVE_PROMPT',
        payload: value,
      });
    }
    setIsOpen(false);
  };

  const currentLabel = promptList.find(p => p.value === activePrompt)?.label || 'Select';

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = Math.min(200, promptList.length * 36);

      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUpward);

      setPosition({
        top: shouldOpenUpward ? buttonRect.top - dropdownHeight + window.scrollY : buttonRect.bottom + window.scrollY,
        left: buttonRect.left + window.scrollX,
      });
    }
  }, [isOpen, promptList.length]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minWidth: '80px',
          maxWidth: theme === 'twitter' ? '100%' : '120px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          ...currentTheme.button,
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 999999,
              maxHeight: '200px',
              overflowY: 'auto',
              minWidth: buttonRef.current?.offsetWidth || 120,
              ...currentTheme.dropdown,
            }}>
            {promptList.map(prompt => (
              <button
                key={prompt.value}
                onClick={() => handleSelect(prompt.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  backgroundColor: activePrompt === prompt.value ? currentTheme.item.activeBg : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'block',
                  ...currentTheme.item,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = currentTheme.item.hoverBg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    activePrompt === prompt.value ? currentTheme.item.activeBg : 'transparent';
                }}>
                {prompt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Dropdown;
