import logo from '@assets/img/logo.png';
import '@pages/popup/Popup.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { authClient } from '@src/auth/auth-client';
import { useCallback } from 'react';

const Popup = () => {
  const { data, isPending, error } = authClient.useSession();

  const handleLogout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return (
    <div className="bg-indigo-200 h-72 w-72 flex flex-col justify-between p-5 items-center">
      <div className="text-center">
        <div className="flex justify-center">
          <img src={logo} alt="Writify" className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl">Welcome to Writify</h1>
          <h2 className="text-xl">Let&apos;s get started</h2>
          <p className="font-bold text-gray-600">
            {isPending
              ? 'Loading session…'
              : error
                ? `Error: ${error.message}`
                : data
                  ? `Signed in as ${data.user.email ?? data.user.name ?? 'User'}`
                  : 'User not logged in'}
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-3">
        {data ? (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <a
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-center"
            href={`${import.meta.env.VITE_AUTH_HOST}/extension/login?source=extension`}
            target="_blank"
            rel="noreferrer">
            Login with Google
          </a>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
