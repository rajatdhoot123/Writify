import logo from '@assets/img/logo.png';
import '@pages/popup/Popup.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
// import { authClient } from '@src/auth/auth-client';
import { useCallback } from 'react';
import useStorage from '@src/shared/hooks/useStorage';
import telegramTokenStorage from '@src/shared/storages/telegramTokenStorage';

const Popup = () => {
  // const { data, isPending, error } = authClient.useSession();
  // const handleLogout = useCallback(async () => {
  //   await authClient.signOut();
  // }, []);

  const token = useStorage(telegramTokenStorage);
  const handleTokenChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await telegramTokenStorage.set(e.target.value);
  }, []);

  return (
    <div className="bg-indigo-200 h-72 w-72 flex flex-col justify-between p-5 items-center">
      <div className="text-center">
        <div className="flex justify-center">
          <img src={logo} alt="Writify" className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl">Welcome to Writify</h1>
          <h2 className="text-xl">Set up Telegram</h2>
          {/* <p className="font-bold text-gray-600">
            {isPending
              ? 'Loading session…'
              : error
                ? `Error: ${error.message}`
                : data
                  ? `Signed in as ${data.user.email ?? data.user.name ?? 'User'}`
                  : 'User not logged in'}
          </p> */}
        </div>
      </div>
      <div className="flex flex-col space-y-2 w-full">
        {/* Login UI commented for now */}
        {/* {data ? (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <a
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-center"
            href={`${import.meta.env.VITE_AUTH_HOST}/app/login`}
            target="_blank"
            rel="noreferrer">
            Login with Google
          </a>
        )} */}

        <label className="text-sm font-medium text-gray-700" htmlFor="telegram-token">
          Telegram Channel API Token
        </label>
        <input
          id="telegram-token"
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter token"
          value={token}
          onChange={handleTokenChange}
        />
        <p className="text-xs text-gray-600">Stored locally in extension storage.</p>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
