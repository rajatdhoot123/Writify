import { useEffect, useReducer, useRef } from 'react';
import { findClosest } from '@root/src/lib/extension';
import { Button } from '@root/components/ui/button';
import { Input } from '@root/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@root/components/ui/card';
import { Label } from '@root/components/ui/label';
import { X } from 'lucide-react'; // For the close icon

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

// Helper function to extract all external links from a tweet (user-posted content links only)
function extractLinksFromTweet(el) {
  const links = [];
  try {
    // Get all links from the tweet (anchor tags)
    const allLinks = el.querySelectorAll('a[href]');
    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http')) {
        // Skip twitter.com/x.com profile and navigation links - only get external content links
        // Include t.co short links as they wrap external content
        if (!href.includes('twitter.com') && !href.includes('x.com')) {
          // Avoid duplicates
          if (!links.includes(href)) {
            links.push(href);
          }
        }
      }
    });
    
    // Extract video sources
    const videos = el.querySelectorAll('video[src]');
    videos.forEach(video => {
      const src = video.getAttribute('src');
      if (src && src.startsWith('http') && !links.includes(src)) {
        links.push(src);
      }
    });
    
    // Extract audio sources
    const audios = el.querySelectorAll('audio[src]');
    audios.forEach(audio => {
      const src = audio.getAttribute('src');
      if (src && src.startsWith('http') && !links.includes(src)) {
        links.push(src);
      }
    });
    
    // Extract image sources from figures/media containers
    const images = el.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('http') && !src.includes('pbs.twimg.com/profile_images') && !links.includes(src)) {
        // Skip profile images, keep media images
        if (!src.includes('profile_images') && !src.includes('emoji')) {
          links.push(src);
        }
      }
    });
  } catch (e) {
    // ignore
  }
  return links;
}

// Helper function to extract card text from linked card content (when tweet has no text)
function extractCardText(el) {
  try {
    const cardDetail = el.querySelector('[data-testid="card.layoutSmall.detail"]');
    if (cardDetail) {
      const divs = cardDetail.querySelectorAll('div[dir="auto"]');
      if (divs.length > 0) {
        const textParts = [];
        // Get all text content from card divs (domain, title, description)
        divs.forEach(div => {
          const text = div.textContent?.trim();
          if (text) {
            textParts.push(text);
          }
        });
        return textParts.join(' | ');
      }
    }
  } catch (e) {
    // ignore
  }
  return '';
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
          let textContent = findClosest(el, elId)?.textContent ?? '';
          const [userName, userId] = findClosest(el, '[data-testid=User-Name')?.innerText?.split('@') ?? ['', ''];
          const time = findClosest(el, 'time')?.innerText ?? '';
          const links = extractLinksFromTweet(el);
          
          // If no text content but has external links, try to extract card text
          if (!textContent && links.length > 0) {
            textContent = extractCardText(el);
          }
          
          // If still no text content but has external links, use the first link as content
          if (!textContent && links.length > 0) {
            textContent = links[0];
          }
          
          const hash = hashCode(textContent);

          if (textContent && !loggedHashes.current.has(hash)) {
            dataRef.current.push({ text: textContent, time, userName, userId, links });
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
        <Card className="w-[350px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tweet Scrapper</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'TOGGLE_CONFIG_MENU' })}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Use this tool to start scraping tweets or threads of your choice for multiple use cases like curating
              resources and many more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={state.timeout}
                  onChange={e => dispatch({ type: 'SET_TIMEOUT', payload: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {state.isScrapping ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => dispatch({ type: 'START_SCRAPPING', payload: false })}>
                Stop Scrapping
              </Button>
            ) : (
              <Button className="w-full" onClick={() => dispatch({ type: 'START_SCRAPPING', payload: true })}>
                Start Scrapping
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => downloadFile('data', dataRef.current)}
              disabled={!dataRef.current.length}>
              Export Data
            </Button>
            <p className="text-center text-sm text-muted-foreground">&copy;2024 Kwiktwik.</p>
          </CardFooter>
        </Card>
      ) : (
        <Button variant="default" onClick={() => dispatch({ type: 'TOGGLE_CONFIG_MENU' })}>
          Tweet Scrapper
        </Button>
      )}
    </div>
  );
}
