import { useEffect, useReducer, useRef } from 'react';
import { findClosest } from '@root/src/lib/extension';

export function downloadFile(filename, data) {
  // Create a new anchor element
  const a = document.createElement('a');

  // Create a new Blob object containing the JSON data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  // Create a URL for the Blob and set it as the href attribute
  a.href = URL.createObjectURL(blob);

  // Set the download attribute with the desired filename
  a.download = `${filename}.json`;

  // Append the anchor element to the document body
  document.body.appendChild(a);

  // Programmatically click the anchor to trigger the download
  a.click();

  // Clean up by revoking the object URL and removing the anchor element
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
}

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_CONFIG_MENU':
      return {
        ...state,
        configMenu: !state.configMenu,
      };
    case 'SET_TIMEOUT':
      return {
        ...state,
        timeout: action.payload,
      };
    case 'START_SCRAPPING':
      return {
        ...state,
        isScrapping: action.payload,
      };
    default:
      return state;
  }
}

const hashCode = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [state, setState] = useState({});
  const dataRef = useRef([]);
  const loggedHashes = useRef(new Set());
  const [state, dispatch] = useReducer(reducer, { isScrapping: false, timeout: 2, configMenu: false });

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const user = await getCurrentUser();
  //       setState(user);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    let intervalId;
    if (state.isScrapping) {
      const elId = '[data-testid=tweetText]';
      intervalId = setInterval(() => {
        const scrollTopBefore = window.scrollY;

        // Scroll the window
        window.scrollBy(0, 500);

        // Get the new scroll position
        const scrollTopAfter = window.scrollY;

        [...document.getElementsByTagName('article')].forEach(el => {
          const textContent = findClosest(el, elId)?.textContent ?? '';
          const [userName, userId] = findClosest(el, '[data-testid=User-Name')?.innerText?.split('@') ?? ['', ''];
          const time = findClosest(el, 'time')?.innerText ?? '';
          const hash = hashCode(textContent);

          if (!loggedHashes.current.has(hash)) {
            dataRef.current.push({ text: textContent, time, userName, userId });
            loggedHashes.current.add(hash);
          }
        });

        if (scrollTopBefore === scrollTopAfter) {
          clearInterval(intervalId);
          dispatch({ type: 'START_SCRAPPING', payload: false });
          downloadFile('data', dataRef.current);
          return;
        }
      }, state.timeout * 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isScrapping, state.timeout]);

  return (
    <div className="z-[999] fixed right-6 bottom-6">
      {state.configMenu ? (
        <div className="relative p-5 bg-white rounded-md">
          <button onClick={() => dispatch({ type: 'TOGGLE_CONFIG_MENU' })} className="absolute top-0 right-0">
            <svg
              className="h-6 w-6 text-black"
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
            </svg>
          </button>
          <div className="w-full max-w-xs">
            <div>
              <div className='text-black text-xl'>Tweet Scrapper</div>
            </div>
            <div className='border h-0.5 w-full my-2' />
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeout">
                Timeout
              </label>
              <input
                onChange={e => dispatch({ type: 'SET_TIMEOUT', payload: e.target.value })}
                value={state.timeout}
                className="bg-white shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="timeout"
                type="number"
                placeholder="timeout"
              />
            </div>
            <div className="flex items-center justify-between flex-col space-y-4">
              {state.isScrapping ? (
                <button
                  onClick={() => dispatch({ type: 'START_SCRAPPING', payload: false })}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button">
                  Stop Scrapping
                </button>
              ) : (
                <button
                  onClick={() => dispatch({ type: 'START_SCRAPPING', payload: true })}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button">
                  Start Scrapping
                </button>
              )}
              <button
                onClick={() => downloadFile('data', dataRef.current)}
                disabled={dataRef.current.length ? false : true}
                className={`${dataRef.current.length ? 'bg-blue-500 hover:bg-blue-700' : 'bg-gray-500 hover:bg-gray-700'} w-full  text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                type="button">
                Export Data
              </button>
            </div>
            <p className="text-center text-gray-500 text-xs">&copy;2024 Kwiktwik.</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CONFIG_MENU' })}
          className="bg-indigo-500 text-white font-semibold px-2 py-1 rounded-md">
          Tweet Scrapper
        </button>
      )}
    </div>
  );
}
