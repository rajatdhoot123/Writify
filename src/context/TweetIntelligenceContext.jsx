import React, { useCallback } from 'react';
import { toast } from 'react-hot-toast';

const TweetIntelligenceContext = React.createContext();

const TweetIntelligenceProvider = ({ children }) => {
  const scrapedDataRef = React.useRef([]);
  const processedTweets = React.useRef(new Set());
  const scrapeTweetRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const setScrapingProgress = React.useState({ total: 0, current: 0 });
  const setIsScrapingActive = React.useState(false);
  const setForceStopped = React.useState(false);
  const setIsVisible = React.useState(false);

  const addTweetIfNew = useCallback((tweet) => {
    // Implementation of addTweetIfNew
  }, []);

  const initializeScraping = useCallback((initialTweet = null) => {
    try {
      // Reset everything
      scrapedDataRef.current = [];
      setScrapingProgress({ total: 0, current: 0 });
      processedTweets.current = new Set();
      
      // Reset force stopped state first
      setForceStopped(false);
      
      // Set scraping as active
      setIsScrapingActive(true);
      
      // Add initial tweet if provided
      if (initialTweet) {
        scrapedDataRef.current = [initialTweet];
        addTweetIfNew(initialTweet);
        setScrapingProgress({
          total: 1,
          current: 1
        });
      }
      
      // Show the viewer
      setIsVisible(true);
      
      // Start scraping process immediately
      const scrapeVisibleTweets = async () => {
        try {
          const articles = document.querySelectorAll('article[data-testid="tweet"]');
          let newTweetsFound = false;
          
          for (const article of articles) {
            if (!isScrapingActive) break;
            
            // Skip if we've already processed this tweet
            const tweetText = article.querySelector('[data-testid="tweetText"]')?.textContent || '';
            const hash = hashCode(tweetText);
            if (processedTweets.current.has(hash)) continue;
            
            const tweetData = await scrapeTweetRef.current(article);
            if (tweetData) {
              newTweetsFound = true;
              processedTweets.current.add(hash);
            }
          }
          
          return newTweetsFound;
        } catch (error) {
          console.error('Error in scrapeVisibleTweets:', error);
          return false;
        }
      };

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      let noNewTweetsCount = 0;
      const MAX_NO_NEW_TWEETS = 3;
      let lastScrollPosition = window.scrollY;

      // Start the scraping interval
      intervalRef.current = setInterval(async () => {
        try {
          if (!isScrapingActive) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
          }

          // Scroll down
          window.scrollBy(0, 800);
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newTweetsFound = await scrapeVisibleTweets();
          
          if (!newTweetsFound) {
            noNewTweetsCount++;
            if (noNewTweetsCount >= MAX_NO_NEW_TWEETS) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              setIsScrapingActive(false);
              setForceStopped(false);
              
              setScrapingProgress({
                total: scrapedDataRef.current.length,
                current: scrapedDataRef.current.length,
                isComplete: true
              });
              
              toast.success('Finished scraping thread');
            }
          } else {
            noNewTweetsCount = 0;
          }
          
          // Check if we've reached the bottom
          const currentScrollPosition = window.scrollY;
          if (currentScrollPosition === lastScrollPosition) {
            noNewTweetsCount++;
            if (noNewTweetsCount >= MAX_NO_NEW_TWEETS) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              setIsScrapingActive(false);
              setForceStopped(false);
              
              setScrapingProgress({
                total: scrapedDataRef.current.length,
                current: scrapedDataRef.current.length,
                isComplete: true
              });
              
              toast.success('Finished scraping thread');
            }
          } else {
            lastScrollPosition = currentScrollPosition;
          }
        } catch (error) {
          console.error('Error in scraping interval:', error);
          toast.error('Error during scraping');
        }
      }, 2000);

      // Initial scrape
      scrapeVisibleTweets().catch(error => {
        console.error('Error in initial scrape:', error);
        toast.error('Failed to start scraping');
      });
    } catch (error) {
      console.error('Error in initializeScraping:', error);
      toast.error('Failed to initialize scraping');
      setIsScrapingActive(false);
      setForceStopped(false);
    }
  }, [addTweetIfNew, isScrapingActive]);

  return (
    <TweetIntelligenceContext.Provider value={{
      scrapedDataRef,
      processedTweets,
      scrapeTweetRef,
      intervalRef,
      setScrapingProgress,
      setIsScrapingActive,
      setForceStopped,
      setIsVisible,
      initializeScraping
    }}>
      {children}
    </TweetIntelligenceContext.Provider>
  );
};

export default TweetIntelligenceProvider; 