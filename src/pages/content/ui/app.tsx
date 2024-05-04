import { getCurrentUser } from '@root/src/lib/supabase';
import logo from '@assets/img/logo.png';

import { useEffect, useState } from 'react';

export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, setState] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setState(user);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  return (
    <div className="text-black border-2 p-2">
      <div className="bg-indigo-200 h-full w-full flex justify-center items-center">
        <div className="text-center">
          <div className="flex justify-center">
            <img src={chrome.runtime.getURL(logo)} alt="Launchify" className="h-12 w-12" />
          </div>
          <h1 className="text-3xl">Welcome to Launcify</h1>
          <h1 className="text-xl">Let&apos;s get started</h1>
        </div>
      </div>
    </div>
  );
}
