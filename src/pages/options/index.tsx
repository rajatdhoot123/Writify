import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from '@pages/options/Options';
import '@pages/options/index.css';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { Toaster } from 'react-hot-toast';

refreshOnUpdate('pages/options');

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(
    <>
      <Toaster
        toastOptions={{
          success: {
            style: {
              color: 'white',
              padding: '10px',
              fontWeight: '600',
              background: 'green',
              borderRadius: '12px',
            },
          },
          error: {
            style: {
              color: 'white',
              fontWeight: '600',
              padding: '10px',
              borderRadius: '12px',
              background: 'red',
            },
          },
        }}
      />
      <Options />
    </>,
  );
}

init();
