/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { findClosestParent, findClosest, clearContent } from '@root/src/lib/extension';
import useStore from '@root/src/lib/store';
import { createPortal } from 'react-dom';
import Loader from '@root/src/components/loader';
import toast from 'react-hot-toast';
import Dropdown from '@root/src/components/Dropdown';
import RedditContentViewer from '@root/src/components/RedditContentViewer';

const toolSuit_id = 'reddit-ai';

const AiRedditToolbar = ({ handleGenerateAiPost, loader, dispatch, promptList, activePrompt }) => {
  return (
    <div
      className="reddit-ai-toolbar"
      style={{
        borderRadius: '8px',
        marginTop: '8px',
        backgroundColor: '#ff4500',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '0 8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
      <div style={{ maxWidth: '150px', minWidth: '100px' }}>
        <Dropdown dispatch={dispatch} promptList={promptList} activePrompt={activePrompt} theme="reddit" />
      </div>
      <button 
        style={{ 
          margin: 'auto 4px', 
          display: 'flex',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          padding: '4px',
          borderRadius: '4px',
        }} 
        onClick={handleGenerateAiPost}
      >
        {loader ? (
          <Loader source="reddit" />
        ) : (
          <svg
            style={{ height: '18px', width: '18px' }}
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg">
            <path d="m22 2-7 20-4-9-9-4Z"></path>
            <path d="M22 2 11 13"></path>
          </svg>
        )}
      </button>

      <button
        style={{ 
          margin: 'auto 4px', 
          display: 'flex',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          padding: '4px',
          borderRadius: '4px',
        }}
        onClick={async () => {
          await chrome.runtime.sendMessage({
            action: 'OPEN_SETTING_PAGE',
          });
        }}>
        <svg
          style={{ height: '18px', width: '18px' }}
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 512 512"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
            d="M262.29 192.31a64 64 0 1 0 57.4 57.4 64.13 64.13 0 0 0-57.4-57.4zM416.39 256a154.34 154.34 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.48 164.48 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22 155.3 155.3 0 0 1-21.46-12.57 16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.48 164.48 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22 155.3 155.3 0 0 1 21.46 12.57 16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47z"></path>
        </svg>
      </button>
    </div>
  );
};

const Reddit = () => {
  const [loader, setLoader] = useState(false);
  const [state, dispatch] = useStore();

  // Function to extract comment data from shreddit-comment elements
  const extractCommentData = useCallback((commentElement) => {
    try {
      const author = commentElement.getAttribute('author') || 
                   commentElement.querySelector('[slot="commentMeta"] a[href*="/user/"]')?.textContent?.trim() ||
                   commentElement.querySelector('.author-name-meta a')?.textContent?.trim() ||
                   'Unknown';
      
      const score = commentElement.getAttribute('score') || 
                   commentElement.querySelector('[slot="actionRow"] span')?.textContent?.trim() ||
                   '0';
      
      const depth = parseInt(commentElement.getAttribute('depth') || '0');
      
      const permalink = commentElement.getAttribute('permalink') || '';
      
      const content = commentElement.querySelector('[slot="comment"]')?.textContent?.trim() ||
                     commentElement.querySelector('.md')?.textContent?.trim() ||
                     commentElement.querySelector('[id*="comment-rtjson-content"]')?.textContent?.trim() ||
                     '';
      
      const timestamp = commentElement.querySelector('time')?.getAttribute('datetime') ||
                       commentElement.querySelector('time')?.textContent?.trim() ||
                       '';
      
      const thingId = commentElement.getAttribute('thingid') || '';
      
      return {
        author,
        score: parseInt(score) || 0,
        depth,
        content,
        permalink,
        timestamp,
        thingId,
        children: []
      };
    } catch (error) {
      console.error('Error extracting comment data:', error);
      return null;
    }
  }, []);

  // Function to recursively scrape nested comments
  const scrapeNestedComments = useCallback((commentElement, maxDepth = 10) => {
    const commentData = extractCommentData(commentElement);
    if (!commentData) return null;

    // Find child comments using various selectors
    const childSelectors = [
      `[slot*="children-${commentData.thingId}"]`,
      `[slot^="children-"]`,
      'shreddit-comment[depth]',
      '[id*="comment-children"] shreddit-comment'
    ];

    const childComments = [];
    
    for (const selector of childSelectors) {
      const children = commentElement.querySelectorAll(selector);
      if (children.length > 0) {
        children.forEach(child => {
          if (child.tagName === 'SHREDDIT-COMMENT' && child !== commentElement) {
            const childData = scrapeNestedComments(child, maxDepth - 1);
            if (childData) {
              childComments.push(childData);
            }
          }
        });
        break; // Use the first selector that finds children
      }
    }

    // Also look for comments in the comment-children div
    const commentChildrenDiv = commentElement.querySelector('[id*="comment-children"]');
    if (commentChildrenDiv) {
      const directChildren = commentChildrenDiv.querySelectorAll('shreddit-comment');
      directChildren.forEach(child => {
        if (child !== commentElement) {
          const childData = scrapeNestedComments(child, maxDepth - 1);
          if (childData) {
            childComments.push(childData);
          }
        }
      });
    }

    commentData.children = childComments;
    return commentData;
  }, [extractCommentData]);

  // Function to continuously scroll and scrape comments
  const scrollAndScrapeComments = useCallback(async (onProgress) => {
    const allComments = new Map(); // Use Map to avoid duplicates
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // Prevent infinite scrolling
    let lastCommentCount = 0;
    let stableCount = 0; // Count how many times comment count stayed the same
    let shouldStop = false; // Flag to stop scraping

    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    };

    const scrapeCurrentComments = () => {
      const commentElements = document.querySelectorAll('shreddit-comment');
      let newCommentsFound = 0;

      commentElements.forEach(commentElement => {
        const depth = parseInt(commentElement.getAttribute('depth') || '0');
        const thingId = commentElement.getAttribute('thingid');
        
        if (thingId && !allComments.has(thingId)) {
          // Only process top-level comments (depth 0 or 1) to avoid duplicates
          if (depth <= 1) {
            const commentData = scrapeNestedComments(commentElement);
            if (commentData) {
              allComments.set(thingId, commentData);
              newCommentsFound++;
            }
          }
        }
      });

      return newCommentsFound;
    };

    // Initial scrape
    scrapeCurrentComments();
    onProgress?.(allComments.size, 'Initial scraping...', Array.from(allComments.values()));

    // Listen for stop event
    const handleStopScraping = () => {
      shouldStop = true;
    };
    window.addEventListener('reddit-scraping-stop', handleStopScraping);

    // Start continuous scrolling and scraping
    const scrollInterval = setInterval(async () => {
      scrollAttempts++;
      
      // Check if we should stop
      if (scrollAttempts >= maxScrollAttempts || shouldStop) {
        clearInterval(scrollInterval);
        window.removeEventListener('reddit-scraping-stop', handleStopScraping);
        onProgress?.(allComments.size, `Scraping complete! Found ${allComments.size} comments.`, Array.from(allComments.values()));
        return;
      }

      // Scroll to bottom
      scrollToBottom();
      
      // Wait a bit for new content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Scrape new comments
      scrapeCurrentComments();
      
      // Check if we're still finding new comments
      if (allComments.size === lastCommentCount) {
        stableCount++;
        if (stableCount >= 3) { // Stop if no new comments for 3 attempts
          clearInterval(scrollInterval);
          onProgress?.(allComments.size, `Scraping complete! Found ${allComments.size} comments.`, Array.from(allComments.values()));
          return;
        }
      } else {
        stableCount = 0; // Reset stable count if we found new comments
      }
      
      lastCommentCount = allComments.size;
      onProgress?.(allComments.size, `Scraping... Found ${allComments.size} comments so far.`, Array.from(allComments.values()));
      
    }, 3000); // Check every 3 seconds

    // Return a promise that resolves when scraping is complete
    return new Promise((resolve) => {
      const checkComplete = setInterval(() => {
        if (scrollAttempts >= maxScrollAttempts || stableCount >= 3 || shouldStop) {
          clearInterval(checkComplete);
          window.removeEventListener('reddit-scraping-stop', handleStopScraping);
          resolve(Array.from(allComments.values()));
        }
      }, 1000);
    });
  }, [scrapeNestedComments]);

  const handleScrapeRedditContent = useCallback(async () => {
    try {
      // Show dialog immediately when scrape button is clicked
      window.dispatchEvent(new CustomEvent('show-reddit-viewer'));
      
      // Extract post content
      const postTitle = document.querySelector('h1[id*="post-title"]')?.textContent || 
                       document.querySelector('[data-testid="post-title"]')?.textContent || '';
      
      const postContent = document.querySelector('shreddit-post-text-body')?.textContent || 
                         document.querySelector('[data-testid="post-content"]')?.textContent || '';
      
      const postAuthor = document.querySelector('.author-name')?.textContent || 
                        document.querySelector('[slot="commentMeta"] a[href*="/user/"]')?.textContent?.trim() ||
                        'Unknown';
      
      const subreddit = document.querySelector('.subreddit-name')?.textContent || 
                       document.querySelector('[data-testid="subreddit-name"]')?.textContent ||
                       window.location.pathname.split('/')[1] || 'Unknown';
      
      const postScore = document.querySelector('[data-post-click-location="vote"] span')?.textContent || 
                       document.querySelector('[slot="actionRow"] span')?.textContent?.trim() ||
                       '0';
      
      const commentCount = document.querySelector('[data-post-click-location="comments-button"] span')?.textContent || 
                          document.querySelector('[data-testid="comments-count"]')?.textContent ||
                          '0';

      // Show initial progress
      toast.loading('Starting infinite scroll scraping...', { id: 'scraping-progress' });
      
      // Dispatch initial post data immediately
      window.dispatchEvent(new CustomEvent('reddit-scraping-progress', {
        detail: { 
          count: 0, 
          message: 'Starting to scrape comments...',
          title: postTitle,
          content: postContent,
          author: postAuthor,
          subreddit: subreddit,
          score: postScore,
          totalComments: commentCount,
          commentsData: []
        }
      }));
      
      // Dispatch scraping start event
      window.dispatchEvent(new CustomEvent('reddit-scraping-start'));

      // Start continuous scraping with progress updates
      const allComments = await scrollAndScrapeComments((count, message, partialComments) => {
        toast.loading(`${message} (${count} comments)`, { id: 'scraping-progress' });
        
        // Dispatch progress event for the viewer with partial data
        window.dispatchEvent(new CustomEvent('reddit-scraping-progress', {
          detail: { 
            count, 
            message,
            title: postTitle,
            content: postContent,
            author: postAuthor,
            subreddit: subreddit,
            score: postScore,
            totalComments: commentCount,
            commentsData: partialComments || []
          }
        }));
      });

      const scrapedData = {
        title: postTitle,
        content: postContent,
        author: postAuthor,
        subreddit: subreddit,
        score: postScore,
        comments: commentCount,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        commentsData: allComments,
        totalComments: Array.isArray(allComments) ? allComments.length : 0
      };

      // Store scraped data
      await chrome.storage.local.set({ 
        redditScrapedData: scrapedData,
        lastScraped: new Date().toISOString()
      });

      // Dispatch event to show the modal with scraped content
      window.dispatchEvent(new CustomEvent('reddit-content-scraped', {
        detail: scrapedData
      }));

      // Dismiss loading toast and show success
      toast.dismiss('scraping-progress');
      toast.success(`Reddit content scraped successfully! Found ${Array.isArray(allComments) ? allComments.length : 0} comments.`);
      
      // Dispatch scraping stop event
      window.dispatchEvent(new CustomEvent('reddit-scraping-stop'));
    } catch (error) {
      console.error('Error scraping Reddit content:', error);
      toast.dismiss('scraping-progress');
      toast.error('Failed to scrape Reddit content');
    }
  }, [scrollAndScrapeComments]);

  const handleGenerateAiPost = useCallback(
    async event => {
      console.log('HandleGenerateAiPost State:', {
        fullState: state,
        modelConfig: state?.modelConfig,
        promptList: state?.promptList,
      });
      
      const needsOllamaConfig = state.modelConfig.type === 'ollama';
      const hasModelSelected = needsOllamaConfig ? !!state.modelConfig.model : true;
      const hasValidHost = needsOllamaConfig ? !!state.modelConfig.host : true;

      // Show error if any required config is missing
      if (!state.modelConfig.type || !hasModelSelected || !hasValidHost) {
        let errorMessage = 'Please ';
        if (!state.modelConfig.type) {
          errorMessage += 'select a model type';
        } else if (!hasModelSelected) {
          errorMessage += 'select a model';
        } else {
          errorMessage += 'provide valid Ollama host';
        }

        return toast.custom(
          <div className="bg-red-500 font-semibold p-2 text-white rounded-md z-[999] relative text-sm">
            {errorMessage} in the
            <button
              onClick={async () => {
                await chrome.runtime.sendMessage({
                  action: 'OPEN_SETTING_PAGE',
                });
              }}>
              {' settings'}
            </button>
          </div>,
        );
      }
      
      setLoader(true);
      try {
        // Find Reddit's text area for posts/comments
        const contentEditable = findClosestParent(event.target, '[data-testid="post-content"]') || 
                               findClosestParent(event.target, '[data-testid="comment-content"]') ||
                               findClosestParent(event.target, '.ql-editor') ||
                               findClosestParent(event.target, 'textarea') ||
                               findClosestParent(event.target, 'shreddit-post') ||
                               findClosestParent(event.target, '[data-testid="post-title"]') ||
                               findClosestParent(event.target, 'h1[id*="post-title"]');

        // Extract content from various Reddit elements
        let input = '';
        if (contentEditable) {
          if (contentEditable.tagName === 'TEXTAREA') {
            input = (contentEditable as HTMLTextAreaElement).value || '';
          } else if (contentEditable.tagName === 'H1' && contentEditable.id.includes('post-title')) {
            // Extract post title
            input = contentEditable.textContent || '';
          } else if (contentEditable.tagName === 'SHREDDIT-POST') {
            // Extract post content from shreddit-post element
            const titleElement = contentEditable.querySelector('h1[id*="post-title"]');
            const textBody = contentEditable.querySelector('shreddit-post-text-body');
            const title = titleElement?.textContent || '';
            const body = textBody?.textContent || '';
            input = `${title}\n\n${body}`.trim();
          } else {
            input = contentEditable.textContent || '';
          }
        }
        
        const activePromptObj = state.promptList.find(p => p.value === state.settings.active_prompt);

        const payload = {
          contents: [
            {
              parts: [
                { text: activePromptObj?.description || '' }, // System prompt
                { text: '\n\n' }, // Separator
                { text: input || '' }, // User input
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            response_mime_type: 'application/json',
            response_schema: {
              type: 'OBJECT',
              properties: {
                improved_text: { type: 'STRING' },
                explanation: { type: 'STRING' },
              },
              required: ['improved_text'],
            },
          },
        };

        const response: any = await chrome.runtime.sendMessage({
          action: 'CALL_LLM',
          payload,
        });

        let improvedText = '';

        if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          // Parse the JSON string from the text field
          const parsedResponse = JSON.parse(response.candidates[0].content.parts[0].text);
          improvedText = parsedResponse.improved_text;

          // Optionally log the explanation
          if (parsedResponse.explanation) {
            console.log('Explanation:', parsedResponse.explanation);
          }
        } else if (response.error) {
          improvedText = response.error;
        }

        if (contentEditable) {
          contentEditable.focus();
          setTimeout(() => {
            clearContent(contentEditable);
            
            // Handle different Reddit input types
            if (contentEditable.tagName === 'TEXTAREA') {
              (contentEditable as HTMLTextAreaElement).value = improvedText;
              contentEditable.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (contentEditable.tagName === 'H1' && contentEditable.id.includes('post-title')) {
              // Update post title
              contentEditable.textContent = improvedText;
              contentEditable.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (contentEditable.tagName === 'SHREDDIT-POST') {
              // Update post content in shreddit-post element
              const titleElement = contentEditable.querySelector('h1[id*="post-title"]');
              const textBody = contentEditable.querySelector('shreddit-post-text-body');
              
              if (titleElement) {
                titleElement.textContent = improvedText;
                titleElement.dispatchEvent(new Event('input', { bubbles: true }));
              } else if (textBody) {
                textBody.textContent = improvedText;
                textBody.dispatchEvent(new Event('input', { bubbles: true }));
              }
            } else {
              contentEditable.textContent = improvedText;
              contentEditable.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 200);
        }
      } catch (err) {
        console.log('Error generating Reddit post:', err);
        toast.error('Failed to generate Reddit post');
      } finally {
        setLoader(false);
      }
    },
    [state],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Look for Reddit's post creation areas and comment areas
      // Updated selectors for new Reddit structure
      const postAreas = document.querySelectorAll(`
        [data-testid="post-content"], 
        [data-testid="comment-content"], 
        .ql-editor, 
        textarea[placeholder*="post"], 
        textarea[placeholder*="comment"],
        textarea[placeholder*="What are your thoughts"],
        textarea[placeholder*="Add a comment"],
        shreddit-post,
        [data-testid="post-title"],
        h1[id*="post-title"]
      `);
      
      [...postAreas].forEach(el => {
        // Find the container where we should add our toolbar
        const container = findClosest(el, '[data-testid="post-content"]') || 
                         findClosest(el, '[data-testid="comment-content"]') ||
                         findClosest(el, '.ql-container') ||
                         findClosest(el, 'form') ||
                         findClosest(el, 'shreddit-post') ||
                         findClosest(el, '[data-testid="post-title"]') ||
                         el.parentElement;
        
        if (container && !container.querySelector(`#${toolSuit_id}`)) {
          const toolSuit = document.createElement('div');
          toolSuit.id = toolSuit_id;
          container.appendChild(toolSuit);
        }
      });

      // Add scrape button to navigation bar
      const navBar = document.querySelector('nav.h-header-large');
      if (navBar && !navBar.querySelector('#reddit-scrape-button')) {
        const scrapeButton = document.createElement('div');
        scrapeButton.id = 'reddit-scrape-button';
        scrapeButton.innerHTML = `
          <button 
            class="button-medium px-[var(--rem8)] button-plain icon items-center justify-center button inline-flex"
            style="color: #ff4500; border: 1px solid #ff4500; border-radius: 4px;"
            title="Scrape Reddit Content"
            id="reddit-scrape-btn"
          >
            <span class="flex items-center justify-center">
              <span class="flex me-xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
              <span>Scrape</span>
            </span>
          </button>
        `;
        
        // Add click handler
        const button = scrapeButton.querySelector('#reddit-scrape-btn');
        if (button) {
          button.addEventListener('click', handleScrapeRedditContent);
        }
        
        // Insert before the user menu (last element in the nav)
        const userMenu = navBar.querySelector('[data-part="inbox"]')?.parentElement;
        if (userMenu) {
          userMenu.parentNode.insertBefore(scrapeButton, userMenu);
        }
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [handleGenerateAiPost, handleScrapeRedditContent]);

  return (
    <div>
      {[...document.querySelectorAll(`[id='${toolSuit_id}']`)].map((el, index) => {
        return createPortal(
          <AiRedditToolbar
            loader={loader}
            key={index}
            handleGenerateAiPost={handleGenerateAiPost}
            dispatch={dispatch}
            promptList={state.promptList}
            activePrompt={state.settings.active_prompt}
          />,
          el as Element | DocumentFragment,
          crypto.randomUUID(),
        );
      })}
      <RedditContentViewer />
    </div>
  );
};

export default Reddit;
