import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Clock, ArrowUpRight } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
}

export default function PostCard({ post, onClick, onTagClick }: PostCardProps) {
  // Estimate reading time: ~200 words per minute, average word is 5 characters
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const firstLetter = post.title.charAt(0).toUpperCase();

  return (
    <motion.article
      layout
      onClick={onClick}
      className="group flex flex-col bg-[#FDFCFB] border border-[#121212]/10 rounded-none overflow-hidden cursor-pointer shadow-none hover:bg-[#F5F4F0]/40 transition-all duration-300 h-full p-6"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#E8E6E1] shrink-0 border border-[#121212]/5 mb-6">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="object-cover w-full h-full transition duration-500 group-hover:scale-103"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-tr from-[#D9D7D2] to-[#E8E6E1] opacity-80">
            <span className="font-serif italic text-8xl text-[#121212]/5 select-none font-bold">
              {firstLetter}
            </span>
          </div>
        )}
        
        {/* Hover Arrow */}
        <div className="absolute top-4 right-4 bg-[#FDFCFB] p-2 rounded-none border border-[#121212]/10 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition duration-300">
          <ArrowUpRight className="w-3.5 h-3.5 text-[#121212]" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1">
        
        {/* Meta Header */}
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-[#121212]/50 font-bold mb-3">
          <span>{post.authorName}</span>
          <span className="w-1.5 h-[1px] bg-[#121212]/20" />
          <span>{formattedDate}</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl font-light tracking-tight text-[#121212] leading-snug mb-3 group-hover:italic transition-all">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="font-serif text-[13px] leading-relaxed text-[#121212]/70 line-clamp-3 mb-6 flex-1">
          {post.summary}
        </p>

        {/* Card Footer: Tags & Metrics */}
        <div className="flex items-end justify-between gap-4 pt-4 border-t border-[#121212]/10 mt-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
            {post.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => onTagClick(tag, e)}
                className="px-2 py-0.5 bg-[#121212]/5 text-[9px] uppercase tracking-widest font-bold text-[#121212]/70 hover:bg-[#121212] hover:text-white transition rounded-none"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Read Time & Comments */}
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[#121212]/50 shrink-0 font-bold">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 stroke-[2.5]" />
              <span>{readTime}M</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 stroke-[2.5]" />
              <span>{post.commentsCount}</span>
            </div>
          </div>
        </div>

      </div>
    </motion.article>
  );
}
