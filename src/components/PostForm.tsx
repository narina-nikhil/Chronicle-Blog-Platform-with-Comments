import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Save, Eye, Edit3, Image, Tag, HelpCircle } from 'lucide-react';
import { Post } from '../types';

interface PostFormProps {
  key?: string;
  post?: Post; // If provided, we are in Edit mode
  onSave: (data: { title: string; summary: string; content: string; tags: string[]; coverUrl: string }) => Promise<void>;
  onCancel: () => void;
  showToast: (text: string, type: 'success' | 'error') => void;
}

export default function PostForm({ post, onSave, onCancel, showToast }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize values if editing
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSummary(post.summary);
      setContent(post.content);
      setCoverUrl(post.coverUrl || '');
      setTagsInput(post.tags.join(', '));
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Process tags
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await onSave({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        tags,
        coverUrl: coverUrl.trim(),
      });
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving the post.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Back Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#121212]/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#121212]/60 hover:text-[#121212] transition font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          Back to Journal
        </button>

        {/* View Toggle */}
        <div className="flex border border-[#121212]/15 bg-[#FDFCFB] rounded-none p-1 text-[10px] font-bold uppercase tracking-widest">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-none transition cursor-pointer ${
              mode === 'edit'
                ? 'bg-[#121212] text-white'
                : 'text-[#121212]/50 hover:text-[#121212]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-none transition cursor-pointer ${
              mode === 'preview'
                ? 'bg-[#121212] text-white'
                : 'text-[#121212]/50 hover:text-[#121212]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>

      <h1 className="font-serif font-light text-3xl sm:text-4xl text-[#121212] tracking-tight mb-2">
        {post ? 'Edit Chronicle Entry' : 'Compose New Entry'}
      </h1>
      <p className="font-serif italic text-sm text-[#121212]/50 mb-10">
        {post ? 'Update your article contents, summary, and descriptors for the archive.' : 'Publish your insights, design concepts, or narrative essays.'}
      </p>

      {mode === 'edit' ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Input */}
          <div>
            <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-3">
              Article Title
            </label>
            <input
              type="text"
              required
              placeholder="E.g., The Silent Modernist: Architecture of the Soul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-light font-serif px-4 py-3 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-... (Leave empty for default)"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
            />
          </div>

          {/* Excerpt / Summary */}
          <div>
            <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-3">
              Excerpt / Brief Summary
            </label>
            <textarea
              placeholder="Provide a brief summary of the article to be shown in the article feed."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              maxLength={250}
              className="w-full text-sm px-4 py-3 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-[#121212] font-serif focus:outline-hidden focus:border-[#121212] transition resize-none placeholder:italic placeholder:text-[#121212]/30"
            />
            <div className="text-right text-[10px] text-[#121212]/40 mt-1 uppercase tracking-wider font-semibold">
              {summary.length}/250 characters
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em]">
                Article Content
              </label>
              <div className="flex items-center gap-1 text-[10px] text-[#121212]/40 uppercase tracking-wider font-semibold">
                <HelpCircle className="w-3 h-3" />
                <span>Supports basic Markdown blocks</span>
              </div>
            </div>
            <textarea
              required
              placeholder="Let your thoughts flow. Use markdown symbols like ### for subheadings, * for lists..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full text-base font-serif px-5 py-4 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-[#121212] focus:outline-hidden focus:border-[#121212] transition leading-relaxed min-h-[300px]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags / Keywords
            </label>
            <input
              type="text"
              placeholder="Architecture, Minimalist, Theory (separated by commas)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#121212]/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-[#121212]/15 hover:border-[#121212] text-[#121212]/70 text-[10px] uppercase tracking-widest font-bold rounded-none transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#121212] hover:bg-[#121212]/85 disabled:bg-[#121212]/30 text-white text-[10px] uppercase tracking-widest font-bold rounded-none transition"
            >
              <span>{isSaving ? 'Publishing...' : post ? 'Save Changes' : 'Publish Entry'}</span>
              {post ? <Save className="w-3.5 h-3.5 stroke-[2.5]" /> : <Send className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          </div>
        </form>
      ) : (
        /* Preview Mode */
        <div className="bg-[#FDFCFB] border border-[#121212]/10 rounded-none p-8 space-y-8">
          {coverUrl && (
            <div className="aspect-video w-full rounded-none overflow-hidden bg-[#E8E6E1] border border-[#121212]/5">
              <img src={coverUrl} alt="Preview cover" referrerPolicy="no-referrer" className="object-cover w-full h-full" />
            </div>
          )}

          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-[#121212] leading-tight">
              {title || 'Untitled Post'}
            </h1>

            {summary && (
              <p className="font-serif text-base text-[#121212]/80 leading-relaxed italic border-l-2 border-[#121212]/20 pl-4 my-4">
                {summary}
              </p>
            )}

            {/* Simulated tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="px-3 py-1 bg-[#121212]/5 text-[#121212]/75 border border-[#121212]/10 rounded-none text-[9px] uppercase tracking-widest font-bold">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="border-t border-[#121212]/10 pt-6">
              {/* Formatted Text Preview */}
              <div className="prose prose-neutral max-w-none text-[#121212]/85 font-serif whitespace-pre-wrap leading-[1.8] text-base">
                {content || <span className="text-[#121212]/40 font-sans italic">Write some contents in the Write tab to see preview...</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
