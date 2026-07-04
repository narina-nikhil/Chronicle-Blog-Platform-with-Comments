import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Edit2, Trash2, MessageSquare, Send, Clock, User, LogIn, Loader2 } from 'lucide-react';
import { Post, Comment, User as UserType } from '../types';

interface PostDetailProps {
  key?: string;
  post: Post;
  currentUser: UserType | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onOpenAuth: () => void;
  showToast: (text: string, type: 'success' | 'error') => void;
}

export default function PostDetail({ post, currentUser, onBack, onEdit, onDelete, onOpenAuth, showToast }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Load comments
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to write a comment.', 'error');
      onOpenAuth();
      return;
    }

    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentContent.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit comment.');
      }

      setComments(prev => [...prev, data]);
      setCommentContent('');
      showToast('Comment added successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete comment.');
      }

      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast('Comment deleted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this entire article? This action cannot be undone.')) return;

    setIsDeletingPost(true);
    try {
      await onDelete();
      // Toast and routing handled in parent
    } catch (e: any) {
      showToast(e.message || 'Failed to delete post.', 'error');
      setIsDeletingPost(false);
    }
  };

  const isPostOwner = currentUser?.id === post.authorId;

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate reading time
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-12"
    >
      {/* Detail Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#121212]/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#121212]/60 hover:text-[#121212] transition font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          Back to Journal
        </button>

        {isPostOwner && (
          <div className="flex items-center gap-3">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#121212] hover:bg-[#121212] hover:text-white text-[10px] uppercase tracking-widest font-bold transition rounded-none"
            >
              <Edit2 className="w-3 h-3 stroke-[2.5]" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeletePost}
              disabled={isDeletingPost}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-700 hover:bg-red-700 hover:text-white text-red-700 text-[10px] uppercase tracking-widest font-bold transition rounded-none"
            >
              <Trash2 className="w-3 h-3 stroke-[2.5]" />
              <span>{isDeletingPost ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        )}
      </div>

      <article className="space-y-10">
        {/* Cover Photo */}
        {post.coverUrl && (
          <div className="aspect-video w-full rounded-none overflow-hidden bg-[#E8E6E1] border border-[#121212]/10 relative">
            <img
              src={post.coverUrl}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Article Meta Header */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-[#121212]/50 font-bold">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#121212] text-white rounded-full flex items-center justify-center text-[10px] font-bold select-none">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
              <span>By {post.authorName}</span>
            </span>
            <span className="w-10 h-[1px] bg-[#121212]/15" />
            <span>{formattedDate}</span>
            <span className="w-10 h-[1px] bg-[#121212]/15" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{readTime} Min Read</span>
            </span>
          </div>

          <h1 className="font-serif font-light text-4xl sm:text-6xl text-[#121212] tracking-tight leading-[1.1] mb-6">
            {post.title}
          </h1>

          {post.summary && (
            <p className="font-serif text-lg sm:text-xl leading-relaxed text-[#121212]/80 pr-12 italic border-l-2 border-[#121212]/20 pl-6 my-6">
              {post.summary}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#121212]/5 text-[#121212]/75 border border-[#121212]/10 rounded-none text-[9px] uppercase tracking-widest font-bold"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="border-t border-b border-[#121212]/10 py-10 my-10">
          <div className="prose prose-neutral max-w-none text-[#121212]/85 font-serif whitespace-pre-wrap leading-[1.8] text-base sm:text-lg pr-4">
            {post.content}
          </div>
        </div>
      </article>

      {/* Comment Section Header */}
      <section className="mt-16 space-y-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#121212]/10">
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#121212]">
            The Discussion ({comments.length})
          </h2>
          <span className="text-[10px] italic text-[#121212]/40">Chronicle Community Standards Apply</span>
        </div>

        {/* Leave Comment Area */}
        {currentUser ? (
          <form onSubmit={handlePostComment} className="flex gap-4 items-start bg-[#F5F4F0] p-6 rounded-none border border-[#121212]/10">
            <div className="w-8 h-8 bg-[#121212] text-white rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-1">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-4">
              <textarea
                placeholder="Add your perspective..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                required
                className="w-full text-[13px] p-4 bg-white border border-[#121212]/10 rounded-none focus:outline-hidden focus:border-[#121212] transition resize-none placeholder:italic placeholder:text-[#121212]/30"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentContent.trim()}
                  className="px-6 py-2 bg-[#121212] hover:bg-[#121212]/80 disabled:bg-[#121212]/30 text-white text-[10px] uppercase tracking-widest font-bold rounded-none transition cursor-pointer"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
                  ) : (
                    <Send className="w-3 h-3 inline mr-2" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center bg-[#F5F4F0] rounded-none border border-dashed border-[#121212]/20">
            <p className="text-sm text-[#121212]/60 mb-4 font-serif italic">
              Join the conversation to write and respond.
            </p>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#121212] hover:bg-[#121212]/80 text-white text-[10px] uppercase tracking-widest font-bold rounded-none transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Comment</span>
            </button>
          </div>
        )}

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#121212]/40" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {comments.map((comment, index) => {
                const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const isCommentOwner = currentUser?.id === comment.authorId;
                const canDelete = isCommentOwner || isPostOwner;

                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-6 rounded-none border border-[#121212]/10 bg-[#FDFCFB]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#E8E6E1] text-[#121212] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 border border-[#121212]/5 select-none">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-[#121212]">
                            {comment.authorName}
                          </span>
                          {comment.authorId === post.authorId && (
                            <span className="px-1.5 py-0.5 bg-[#121212] text-white rounded-none text-[8px] font-bold uppercase tracking-widest scale-90">
                              Author
                            </span>
                          )}
                          <span className="text-[#121212]/30">•</span>
                          <span className="text-[#121212]/40 italic">
                            {commentDate}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[#121212]/40 hover:text-red-700 p-1 rounded-none transition"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-[13px] leading-relaxed text-[#121212]/80 font-sans">
                        {comment.content}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-10 text-[#121212]/40 text-sm font-serif italic">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </section>
    </motion.div>
  );
}
