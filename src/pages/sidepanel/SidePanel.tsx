import React from 'react';
import logo from '@assets/img/logo.png';
import '@pages/sidepanel/SidePanel.css';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';

const SidePanel = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useStorage(exampleThemeStorage);

  return (
    <div className="bg-indigo-200 h-full w-full min-h-svh flex justify-center items-center">
      <div className="text-center">
        <div className="flex justify-center">
          <img src={logo} alt="Launchify" className="h-12 w-12" />
        </div>
        <h1 className="text-3xl">Welcome to Launcify</h1>
        <h1 className="text-xl">Let&apos;s get started</h1>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
