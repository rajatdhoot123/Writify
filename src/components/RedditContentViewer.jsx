import { useState, useEffect, useCallback } from 'react';
import { Button } from '@root/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@root/components/ui/card';
import { Download, X, CheckCircle2, MessageCircle, ExternalLink, ChevronDown, ChevronRight, User, MessageSquare, ThumbsUp } from 'lucide-react';
import { downloadFile } from './Scrapper';
import toast from 'react-hot-toast';

// Custom hook to manage Reddit content state
function useRedditContentManager() {
  const [scrapedContent, setScrapedContent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedComments, setExpandedComments] = useState(new Set());


  // Reset content
  const resetViewer = useCallback(() => {
    setScrapedContent(null);
    setExpandedComments(new Set());
  }, []);

  // Toggle comment expansion
  const toggleComment = useCallback((commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // Export scraped content
  const exportData = useCallback(() => {
    if (scrapedContent) {
      downloadFile('reddit-content-data', scrapedContent);
      toast.success('Reddit content exported successfully!');
    } else {
      toast.error('No content to export');
    }
  }, [scrapedContent]);

  return {
    scrapedContent,
    setScrapedContent,
    isVisible,
    setIsVisible,
    resetViewer,
    exportData,
    expandedComments,
    toggleComment,
  };
}

// Custom hook for event listeners
function useRedditContentEvents({
  setScrapedContent,
  setIsVisible,
  resetViewer,
}) {
  useEffect(() => {
    // Handle Reddit content scraped
    const handleRedditContentScraped = event => {
      if (!event.detail) return;
      setScrapedContent(event.detail);
      setIsVisible(true);
    };

    // Handle show/hide events
    const handleShow = () => setIsVisible(true);
    const handleHide = () => setIsVisible(false);
    const handleReset = () => {
      resetViewer();
      setIsVisible(false);
    };

    // Register event listeners
    window.addEventListener('reddit-content-scraped', handleRedditContentScraped);
    window.addEventListener('show-reddit-viewer', handleShow);
    window.addEventListener('hide-reddit-viewer', handleHide);
    window.addEventListener('reset-reddit-viewer', handleReset);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('reddit-content-scraped', handleRedditContentScraped);
      window.removeEventListener('show-reddit-viewer', handleShow);
      window.removeEventListener('hide-reddit-viewer', handleHide);
      window.removeEventListener('reset-reddit-viewer', handleReset);
    };
  }, [setScrapedContent, setIsVisible, resetViewer]);
}

// Component to render individual comment
function CommentItem({ comment, depth = 0, expandedComments, toggleComment }) {
  const isExpanded = expandedComments.has(comment.thingId);
  const hasChildren = comment.children && comment.children.length > 0;
  
  return (
    <div className={`comment-item ${depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-2">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              u/{comment.author}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Unknown time'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{comment.score}</span>
            </div>
          </div>
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleComment(comment.thingId)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Comment Content */}
        <div className="text-sm text-gray-800 dark:text-gray-200 mb-2">
          {comment.content || 'No content available'}
        </div>
        
        {/* Comment Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Depth: {comment.depth}</span>
          {comment.permalink && (
            <a 
              href={`https://reddit.com${comment.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View on Reddit
            </a>
          )}
        </div>
      </div>
      
      {/* Nested Comments */}
      {hasChildren && isExpanded && (
        <div className="nested-comments ml-4">
          {comment.children.map((child, index) => (
            <CommentItem
              key={child.thingId || index}
              comment={child}
              depth={depth + 1}
              expandedComments={expandedComments}
              toggleComment={toggleComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component to render comments section
function CommentsSection({ comments, expandedComments, toggleComment }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No comments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.thingId || index}
          comment={comment}
          expandedComments={expandedComments}
          toggleComment={toggleComment}
        />
      ))}
    </div>
  );
}

export default function RedditContentViewer() {
  // Use our custom hooks
  const {
    scrapedContent,
    setScrapedContent,
    isVisible,
    setIsVisible,
    resetViewer,
    exportData,
    expandedComments,
    toggleComment,
  } = useRedditContentManager();

  // Register event listeners
  useRedditContentEvents({
    setScrapedContent,
    setIsVisible,
    resetViewer,
  });

  // Hide viewer if not visible
  if (!isVisible) {
    return null;
  }

  // Render Reddit content item
  const renderRedditContent = (content) => (
    <div className="space-y-6">
      {/* Post Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-200/50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {content.subreddit || 'r/Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                u/{content.author || 'Unknown'}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {content.title || 'No title'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Score: {content.score || '0'}</span>
            <span>•</span>
            <span>{content.totalComments || content.comments || '0'} comments</span>
          </div>
        </div>
        
        {/* Post Content */}
        {content.content && (
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">
              {content.content}
            </p>
          </div>
        )}
        
        {/* Post Metadata */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-200/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>URL: {content.url ? new URL(content.url).pathname : 'Unknown'}</span>
            <span>•</span>
            <span>Scraped: {new Date(content.timestamp).toLocaleString()}</span>
          </div>
          {content.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(content.url, '_blank')}
              className="h-7 px-2 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Post
            </Button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {content.commentsData && content.commentsData.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Comments ({content.totalComments || content.commentsData.length})
            </h3>
          </div>
          <CommentsSection 
            comments={content.commentsData}
            expandedComments={expandedComments}
            toggleComment={toggleComment}
          />
        </div>
      )}
    </div>
  );

  // Render UI
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      data-reddit-viewer-element="true">
      <Card className="w-full max-w-4xl relative max-h-[90vh] flex flex-col shadow-2xl border-0">
        {/* Header Section */}
        <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-r from-orange-500/5 to-orange-600/0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  Reddit Content Viewer
                </CardTitle>
                {scrapedContent && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Content Scraped
                  </div>
                )}
              </div>
              <CardDescription className="text-base">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {scrapedContent ? 'Reddit post content successfully scraped' : 'No content available'}
                </div>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="flex-grow overflow-hidden">
          <div className="h-[70vh] overflow-y-auto pr-2">
            {scrapedContent ? (
              renderRedditContent(scrapedContent)
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-orange-500/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      No Reddit content scraped yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the scrape button on a Reddit post to view its content here
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="flex flex-col gap-3 border-t border-border/50 bg-muted/30 pt-4 pb-4 px-6">
          <div className="flex gap-2 w-full">
            <Button
              onClick={exportData}
              disabled={!scrapedContent}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all duration-200 h-10 rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              Export Content
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              className="flex-1 font-medium transition-all duration-200 h-10 rounded-lg">
              Close
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
