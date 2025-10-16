import { useState, useEffect, useCallback } from 'react';
import { Button } from '@root/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@root/components/ui/card';
import { Download, StopCircle, Send } from 'lucide-react';
import { downloadFile } from './Scrapper';
import toast from 'react-hot-toast';
import useStorage from '@src/shared/hooks/useStorage';
import telegramTokenStorage from '@src/shared/storages/telegramTokenStorage';

// Custom hook to manage scraping state and related functionality
function useScrapingManager() {
  const [scrapedTweets, setScrapedTweets] = useState([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState({ total: 0, current: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [forceStopped, setForceStopped] = useState(false);

  // Reset all state
  const resetViewer = useCallback(() => {
    setScrapedTweets([]);
    setIsScrapingActive(false);
    setForceStopped(false);
    setScrapingProgress({ total: 0, current: 0 });
  }, []);

  // Add tweet if it doesn't already exist
  const addTweetIfNew = useCallback(tweet => {
    if (!tweet) return;

    setScrapedTweets(prev => {
      const tweetExists = prev.some(t => t.text === tweet.text && t.userName === tweet.userName);
      return tweetExists ? prev : [...prev, tweet];
    });
  }, []);

  // Stop scraping and clean up resources
  const stopScraping = useCallback(() => {
    // Update local state
    setIsScrapingActive(false);
    setForceStopped(true);

    // Clean up observers
    if (window.tweetObservers && window.tweetObservers.length > 0) {
      window.tweetObservers.forEach(obs => {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
        }
      });
      window.tweetObservers = [];
    }

    // Clear intervals and timeouts
    for (let i = 1; i < 10000; i++) {
      clearInterval(i);
      clearTimeout(i);
    }

    // Notify other components
    window.dispatchEvent(
      new CustomEvent('scraping-state-change', {
        detail: {
          isActive: false,
          progress: scrapingProgress,
          keepVisible: true,
          forceStop: true,
          data: scrapedTweets,
        },
      }),
    );

    window.dispatchEvent(new CustomEvent('force-stop-scraping'));
    window.dispatchEvent(new CustomEvent('disable-twitter-scroll'));

    // Keep the viewer visible
    setIsVisible(true);
    toast.success('Scraping stopped');
  }, [scrapingProgress, scrapedTweets]);

  // Export scraped tweets
  const exportData = useCallback(() => {
    if (scrapedTweets.length > 0) {
      downloadFile('tweet-intelligence-data', scrapedTweets);
      toast.success('Data exported successfully!');
    } else {
      toast.error('No data to export');
    }
  }, [scrapedTweets]);

  return {
    scrapedTweets,
    setScrapedTweets,
    isScrapingActive,
    setIsScrapingActive,
    scrapingProgress,
    setScrapingProgress,
    isVisible,
    setIsVisible,
    forceStopped,
    resetViewer,
    addTweetIfNew,
    stopScraping,
    exportData,
    setForceStopped,
  };
}

// Custom hook for event listeners
function useScrapingEvents({
  setIsScrapingActive,
  setScrapingProgress,
  setScrapedTweets,
  resetViewer,
  setIsVisible,
  addTweetIfNew,
  setForceStopped,
}) {
  useEffect(() => {
    // Handle newly scraped tweets
    const handleTweetScraped = event => {
      if (!event.detail) return;

      // Update scraped tweets if data is provided
      if (event.detail.data) {
        setScrapedTweets(event.detail.data);
      }

      // Add latest tweet if provided
      if (event.detail.latestTweet) {
        addTweetIfNew(event.detail.latestTweet);
      }
    };

    // Handle scraping state changes
    const handleScrapingStateChange = event => {
      console.log('handleScrapingStateChange', event);
      if (!event.detail) return;

      const isActive = event.detail.isActive;

      if (isActive) {
        // Reset forceStopped state when starting scraping
        setForceStopped(false);

        // Scraping started
        setIsVisible(true);
        setIsScrapingActive(true);

        // Update progress
        if (event.detail.progress) {
          setScrapingProgress(event.detail.progress);
        }

        // Update data if provided
        if (event.detail.data) {
          setScrapedTweets(event.detail.data);
        }

        // Add latest tweet
        if (event.detail.latestTweet) {
          addTweetIfNew(event.detail.latestTweet);
        }
      } else {
        // Scraping ended
        setIsScrapingActive(false);

        // Mark as force-stopped when explicitly provided
        if (event.detail.forceStop) {
          setForceStopped(true);
        }

        if (event.detail.progress) {
          setScrapingProgress(event.detail.progress);

          // Show success on completion
          if (event.detail.progress.isComplete) {
            toast.success('Scraping completed successfully!');
          }
        }

        // Update final data if provided
        if (event.detail.data) {
          setScrapedTweets(event.detail.data);
        }
      }
    };

    // Named helpers for show/hide/keep-visible to ensure consistent cleanup and state sync
    const handleShow = () => setIsVisible(true);
    const handleHide = () => setIsVisible(false);
    const handleKeepVisible = () => {
      setIsVisible(true);
      // If we are being asked to keep visible, also reflect stopped state in UI
      setIsScrapingActive(false);
      setForceStopped(true);
    };

    // Register all event listeners
    window.addEventListener('tweet-scraped', handleTweetScraped);
    window.addEventListener('reset-tweet-viewer', resetViewer);
    window.addEventListener('scraping-state-change', handleScrapingStateChange);
    window.addEventListener('show-tweet-viewer', handleShow);
    window.addEventListener('hide-tweet-viewer', handleHide);
    window.addEventListener('keep-viewer-visible', handleKeepVisible);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('tweet-scraped', handleTweetScraped);
      window.removeEventListener('reset-tweet-viewer', resetViewer);
      window.removeEventListener('scraping-state-change', handleScrapingStateChange);
      window.removeEventListener('show-tweet-viewer', handleShow);
      window.removeEventListener('hide-tweet-viewer', handleHide);
      window.removeEventListener('keep-viewer-visible', handleKeepVisible);
    };
  }, [
    setIsScrapingActive,
    setScrapingProgress,
    setScrapedTweets,
    resetViewer,
    setIsVisible,
    addTweetIfNew,
    setForceStopped,
  ]);
}

export default function TweetIntelligenceViewer() {
  // Use our custom hooks
  const {
    scrapedTweets,
    isScrapingActive,
    scrapingProgress,
    isVisible,
    setIsVisible,
    resetViewer,
    addTweetIfNew,
    stopScraping,
    exportData,
    setScrapedTweets,
    setIsScrapingActive,
    setScrapingProgress,
    setForceStopped,
  } = useScrapingManager();

  // Register all event listeners
  useScrapingEvents({
    setIsScrapingActive,
    setScrapingProgress,
    setScrapedTweets,
    resetViewer,
    setIsVisible,
    addTweetIfNew,
    setForceStopped,
  });

  // Telegram token from storage and sending state
  const telegramToken = useStorage(telegramTokenStorage);
  const [isSending, setIsSending] = useState(false);

  const sendToTelegram = useCallback(async () => {
    try {
      if (!telegramToken || telegramToken.trim().length === 0) {
        toast.error('Telegram token not set. Add it in the popup.');
        return;
      }
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      if (!chatId) {
        toast.error('Missing VITE_TELEGRAM_CHAT_ID. Please configure it.');
        return;
      }
      if (scrapedTweets.length === 0) {
        toast.error('No tweets to send');
        return;
      }

      setIsSending(true);

      // Prepare JSON file of scraped tweets
      const json = JSON.stringify(scrapedTweets, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, 'tweets.json');

      const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendDocument`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.ok === false)) {
        throw new Error(data?.description || 'Failed to upload JSON');
      }

      toast.success('JSON sent to Telegram');
    } catch (e) {
      toast.error(e && e.message ? e.message : 'Failed to send to Telegram');
    } finally {
      setIsSending(false);
    }
  }, [telegramToken, scrapedTweets]);

  // Handle Twitter main page scroll prevention
  useEffect(() => {
    if (isScrapingActive) {
      const preventScroll = e => {
        // Allow programmatic scrolling
        if (!e.isTrusted) return true;

        // Find our element through shadow root
        const extensionRoot = document.querySelector('#launcify-extension-root');
        if (!extensionRoot?.shadowRoot) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Get our scroll container
        const scrollContainer = extensionRoot.shadowRoot.querySelector('.tweetify-scroll-container');
        if (!scrollContainer) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Check if the event target is within our shadow root and scroll container
        const isInScrollContainer = e
          .composedPath()
          .some(el => el === scrollContainer || (el.classList && el.classList.contains('tweetify-scroll-container')));

        if (isInScrollContainer) {
          // Check if we're at the boundaries of the scroll container
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const isAtTop = scrollTop <= 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight;
          const scrollingUp = e.deltaY < 0;
          const scrollingDown = e.deltaY > 0;

          // Prevent scrolling if we're at the boundaries
          if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          // Allow scrolling within container but stop propagation
          e.stopPropagation();
          return true;
        }

        // Prevent scrolling outside our container
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Add event listeners with capture to handle events before they bubble
      window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });

      return () => {
        window.removeEventListener('wheel', preventScroll, { capture: true });
        window.removeEventListener('touchmove', preventScroll, { capture: true });
      };
    }
  }, [isScrapingActive]);

  // Render tweet item
  const renderTweetItem = (tweet, index) => (
    <div key={index} className="p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-foreground">{tweet.userName}</div>
        <div className="text-muted-foreground text-sm">{tweet.time}</div>
      </div>
      <div className="mb-2 text-foreground">{tweet.text}</div>
      {tweet.userId && <div className="text-muted-foreground text-sm">@{tweet.userId}</div>}
    </div>
  );

  // Hide viewer if not visible
  if (!isVisible) {
    return null;
  }

  // Render UI
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      data-tweetify-element="true">
      <Card className="w-full max-w-2xl mx-auto relative max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              {isScrapingActive && (
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              )}
              Scraped Tweets
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {isScrapingActive ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Scraping in progress... ({scrapingProgress.current} tweets collected)
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  {scrapedTweets.length} tweets collected
                </>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopScraping();
              setIsVisible(false);
            }}
            className="h-8 w-8 p-0 rounded-full">
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="h-[50vh] overflow-y-auto tweetify-scroll-container">
            {scrapedTweets.length > 0 ? (
              <div className="text-foreground space-y-2 pr-4">{scrapedTweets.map(renderTweetItem)}</div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-muted flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground">
                    <path d="M21 7c0 2.21-4.03 4-9 4S3 9.21 3 7m18 0c0-2.21-4.03-4-9-4S3 4.79 3 7m18 0v10c0 2.21-4.03 4-9 4s-9-1.79-9-4V7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium mb-1">No tweets collected yet</p>
                  <p className="text-sm">
                    {isScrapingActive ? 'Waiting for tweets...' : 'Start scraping to collect tweets'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t p-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={stopScraping}
              variant={isScrapingActive ? 'destructive' : 'outline'}
              disabled={!isScrapingActive}
              className="transition-all duration-200">
              <StopCircle className={`mr-2 h-4 w-4 ${isScrapingActive ? 'animate-pulse' : ''}`} />
              {isScrapingActive ? 'Stop Scraping' : 'Scraping Inactive'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('enable-include-comments'));
              }}
              variant="outline"
              className="transition-all duration-200">
              Include comments
            </Button>
            <Button
              onClick={exportData}
              variant="default"
              disabled={scrapedTweets.length === 0}
              className="transition-all duration-200">
              <Download className="mr-2 h-4 w-4" />
              Export ({scrapedTweets.length})
            </Button>
            <Button
              onClick={sendToTelegram}
              variant="default"
              disabled={scrapedTweets.length === 0 || isSending || !telegramToken}
              className="transition-all duration-200">
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending…' : 'Send JSON to Telegram'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
