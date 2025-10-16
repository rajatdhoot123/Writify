import { useState, useEffect, useCallback } from 'react';
import { Button } from '@root/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@root/components/ui/card';
import { Download, StopCircle, Send, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
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
  const [includeComments, setIncludeComments] = useState(false);

  const handleToggleComments = useCallback(() => {
    setIncludeComments(prev => !prev);
    if (!includeComments) {
      // Enable include comments
      window.dispatchEvent(new CustomEvent('enable-include-comments'));
      toast.success('Now including replies');
    } else {
      // Disable include comments
      window.dispatchEvent(new CustomEvent('disable-include-comments'));
      toast.success('Now excluding replies');
    }
  }, [includeComments]);

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

  // Render tweet item with modern design
  const renderTweetItem = (tweet, index) => (
    <div key={index} className="group bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-foreground text-sm">{tweet.userName}</div>
          {tweet.userId && <div className="text-muted-foreground text-xs mt-0.5">@{tweet.userId}</div>}
        </div>
        <div className="text-muted-foreground text-xs whitespace-nowrap ml-2">{tweet.time}</div>
      </div>
      <p className="text-foreground text-sm leading-relaxed">{tweet.text}</p>
    </div>
  );

  // Hide viewer if not visible
  if (!isVisible) {
    return null;
  }

  // Calculate progress percentage
  const progressPercent = scrapingProgress.total > 0 ? (scrapingProgress.current / scrapingProgress.total) * 100 : 0;

  // Render UI
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      data-tweetify-element="true">
      <Card className="w-full max-w-3xl relative max-h-[90vh] flex flex-col shadow-2xl border-0">
        {/* Header Section */}
        <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl font-bold">Tweet Intelligence</CardTitle>
                {isScrapingActive && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live Scraping
                  </div>
                )}
              </div>
              <CardDescription className="text-base">
                {isScrapingActive ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Collecting tweets... {scrapingProgress.current} of {scrapingProgress.total}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${scrapedTweets.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                    {scrapedTweets.length} {scrapedTweets.length === 1 ? 'tweet' : 'tweets'} collected
                  </div>
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
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
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
                className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>

          {/* Progress bar */}
          {isScrapingActive && (
            <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </CardHeader>

        {/* Content Section */}
        <CardContent className="flex-grow overflow-hidden">
          <div className="h-[45vh] overflow-y-auto tweetify-scroll-container pr-2 space-y-3">
            {scrapedTweets.length > 0 ? (
              scrapedTweets.map(renderTweetItem)
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      {isScrapingActive ? 'Waiting for tweets...' : 'No tweets collected yet'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isScrapingActive
                        ? 'Tweets will appear here as they are scraped'
                        : 'Start scraping to collect and view tweets'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Section - Improved Button Layout */}
        <CardFooter className="flex flex-col gap-3 border-t border-border/50 bg-muted/30 pt-4 pb-4 px-6">
          {/* Primary Actions Row */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={exportData}
              disabled={scrapedTweets.length === 0}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 h-10 rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              Export ({scrapedTweets.length})
            </Button>
            <Button
              onClick={sendToTelegram}
              disabled={scrapedTweets.length === 0 || isSending || !telegramToken}
              variant="secondary"
              className="flex-1 font-medium transition-all duration-200 h-10 rounded-lg">
              <Send className={`w-4 h-4 mr-2 ${isSending ? 'animate-spin' : ''}`} />
              {isSending ? 'Sending…' : 'Telegram'}
            </Button>
          </div>

          {/* Secondary Actions Row */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleToggleComments}
              variant="outline"
              className="flex-1 font-medium transition-all duration-200 h-9 rounded-lg text-sm">
              <MessageCircle className={`w-3.5 h-3.5 mr-1.5 ${includeComments ? 'text-green-500' : 'text-muted-foreground'}`} />
              {includeComments ? 'Exclude Replies' : 'Include Replies'}
            </Button>
            <Button
              onClick={stopScraping}
              disabled={!isScrapingActive}
              variant={isScrapingActive ? 'destructive' : 'outline'}
              className={`flex-1 font-medium transition-all duration-200 h-9 rounded-lg text-sm ${
                isScrapingActive ? 'hover:bg-destructive/90' : ''
              }`}>
              <StopCircle className={`w-3.5 h-3.5 mr-1.5 ${isScrapingActive ? 'animate-pulse' : ''}`} />
              {isScrapingActive ? 'Stop' : 'Stopped'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
