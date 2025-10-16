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
  const isScrapingActiveRef = useRef(false);
  const [, setScrapingProgress] = useState({ total: 0, current: 0 });
  // Control whether to include comments (replies from other users) in scraping
  const includeCommentsRef = useRef(false);
  // Track the primary author's handle/id to restrict default scraping to author thread only
  const primaryAuthorIdRef = useRef(null);

  // Make scrapedDataRef available globally for the overlay
  window.scrapedDataRef = scrapedDataRef;

  // Helper to robustly extract the author's handle from a tweet article
  const extractAuthorHandle = root => {
    try {
      // Prefer the profile link inside the User-Name container
      const userNameContainer = root.querySelector('[data-testid="User-Name"]');
      const profileLink = userNameContainer && userNameContainer.querySelector('a[href^="/"]');
      const href = profileLink && profileLink.getAttribute('href');
      if (href) {
        const handle = href.split('?')[0].split('/').filter(Boolean)[0];
        if (handle) return handle.toLowerCase();
      }

      // Fallback: parse innerText looking for @handle
      const text = userNameContainer && userNameContainer.innerText;
      if (text && text.includes('@')) {
        const afterAt = text.split('@')[1] || '';
        const handle = afterAt.split(/\s|\n|\.|·|,/)[0];
        if (handle) return handle.toLowerCase();
      }

      // Last resort: avatar container link
      const avatarLink = root.querySelector('[data-testid^="UserAvatar-Container"] a[href^="/"]');
      const avatarHref = avatarLink && avatarLink.getAttribute('href');
      if (avatarHref) {
        const handle = avatarHref.split('?')[0].split('/').filter(Boolean)[0];
        if (handle) return handle.toLowerCase();
      }
    } catch (_) {
      // ignore
    }
    return '';
  };

  // Detect if a tweet is a reply using layout-agnostic cues
  const isReplyTweet = root => {
    try {
      // Heuristic: tweet content begins with an @mention (typical quick reply)
      const txt = (root.querySelector('[data-testid="tweetText"]')?.textContent || '').trim();
      if (txt.startsWith('@')) return true;
    } catch (_) {
      return false;
    }
    return false;
  };

  // Determine by DOM context: if the nearest previous tweet is from a different author,
  // then an author tweet immediately after is likely a reply in a conversation.
  const isAuthorReplyByContext = root => {
    try {
      const articles = Array.from(document.querySelectorAll('article'));
      const idx = articles.indexOf(root);
      if (idx <= 0) return false;
      const primary = primaryAuthorIdRef.current;
      if (!primary) return false;
      // Walk back to find the nearest previous tweet with a detectable author
      for (let i = idx - 1; i >= 0; i--) {
        const prev = articles[i];
        const prevHandle = extractAuthorHandle(prev);
        if (!prevHandle) continue; // skip if unknown
        const sameAsPrimary = prevHandle.toLowerCase() === primary.toLowerCase();
        // If previous is non-author, we treat this as reply context
        return !sameAsPrimary;
      }
    } catch (_) {
      return false;
    }
    return false;
  };

  // Helper function to extract all external links from a tweet (user-posted content links only)
  const extractLinksFromTweet = (tweetArticle) => {
    const links = [];
    try {
      // Get all links from the tweet (anchor tags)
      const allLinks = tweetArticle.querySelectorAll('a[href]');
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('http')) {
          // Skip twitter.com/x.com profile and navigation links - only get external content links
          // Include t.co short links as they wrap external content
          if (!href.includes('twitter.com') && !href.includes('x.com')) {
            if (!links.includes(href)) {
              links.push(href);
            }
          }
        }
      });
      
      // Extract video sources
      const videos = tweetArticle.querySelectorAll('video[src]');
      videos.forEach(video => {
        const src = video.getAttribute('src');
        if (src && src.startsWith('http') && !links.includes(src)) {
          links.push(src);
        }
      });
      
      // Extract audio sources
      const audios = tweetArticle.querySelectorAll('audio[src]');
      audios.forEach(audio => {
        const src = audio.getAttribute('src');
        if (src && src.startsWith('http') && !links.includes(src)) {
          links.push(src);
        }
      });
      
      // Extract image sources from figures/media containers
      const images = tweetArticle.querySelectorAll('img[src]');
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
  };

  // Helper function to extract card text from linked card content (when tweet has no text)
  const extractCardText = (tweetArticle) => {
    try {
      const cardDetail = tweetArticle.querySelector('[data-testid="card.layoutSmall.detail"]');
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
  };

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
            const timeElement = tweetArticle.querySelector('time');

            let tweetText = tweetTextElement?.textContent || '';
            const links = extractLinksFromTweet(tweetArticle);
            
            // If no text content but has external links, try to extract card text
            if (!tweetText && links.length > 0) {
              tweetText = extractCardText(tweetArticle);
            }
            
            // If still no text content but has external links, use the first link as content
            if (!tweetText && links.length > 0) {
              tweetText = links[0];
            }
            
            const userNameElement = tweetArticle.querySelector('[data-testid="User-Name"]');
            const displayName = userNameElement?.querySelector('span')?.innerText || userNameElement?.innerText || '';
            const userId = extractAuthorHandle(tweetArticle);
            const userName = displayName?.split('@')[0]?.trim();
            const time = timeElement?.innerText || '';

            const initialTweet = { text: tweetText, time, userName, userId, links };

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

    history.pushState = function () {
      const result = originalPushState.apply(this, arguments);
      handleUrlChange();
      return result;
    };

    history.replaceState = function () {
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

  // Listen for a request from the viewer to include comments as well
  useEffect(() => {
    const enableComments = () => {
      // Reset scraped data to start fresh
      scrapedDataRef.current = [];
      includeCommentsRef.current = true;
      toast.success('Restarting scraper to include replies...');

      // Reset the viewer UI
      window.dispatchEvent(new CustomEvent('reset-tweet-viewer'));

      // Restart scraping from the top to include comments across the full thread
      try {
        startFullThreadScrapeFromTop();
      } catch (_) {
        // ignore
      }
    };

    const disableComments = () => {
      // Reset scraped data to start fresh
      scrapedDataRef.current = [];
      includeCommentsRef.current = false;
      toast.success('Restarting scraper to exclude replies...');

      // Reset the viewer UI
      window.dispatchEvent(new CustomEvent('reset-tweet-viewer'));

      // Restart scraping from the top to exclude comments
      try {
        startFullThreadScrapeFromTop();
      } catch (_) {
        // ignore
      }
    };

    window.addEventListener('enable-include-comments', enableComments);
    window.addEventListener('disable-include-comments', disableComments);
    return () => {
      window.removeEventListener('enable-include-comments', enableComments);
      window.removeEventListener('disable-include-comments', disableComments);
    };
  }, []);

  // Monitor scraping active state and clean up when scraping is stopped
  useEffect(() => {
    isScrapingActiveRef.current = isScrapingActive;
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

      let tweetText = tweetTextElement?.textContent || '';
      const links = extractLinksFromTweet(tweetArticle);
      
      // If no text content but has external links, try to extract card text
      if (!tweetText && links.length > 0) {
        tweetText = extractCardText(tweetArticle);
      }
      
      // If still no text content but has external links, use the first link as content
      if (!tweetText && links.length > 0) {
        tweetText = links[0];
      }
      
      const displayName = userNameElement?.querySelector('span')?.innerText || userNameElement?.innerText || '';
      const userId = extractAuthorHandle(tweetArticle);
      const userName = displayName?.split('@')[0]?.trim();
      const time = timeElement?.innerText || '';

      // By default, only collect tweets from the primary author unless comments are enabled
      if (!includeCommentsRef.current && primaryAuthorIdRef.current) {
        const isAuthor = !!userId && userId.toLowerCase() === primaryAuthorIdRef.current.toLowerCase();
        if (!isAuthor) {
          return null;
        }
        // Exclude author's replies (heuristics) unless comments are enabled
        if (isReplyTweet(tweetArticle) || isAuthorReplyByContext(tweetArticle)) {
          return null;
        }
      }

      // Create a hash of the tweet text to avoid duplicates
      const hash = hashCode(tweetText);

      // Store the data - allow media-only tweets with external links
      if (tweetText && !scrapedDataRef.current.some(item => hashCode(item.text) === hash)) {
        const tweetData = { text: tweetText, time, userName, userId, links };
        scrapedDataRef.current = [...scrapedDataRef.current, tweetData];

        // Notify about the latest tweet only if scraping is still active
        if (isScrapingActiveRef.current) {
          window.dispatchEvent(
            new CustomEvent('scraping-state-change', {
              detail: {
                isActive: true,
                progress: { total: 0, current: scrapedDataRef.current.length },
                latestTweet: tweetData,
                data: scrapedDataRef.current,
              },
            }),
          );
        }

        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent('tweet-scraped', {
            detail: {
              data: scrapedDataRef.current,
              latestTweet: tweetData,
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
    isScrapingActiveRef.current = true;
    // Reset options for a fresh run
    includeCommentsRef.current = false;
    primaryAuthorIdRef.current = initialTweet?.userId ? String(initialTweet.userId).toLowerCase() : null;

    // Add initial tweet if provided
    if (initialTweet) {
      scrapedDataRef.current = [
        { ...initialTweet, userId: initialTweet.userId?.toLowerCase?.() || initialTweet.userId },
      ];
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
          latestTweet: initialTweet,
        },
      }),
    );

    // If we have an initial tweet, dispatch it
    if (initialTweet) {
      window.dispatchEvent(
        new CustomEvent('tweet-scraped', {
          detail: {
            data: scrapedDataRef.current,
            latestTweet: initialTweet,
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

      let tweetText = tweetTextElement?.textContent || '';
      const links = extractLinksFromTweet(tweetArticle);
      
      // If no text content but has external links, try to extract card text
      if (!tweetText && links.length > 0) {
        tweetText = extractCardText(tweetArticle);
      }
      
      // If still no text content but has external links, use the first link as content
      if (!tweetText && links.length > 0) {
        tweetText = links[0];
      }
      
      const displayName = userNameElement?.querySelector('span')?.innerText || userNameElement?.innerText || '';
      const userId = extractAuthorHandle(tweetArticle);
      const userName = displayName?.split('@')[0]?.trim();
      const time = timeElement?.innerText || '';

      const initialTweet = { text: tweetText, time, userName, userId, links };

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

        // Find the action toolbar in this tweet (robust lookup)
        let actionToolbar = article.querySelector('[role="group"]');
        if (!actionToolbar) {
          // Try locating via a known action (reply/like/retweet) and walk up
          const anyAction =
            article.querySelector('[data-testid="reply"]') ||
            article.querySelector('[data-testid="retweet"]') ||
            article.querySelector('[data-testid="like"]');
          if (anyAction) {
            actionToolbar = anyAction.closest('[role="group"]') || anyAction.parentElement;
          }
        }
        if (!actionToolbar) {
          return;
        }

        // Prefer inserting before a known stable control; fall back gracefully
        const bookmarkButton =
          actionToolbar.querySelector('[data-testid="bookmark"]') ||
          actionToolbar.querySelector('[data-testid="removeBookmark"]');
        const shareButton =
          actionToolbar.querySelector('[data-testid="share"]') ||
          actionToolbar.querySelector('[aria-label="Share post"]');

        // Mark this tweet as processed
        processedTweets.current.add(tweetId);

        // Resolve insertion reference node
        const referenceContainer =
          (bookmarkButton && bookmarkButton.closest('div')) || (shareButton && shareButton.closest('div')) || null;

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

        // Insert our button container before the reference (bookmark/share). If not found, append to toolbar
        if (referenceContainer) {
          actionToolbar.insertBefore(intelligenceButtonContainer, referenceContainer);
        } else {
          actionToolbar.appendChild(intelligenceButtonContainer);
        }

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
        '[data-testid="like"], [data-testid="reply"], [data-testid="retweet"], [data-testid="bookmark"], [data-testid="removeBookmark"], [data-testid="share"], [aria-label="Share post"]',
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

        // Find a stable reference to insert before (bookmark/share), otherwise append
        const bookmarkButton =
          toolbar.querySelector('[data-testid="bookmark"]') || toolbar.querySelector('[data-testid="removeBookmark"]');
        const shareButton =
          toolbar.querySelector('[data-testid="share"]') || toolbar.querySelector('[aria-label="Share post"]');

        // Generate a unique ID
        const toolbarId = `toolbar-${hashCode(toolbar.innerHTML.substring(0, 100))}-${index}`;

        // Skip if we've already processed this toolbar
        if (processedTweets.current.has(toolbarId)) return;

        // Mark as processed
        processedTweets.current.add(toolbarId);

        // Resolve insertion reference node
        const referenceContainer =
          (bookmarkButton && bookmarkButton.closest('div')) || (shareButton && shareButton.closest('div')) || null;

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

        // Insert before reference if available; otherwise append to the toolbar
        if (referenceContainer) {
          toolbar.insertBefore(buttonContainer, referenceContainer);
        } else {
          toolbar.appendChild(buttonContainer);
        }

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

    // Helper: find the appropriate scroll container for the tweet thread/status page
    const getScrollContainer = () => {
      // Prefer the primary column or conversation timeline; fall back to documentElement/body
      const candidates = [
        document.querySelector('[data-testid="primaryColumn"]'),
        document.querySelector('main[role="main"]'),
        document.querySelector('[aria-label="Timeline: Conversation"]'),
        document.querySelector('[aria-label="Home timeline"]'),
      ];
      const container = candidates.find(el => el && el.scrollHeight > el.clientHeight);
      return container || document.scrollingElement || document.documentElement || document.body;
    };

    // Initial scrape of visible tweets
    const scrapeVisibleTweets = async () => {
      const articles = document.querySelectorAll('article');
      for (const article of articles) {
        await scrapeTweet(article);
      }
    };

    // Start the scraping interval
    let intervalId;
    // Track thread completion heuristics when excluding comments
    let authorTweetsCollected = 0;
    let consecutiveNonAuthor = 0;

    const classifyAuthorForArticle = article => {
      const handle = extractAuthorHandle(article);
      const primary = primaryAuthorIdRef.current;
      if (!primary) return 'unknown';
      return handle && primary && handle.toLowerCase() === primary.toLowerCase() ? 'author' : 'nonAuthor';
    };

    const startScrapingInterval = () => {
      const scrollContainer = getScrollContainer();
      intervalId = setInterval(async () => {
        const isWindow =
          scrollContainer === window ||
          scrollContainer === document.scrollingElement ||
          scrollContainer === document.documentElement ||
          scrollContainer === document.body;
        const getTop = () => (isWindow ? window.scrollY : scrollContainer.scrollTop);
        const setScrollBy = amount => {
          if (isWindow) {
            window.scrollBy(0, amount);
          } else {
            scrollContainer.scrollTop = scrollContainer.scrollTop + amount;
          }
        };

        const scrollTopBefore = getTop();

        // Scroll the container
        setScrollBy(600);

        // Get the new scroll position
        const scrollTopAfter = getTop();

        // Scrape newly visible tweets
        await scrapeVisibleTweets();

        // Update heuristics only when we're not including comments
        if (!includeCommentsRef.current && primaryAuthorIdRef.current) {
          const visibleArticles = Array.from(document.querySelectorAll('article'));
          for (const art of visibleArticles) {
            const cls = classifyAuthorForArticle(art);
            if (cls === 'author') {
              authorTweetsCollected += 1;
              consecutiveNonAuthor = 0;
            } else if (cls === 'nonAuthor') {
              consecutiveNonAuthor += 1;
            }
          }
        }

        // Update progress
        if (!isScrapingActiveRef.current) {
          return;
        }
        setScrapingProgress(prev => {
          const newProgress = {
            total: Math.max(prev.total, scrapedDataRef.current.length + 5),
            current: scrapedDataRef.current.length,
          };

          // Notify about progress
          if (isScrapingActiveRef.current) {
            window.dispatchEvent(
              new CustomEvent('scraping-state-change', {
                detail: {
                  isActive: true,
                  progress: newProgress,
                  data: scrapedDataRef.current,
                },
              }),
            );
          }

          return newProgress;
        });

        // If we can't scroll further (or reached bottom), we're done
        const reachedBottom = (() => {
          if (isWindow) {
            const doc = document.scrollingElement || document.documentElement;
            return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight;
          }
          return Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight;
        })();

        // Stop if reached bottom or thread likely completed (entered replies section)
        const threadComplete = !includeCommentsRef.current && authorTweetsCollected >= 1 && consecutiveNonAuthor >= 3;
        if (scrollTopBefore === scrollTopAfter || reachedBottom || threadComplete) {
          clearInterval(intervalId);
          setIsScrapingActive(false);
          isScrapingActiveRef.current = false;

          // Final progress update
          window.dispatchEvent(
            new CustomEvent('scraping-state-change', {
              detail: {
                isActive: false,
                progress: {
                  total: scrapedDataRef.current.length,
                  current: scrapedDataRef.current.length,
                  isComplete: true,
                },
                keepVisible: true,
                data: scrapedDataRef.current,
              },
            }),
          );

          // Keep viewer visible
          window.dispatchEvent(new CustomEvent('keep-viewer-visible'));

          // Ensure UI flips to inactive (race-safe final state event)
          window.dispatchEvent(
            new CustomEvent('scraping-state-change', {
              detail: {
                isActive: false,
                progress: {
                  total: scrapedDataRef.current.length,
                  current: scrapedDataRef.current.length,
                  isComplete: true,
                },
                keepVisible: true,
                data: scrapedDataRef.current,
                forceStop: true,
              },
            }),
          );

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

  // Scrape the full thread from the top including comments
  const startFullThreadScrapeFromTop = () => {
    // Reset state but keep includeCommentsRef = true
    scrapedDataRef.current = [];
    setScrapingProgress({ total: 0, current: 0 });
    setIsScrapingActive(true);

    // Show the viewer immediately
    window.dispatchEvent(new CustomEvent('show-tweet-viewer'));
    window.dispatchEvent(
      new CustomEvent('scraping-state-change', {
        detail: {
          isActive: true,
          progress: { total: 0, current: 0 },
          keepVisible: true,
          data: scrapedDataRef.current,
        },
      }),
    );

    const scrollContainer = (() => {
      const candidates = [
        document.querySelector('[data-testid="primaryColumn"]'),
        document.querySelector('main[role="main"]'),
        document.querySelector('[aria-label="Timeline: Conversation"]'),
        document.querySelector('[aria-label="Home timeline"]'),
      ];
      const c = candidates.find(el => el && el.scrollHeight > el.clientHeight);
      return c || document.scrollingElement || document.documentElement || document.body;
    })();

    const isWindow =
      scrollContainer === window ||
      scrollContainer === document.scrollingElement ||
      scrollContainer === document.documentElement ||
      scrollContainer === document.body;
    if (isWindow) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      scrollContainer.scrollTop = 0;
    }

    const scrapeVisibleTweets = async () => {
      const articles = document.querySelectorAll('article');
      for (const article of articles) {
        await scrapeTweet(article);
      }
    };

    let intervalId;
    const getTop = () => (isWindow ? window.scrollY : scrollContainer.scrollTop);
    const setScrollBy = amount => {
      if (isWindow) {
        window.scrollBy(0, amount);
      } else {
        scrollContainer.scrollTop = scrollContainer.scrollTop + amount;
      }
    };

    intervalId = setInterval(async () => {
      const before = getTop();
      setScrollBy(600);
      await scrapeVisibleTweets();
      setScrapingProgress(prev => {
        const newProgress = {
          total: Math.max(prev.total, scrapedDataRef.current.length + 5),
          current: scrapedDataRef.current.length,
        };
        window.dispatchEvent(
          new CustomEvent('scraping-state-change', {
            detail: { isActive: true, progress: newProgress, data: scrapedDataRef.current },
          }),
        );
        return newProgress;
      });

      const reachedBottom = (() => {
        if (isWindow) {
          const doc = document.scrollingElement || document.documentElement;
          return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight;
        }
        return Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight;
      })();

      if (before === getTop() || reachedBottom) {
        clearInterval(intervalId);
        setIsScrapingActive(false);
        isScrapingActiveRef.current = false;
        window.dispatchEvent(
          new CustomEvent('scraping-state-change', {
            detail: {
              isActive: false,
              progress: {
                total: scrapedDataRef.current.length,
                current: scrapedDataRef.current.length,
                isComplete: true,
              },
              keepVisible: true,
              data: scrapedDataRef.current,
            },
          }),
        );
        window.dispatchEvent(new CustomEvent('keep-viewer-visible'));

        // Ensure UI flips to inactive (race-safe final state event)
        window.dispatchEvent(
          new CustomEvent('scraping-state-change', {
            detail: {
              isActive: false,
              progress: {
                total: scrapedDataRef.current.length,
                current: scrapedDataRef.current.length,
                isComplete: true,
              },
              keepVisible: true,
              data: scrapedDataRef.current,
              forceStop: true,
            },
          }),
        );
        toast.success('Finished scraping full thread with comments');
      }
    }, 1800);
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
