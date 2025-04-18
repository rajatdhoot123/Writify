import logo from '@assets/img/logo.png';
import '@pages/popup/Popup.css';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { getCurrentUser, signIn, signOut } from '@src/lib/supabase';
import { useEffect, useState } from 'react';
const Popup = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>({});
  const theme = useStorage(exampleThemeStorage);

  async function authHandler() {
    // tell background service worker to create a new tab and start listening to tab URL changes to parse query string param
    await signIn();
  }

  const handleLogout = async () => {
    setUser({});
    await signOut();
  };

  useEffect(() => {
    (async () => {
      const { user } = await getCurrentUser();
      setUser(user);
    })();
  }, []);

  return (
    <div className="bg-indigo-200 h-72 w-72 flex flex-col justify-between p-5 items-center">
      <div className="text-center">
        <div className="flex justify-center">
          <img src={logo} alt="Launchify" className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl">Welcome to Launcify</h1>
          <h2 className="text-xl">Let&apos;s get started</h2>
          <p className="font-bold text-gray-600">User Email {user?.email ?? 'User not loggedin'}</p>
        </div>
      </div>
      <div className="flex flex-col space-y-3">
        {user?.email ? (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={authHandler}>
            Login with Google
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div
      className="App"
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#000',
      }}>
      <header className="App-header" style={{ color: theme === 'light' ? '#000' : '#fff' }}>
        <img src={logo} className="App-logo" alt="logo" />
        <p className="bg-red-500">
          Edit <code>src/pages/popPopup.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme === 'light' && '#0281dc', marginBottom: '10px' }}>
          Learn React!
        </a>
        <button
          style={{
            backgroundColor: theme === 'light' ? '#fff' : '#000',
            color: theme === 'light' ? '#000' : '#fff',
          }}
          onClick={exampleThemeStorage.toggle}>
          Toggle theme
        </button>
        <button onClick={authHandler}>Login with Google</button>
        <button onClick={handleLogout}>Logout</button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
