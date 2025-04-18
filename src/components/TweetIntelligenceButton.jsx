import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const hashCode = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Overlay component for scraping visualization and chat

export default function TweetIntelligenceButton() {
  const [intelligenceButtons, setIntelligenceButtons] = useState([]);
  const processedTweets = useRef(new Set());
  const scrapedDataRef = useRef([]);
  const [isLoading, setIsLoading] = useState({});
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [, setScrapingProgress] = useState({ total: 0, current: 0 });

  // Make scrapedDataRef available globally for the overlay
  window.scrapedDataRef = scrapedDataRef;

  // Listen for tweet-scraped events to update the UI
  useEffect(() => {
    const handleTweetScraped = event => {
      // If the event has data, update our local ref
      if (event.detail && event.detail.data) {
        scrapedDataRef.current = event.detail.data;
      }
      // Force a re-render to update the UI with new scraped tweets
      setIntelligenceButtons(prev => [...prev]);
    };

    // Handle requests for scraped tweets data
    const handleRequestScrapedTweets = () => {
      window.dispatchEvent(
        new CustomEvent('tweet-scraped', {
          detail: {
            data: scrapedDataRef.current,
          },
        }),
      );
    };

    // Function to handle URL changes
    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      const isStatusPage = currentUrl.includes('/status/');
      const urlParams = new URLSearchParams(window.location.search);
      const shouldAutoScrape = urlParams.get('autoScrape') === 'true';

      if (isStatusPage && shouldAutoScrape) {
        // Wait for the page to load the tweet
        setTimeout(async () => {
          const tweetArticle = document.querySelector('article[data-testid="tweet"]');
          if (tweetArticle) {
            // Extract initial tweet data
            const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
            const userNameElement = tweetArticle.querySelector('[data-testid="User-Name"]');
            const timeElement = tweetArticle.querySelector('time');

            const tweetText = tweetTextElement?.textContent || '';
            const userNameInfo = userNameElement?.innerText?.split('@') || ['', ''];
            const userName = userNameInfo[0]?.trim();
            const userId = userNameInfo[1]?.trim();
            const time = timeElement?.innerText || '';

            const initialTweet = { text: tweetText, time, userName, userId };
            
            // Start fresh scraping with the initial tweet
            initializeScraping(initialTweet);
            toast.success('Started scraping this tweet thread');

            // Clean up the URL without refreshing the page
            const newUrl = window.location.href.replace(/[?&]autoScrape=true/, '');
            window.history.replaceState({}, document.title, newUrl);
          }
        }, 1000); // Give the page time to load
      }
    };

    // Listen for URL changes
    window.addEventListener('tweet-scraped', handleTweetScraped);
    window.addEventListener('request-scraped-tweets', handleRequestScrapedTweets);
    window.addEventListener('popstate', handleUrlChange);

    // Intercept history.pushState and history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      const result = originalPushState.apply(this, arguments);
      handleUrlChange();
      return result;
    };

    history.replaceState = function() {
      const result = originalReplaceState.apply(this, arguments);
      handleUrlChange();
      return result;
    };

    // Check URL on initial load
    handleUrlChange();

    return () => {
      window.removeEventListener('tweet-scraped', handleTweetScraped);
      window.removeEventListener('request-scraped-tweets', handleRequestScrapedTweets);
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Monitor scraping active state and clean up when scraping is stopped
  useEffect(() => {
    // If scraping is stopped, disconnect any tweet observers
    if (!isScrapingActive && window.tweetObservers && window.tweetObservers.length > 0) {
      window.tweetObservers.forEach(obs => {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
        }
      });
      window.tweetObservers = [];
    }
  }, [isScrapingActive]);

  // Function to scrape a tweet
  const scrapeTweet = async tweetArticle => {
    try {
      // Extract tweet data from the article element
      const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
      const userNameElement = tweetArticle.querySelector('[data-testid="User-Name"]');
      const timeElement = tweetArticle.querySelector('time');

      const tweetText = tweetTextElement?.textContent || '';
      const userNameInfo = userNameElement?.innerText?.split('@') || ['', ''];
      const userName = userNameInfo[0]?.trim();
      const userId = userNameInfo[1]?.trim();
      const time = timeElement?.innerText || '';

      // Create a hash of the tweet text to avoid duplicates
      const hash = hashCode(tweetText);

      // Store the data
      if (tweetText && !scrapedDataRef.current.some(item => hashCode(item.text) === hash)) {
        const tweetData = { text: tweetText, time, userName, userId };
        scrapedDataRef.current = [...scrapedDataRef.current, tweetData];

        // Notify about the latest tweet
        window.dispatchEvent(
          new CustomEvent('scraping-state-change', {
            detail: {
              isActive: true,
              progress: { total: 0, current: scrapedDataRef.current.length },
              latestTweet: tweetData,
              data: scrapedDataRef.current
            },
          }),
        );

        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent('tweet-scraped', {
            detail: {
              data: scrapedDataRef.current,
              latestTweet: tweetData
            },
          }),
        );

        return tweetData;
      }

      return null;
    } catch (error) {
      console.error('Error scraping tweet:', error);
      toast.error('Failed to scrape tweet');
      return null;
    }
  };

  // Common function to initialize scraping with initial tweet data
  const initializeScraping = (initialTweet = null) => {
    // Reset everything
    scrapedDataRef.current = [];
    setScrapingProgress({ total: 0, current: 0 });
    
    // Set scraping as active
    setIsScrapingActive(true);
    
    // Add initial tweet if provided
    if (initialTweet) {
      scrapedDataRef.current = [initialTweet];
    }
    
    // Show the viewer immediately
    window.dispatchEvent(new CustomEvent('show-tweet-viewer'));
    
    // Notify about fresh scraping start
    window.dispatchEvent(
      new CustomEvent('scraping-state-change', {
        detail: {
          isActive: true,
          progress: { total: 0, current: initialTweet ? 1 : 0 },
          keepVisible: true,
          data: scrapedDataRef.current,
          latestTweet: initialTweet
        },
      }),
    );

    // If we have an initial tweet, dispatch it
    if (initialTweet) {
      window.dispatchEvent(
        new CustomEvent('tweet-scraped', {
          detail: {
            data: scrapedDataRef.current,
            latestTweet: initialTweet
          },
        }),
      );
    }

    // Start fresh scraping process
    startSingleTweetScraping();
  };

  // Modified click handler to ensure fresh start
  const handleIntelligenceClick = async (event, tweetArticle, buttonId) => {
    event.preventDefault();
    event.stopPropagation();

    setIsLoading(prev => ({ ...prev, [buttonId]: true }));

    try {
      // Check if we're already on a tweet page
      const currentUrl = window.location.href;
      const isOnTweetPage = currentUrl.includes('/status/');

      // Extract initial tweet data
      const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
      const userNameElement = tweetArticle.querySelector('[data-testid="User-Name"]');
      const timeElement = tweetArticle.querySelector('time');

      const tweetText = tweetTextElement?.textContent || '';
      const userNameInfo = userNameElement?.innerText?.split('@') || ['', ''];
      const userName = userNameInfo[0]?.trim();
      const userId = userNameInfo[1]?.trim();
      const time = timeElement?.innerText || '';

      const initialTweet = { text: tweetText, time, userName, userId };

      if (isOnTweetPage) {
        // Start fresh scraping
        initializeScraping(initialTweet);
        toast.success('Started scraping this tweet thread');
      } else {
        // Get the tweet URL for redirection
        const tweetUrl = getTweetUrl(tweetArticle);

        if (!tweetUrl) {
          toast.error('Could not find tweet URL');
          return;
        }

        // Add autoScrape parameter to URL
        const separator = tweetUrl.includes('?') ? '&' : '?';
        const urlWithParam = `${tweetUrl}${separator}autoScrape=true`;

        // Open the tweet URL in a new tab
        window.open(urlWithParam, '_blank');
        toast.success('Tweet opened in new tab. The scraper will start automatically.');
      }
    } catch (error) {
      console.error('Error processing tweet:', error);
      toast.error('Failed to process tweet');
    } finally {
      setIsLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  };

  // Function to get the URL of a tweet
  const getTweetUrl = tweetArticle => {
    try {
      // Look for tweet permalinks or share buttons
      const timeElement = tweetArticle.querySelector('time');
      if (timeElement) {
        const linkElement = timeElement.closest('a');
        if (linkElement && linkElement.href) {
          return linkElement.href;
        }
      }

      // Alternative method - look for share button
      const shareButton = tweetArticle.querySelector('[data-testid="share"]');
      if (shareButton) {
        const nearestLink = shareButton.closest('article').querySelector('a[href*="/status/"]');
        if (nearestLink && nearestLink.href) {
          return nearestLink.href;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting tweet URL:', error);
      return null;
    }
  };

  // Function to add intelligence button to the tweet action toolbar
  const addIntelligenceButtonToToolbar = () => {
    // Find all tweet articles - use a more specific selector to ensure we get all tweets
    const tweetArticles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));

    // If we don't find tweets with the specific data-testid, try a more general approach
    if (tweetArticles.length === 0) {
      const allArticles = Array.from(document.querySelectorAll('article'));
      // Filter to likely tweet articles (those containing typical tweet elements)
      const likelyTweetArticles = allArticles.filter(article =>
        article.querySelector(
          '[data-testid="like"], [data-testid="reply"], [data-testid="retweet"], time, [data-testid="User-Name"]',
        ),
      );
      tweetArticles.push(...likelyTweetArticles);
    }

    // Collect all new buttons to add them at once
    const newButtons = [];

    // Process each tweet article
    tweetArticles.forEach((article, index) => {
      try {
        // Check if this article already has our button
        const existingButton = article.querySelector('[id^="intelligence-button-"]');
        if (existingButton) {
          // Skip this article as it already has a button
          return;
        }

        // Generate a unique ID for this tweet based on its content
        const tweetText = article.textContent || '';
        const tweetId = `tweet-${hashCode(tweetText.substring(0, 100))}-${index}`;

        // Skip if we've already processed this tweet
        if (processedTweets.current.has(tweetId)) {
          return;
        }

        // Find all action buttons in this tweet
        const actionToolbar = article.querySelector('[role="group"]');
        if (!actionToolbar) {
          return;
        }

        // Find the bookmark button specifically
        const bookmarkButton = actionToolbar.querySelector('[data-testid="bookmark"]');
        if (!bookmarkButton) {
          return;
        }

        // Mark this tweet as processed
        processedTweets.current.add(tweetId);

        // Get the parent container of the bookmark button
        const bookmarkContainer = bookmarkButton.closest('div');
        if (!bookmarkContainer) {
          return;
        }

        // Create a container for our intelligence button with minimal impact
        const intelligenceButtonContainer = document.createElement('div');
        intelligenceButtonContainer.id = `intelligence-button-${tweetId}`;
        intelligenceButtonContainer.setAttribute('data-tweetify-button', 'true');

        // Copy styles from the bookmark container but with zero impact initially
        intelligenceButtonContainer.style.display = 'inline-flex';
        intelligenceButtonContainer.style.alignItems = 'center';
        intelligenceButtonContainer.style.justifyContent = 'center';
        intelligenceButtonContainer.style.margin = '0';
        intelligenceButtonContainer.style.padding = '0';
        intelligenceButtonContainer.style.opacity = '0';
        intelligenceButtonContainer.style.transition = 'opacity 0.3s ease';
        intelligenceButtonContainer.style.position = 'relative';
        intelligenceButtonContainer.style.width = '0';
        intelligenceButtonContainer.style.overflow = 'hidden';

        // Insert our button container before the bookmark container
        actionToolbar.insertBefore(intelligenceButtonContainer, bookmarkContainer);

        // Add the button to our collection
        newButtons.push({
          id: tweetId,
          element: intelligenceButtonContainer,
          article: article,
        });
      } catch (error) {
        // Silent error handling to avoid console noise
      }
    });

    // Update the state with all new buttons at once
    if (newButtons.length > 0) {
      setIntelligenceButtons(prev => {
        // Filter out any duplicates
        const existingIds = new Set(prev.map(btn => btn.id));
        const uniqueNewButtons = newButtons.filter(btn => !existingIds.has(btn.id));

        if (uniqueNewButtons.length === 0) {
          return prev;
        }

        return [...prev, ...uniqueNewButtons];
      });

      // After a short delay, make the buttons visible with proper sizing
      setTimeout(() => {
        newButtons.forEach(button => {
          const element = button.element;
          if (element) {
            element.style.opacity = '1';
            element.style.width = 'auto';
            element.style.margin = '';
            element.style.padding = '';
          }
        });
      }, 100);
    }
  };

  // Try a different approach to find and add buttons to all tweets
  const forceAddButtonsToAllTweets = () => {
    // Find all action toolbars directly
    const actionToolbars = Array.from(document.querySelectorAll('[role="group"]'));
    const newButtons = [];

    // Filter to only include action toolbars that contain tweet action buttons
    const tweetActionToolbars = actionToolbars.filter(toolbar =>
      toolbar.querySelector(
        '[data-testid="like"], [data-testid="reply"], [data-testid="retweet"], [data-testid="bookmark"]',
      ),
    );

    tweetActionToolbars.forEach((toolbar, index) => {
      try {
        // Check if this toolbar already has our button
        const existingButton = toolbar.querySelector('[data-tweetify-button="true"]');
        if (existingButton) {
          // Skip this toolbar as it already has a button
          return;
        }

        // Find the bookmark button
        const bookmarkButton = toolbar.querySelector('[data-testid="bookmark"]');
        if (!bookmarkButton) return;

        // Generate a unique ID
        const toolbarId = `toolbar-${hashCode(toolbar.innerHTML.substring(0, 100))}-${index}`;

        // Skip if we've already processed this toolbar
        if (processedTweets.current.has(toolbarId)) return;

        // Mark as processed
        processedTweets.current.add(toolbarId);

        // Find the bookmark container
        const bookmarkContainer = bookmarkButton.closest('div');
        if (!bookmarkContainer) return;

        // Create our button container with minimal impact
        const buttonContainer = document.createElement('div');
        buttonContainer.id = `intelligence-button-${toolbarId}`;
        buttonContainer.setAttribute('data-tweetify-button', 'true');

        // Set initial styles for silent addition
        buttonContainer.style.display = 'inline-flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.margin = '0';
        buttonContainer.style.padding = '0';
        buttonContainer.style.opacity = '0';
        buttonContainer.style.transition = 'opacity 0.3s ease';
        buttonContainer.style.position = 'relative';
        buttonContainer.style.width = '0';
        buttonContainer.style.overflow = 'hidden';

        // Insert before bookmark
        toolbar.insertBefore(buttonContainer, bookmarkContainer);

        // Find the article that contains this toolbar
        const article = toolbar.closest('article');

        // Add to our collection
        newButtons.push({
          id: toolbarId,
          element: buttonContainer,
          article: article,
        });
      } catch (error) {
        // Silent error handling
      }
    });

    // Update state with all new buttons
    if (newButtons.length > 0) {
      setIntelligenceButtons(prev => {
        // Filter out any duplicates
        const existingIds = new Set(prev.map(btn => btn.id));
        const uniqueNewButtons = newButtons.filter(btn => !existingIds.has(btn.id));

        if (uniqueNewButtons.length === 0) {
          return prev;
        }

        return [...prev, ...uniqueNewButtons];
      });

      // After a short delay, make the buttons visible with proper sizing
      setTimeout(() => {
        newButtons.forEach(button => {
          const element = button.element;
          if (element) {
            element.style.opacity = '1';
            element.style.width = 'auto';
            element.style.margin = '';
            element.style.padding = '';
          }
        });
      }, 100);
    }
  };

  useEffect(() => {
    // Check if we're on a page where we don't want to show buttons
    const shouldSkipPage = () => {
      // We now want to show buttons on tweet status pages
      // so we'll return false regardless of URL
      return false;
    };

    // If we're on a page where we don't want to show buttons, return early
    if (shouldSkipPage()) {
      return;
    }

    // Clear any existing buttons first - do this silently
    const existingButtons = document.querySelectorAll('[data-tweetify-button="true"]');
    existingButtons.forEach(button => {
      // Fade out before removing
      button.style.opacity = '0';
      button.style.width = '0';
      setTimeout(() => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      }, 300);
    });

    // Reset processed tweets
    processedTweets.current = new Set();

    // Run initially with both approaches
    addIntelligenceButtonToToolbar();

    // Try the force approach after a short delay
    setTimeout(() => {
      forceAddButtonsToAllTweets();
    }, 1000);

    // Set up a MutationObserver to detect new tweets
    const handleMutations = debounce(mutations => {
      // If we're on a page where we don't want to show buttons, return early
      if (shouldSkipPage()) {
        return;
      }

      let shouldAddButtons = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldAddButtons = true;
          break;
        }
      }

      if (shouldAddButtons) {
        addIntelligenceButtonToToolbar();
        forceAddButtonsToAllTweets();
      }
    }, 500);

    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });

    // Also set up an interval as a fallback, but with less frequent checks
    const intervalId = setInterval(() => {
      // If we're on a page where we don't want to show buttons, skip
      if (shouldSkipPage()) {
        return;
      }

      addIntelligenceButtonToToolbar();
      forceAddButtonsToAllTweets();
    }, 8000); // Increased to 8 seconds to reduce UI impact

    // Add a scroll event listener to detect new tweets loaded during scrolling
    const handleScroll = debounce(() => {
      // If we're on a page where we don't want to show buttons, skip
      if (shouldSkipPage()) {
        return;
      }

      addIntelligenceButtonToToolbar();
      forceAddButtonsToAllTweets();
    }, 500); // Increased debounce time

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);

      // Disconnect any tweet observers
      if (window.tweetObservers && window.tweetObservers.length > 0) {
        window.tweetObservers.forEach(obs => {
          if (obs && typeof obs.disconnect === 'function') {
            obs.disconnect();
          }
        });
        window.tweetObservers = [];
      }
    };
  }, []);

  // Simple debounce function to prevent too many calls during scrolling
  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Simplified function to scrape a single tweet page
  const startSingleTweetScraping = () => {
    // Reset any existing observers
    if (window.tweetObservers && window.tweetObservers.length > 0) {
      window.tweetObservers.forEach(obs => {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
        }
      });
      window.tweetObservers = [];
    }

    // Initial scrape of visible tweets
    const scrapeVisibleTweets = async () => {
      const articles = document.querySelectorAll('article');
      for (const article of articles) {
        await scrapeTweet(article);
      }
    };

    // Start the scraping interval
    let intervalId;
    const startScrapingInterval = () => {
      intervalId = setInterval(async () => {
        const scrollTopBefore = window.scrollY;
        
        // Scroll the window
        window.scrollBy(0, 500);
        
        // Get the new scroll position
        const scrollTopAfter = window.scrollY;
        
        // Scrape newly visible tweets
        await scrapeVisibleTweets();
        
        // Update progress
        setScrapingProgress(prev => {
          const newProgress = {
            total: Math.max(prev.total, scrapedDataRef.current.length + 5),
            current: scrapedDataRef.current.length
          };
          
          // Notify about progress
          window.dispatchEvent(
            new CustomEvent('scraping-state-change', {
              detail: {
                isActive: true,
                progress: newProgress,
                data: scrapedDataRef.current
              },
            }),
          );
          
          return newProgress;
        });
        
        // If we can't scroll further, we're done
        if (scrollTopBefore === scrollTopAfter) {
          clearInterval(intervalId);
          setIsScrapingActive(false);
          
          // Final progress update
          window.dispatchEvent(
            new CustomEvent('scraping-state-change', {
              detail: {
                isActive: false,
                progress: {
                  total: scrapedDataRef.current.length,
                  current: scrapedDataRef.current.length,
                  isComplete: true
                },
                keepVisible: true,
                data: scrapedDataRef.current
              },
            }),
          );
          
          // Keep viewer visible
          window.dispatchEvent(new CustomEvent('keep-viewer-visible'));
          
          toast.success('Finished scraping thread');
          return;
        }
      }, 2000); // 2 second interval between scrolls
    };

    // Initial delay to let the page load
    setTimeout(async () => {
      await scrapeVisibleTweets();
      startScrapingInterval();
    }, 2000);

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  };

  return (
    <>
      {intelligenceButtons.map(button => {
        const buttonId = button.id;

        return createPortal(
          <button
            onClick={e => handleIntelligenceClick(e, button.article, button.id)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLoading[buttonId] ? 'rgb(120, 120, 120)' : 'rgb(29, 155, 240)',
            }}
            title="Analyze this tweet"
            data-tooltip="Analyze and scrape this tweet"
            disabled={isLoading[buttonId]}
            aria-label="Analyze tweet"
            type="button">
            {isLoading[buttonId] ? (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <div
                dir="ltr"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <div style={{ position: 'relative' }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2 17.5v-11a2.5 2.5 0 0 1 2.5-2.5h.5a2.5 2.5 0 0 1 2.5-2.5z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 22 17.5v-11a2.5 2.5 0 0 0-2.5-2.5h-.5a2.5 2.5 0 0 0-2.5-2.5z" />
                    <path d="M12 4.5V19" />
                    <path d="M4 7.5v10" />
                    <path d="M20 7.5v10" />
                  </svg>
                </div>
              </div>
            )}
          </button>,
          button.element,
          buttonId,
        );
      })}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}
