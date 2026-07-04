import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import PostForm from './components/PostForm';
import Toast, { ToastMessage } from './components/Toast';
import { User, Post } from './types';

export default function App() {
  // Views: 'home' | 'create' | 'edit' | 'detail'
  const [view, setView] = useState<string>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show customized beautiful toast alert
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      text
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check login state on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    fetchPosts();
  }, []);

  // Fetch all posts from backend
  const fetchPosts = async () => {
    setIsAppLoading(true);
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        showToast('Failed to load posts from server.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not connect to backend APIs.', 'error');
    } finally {
      setIsAppLoading(false);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    showToast('Signed out successfully.', 'success');
    // If on writing/editing view, redirect to home
    if (view === 'create' || view === 'edit') {
      setView('home');
    }
  };

  // Save/Publish Post
  const handleSavePost = async (formData: { title: string; summary: string; content: string; tags: string[]; coverUrl: string }) => {
    try {
      const token = localStorage.getItem('token');
      const isEditing = view === 'edit' && selectedPost;
      
      const url = isEditing ? `/api/posts/${selectedPost.id}` : '/api/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish post.');
      }

      // Update posts cache
      if (isEditing) {
        setPosts(prev => prev.map(p => p.id === data.id ? data : p));
        setSelectedPost(data);
        setView('detail');
        showToast('Article changes saved.', 'success');
      } else {
        setPosts(prev => [data, ...prev]);
        setView('home');
        showToast('Article published successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
      throw err;
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete post.');
      }

      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setView('home');
      setSelectedPost(null);
      showToast('Article deleted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
      throw err;
    }
  };

  // Navigations
  const handleNavigate = (targetView: string, arg?: string) => {
    if (targetView === 'home') {
      setSelectedPost(null);
      setSelectedTag(null);
      setSearchQuery('');
      setView('home');
    } else if (targetView === 'create') {
      if (!currentUser) {
        showToast('Please sign in to write an article.', 'error');
        setIsAuthOpen(true);
      } else {
        setView('create');
      }
    } else if (targetView === 'edit' && selectedPost) {
      setView('edit');
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setView('detail');
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    setSelectedTag(tag === selectedTag ? null : tag);
    setView('home');
  };

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag 
      ? post.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())
      : true;

    return matchesSearch && matchesTag;
  });

  // Get unique tags across all posts
  const allTags = Array.from(
    new Set(posts.flatMap(p => p.tags))
  ).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#121212] flex flex-col font-sans selection:bg-[#121212] selection:text-white antialiased">
      {/* Dynamic Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Auth modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={handleAuthSuccess}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Navbar navigation controls */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={handleNavigate}
        currentView={view}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              {/* Hero Banner Section */}
              <div className="relative overflow-hidden bg-[#F5F4F0] rounded-none p-8 sm:p-14 mb-14 border border-[#121212]/10">
                <div className="absolute top-0 right-0 p-8 text-[#121212]/5 pointer-events-none hidden md:block">
                  <Sparkles className="w-32 h-32 stroke-[0.3]" />
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-5">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#121212]/50 font-bold italic mb-2 block">
                    Volume 04 / Issue 12 — Architecture &amp; Design
                  </span>
                  
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light text-[#121212] tracking-tight leading-[1.05]">
                    The Silent <span className="italic">Modernist.</span>
                  </h1>
                  
                  <p className="font-serif text-base sm:text-lg text-[#121212]/70 leading-relaxed max-w-xl">
                    To build is to speak, but to build well is to listen. Chronicle is a space for design-centric minds to publish rich articles, browse curated columns, and discuss timeless aesthetics.
                  </p>
                  
                  {!currentUser && (
                    <div className="pt-3">
                      <button
                        onClick={() => setIsAuthOpen(true)}
                        className="px-6 py-2.5 border border-[#121212] text-[10px] uppercase tracking-widest font-bold hover:bg-[#121212] hover:text-white rounded-none transition cursor-pointer"
                      >
                        Begin Your Chronicle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Feed Controls: Search and Tag filter */}
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10 pb-6 border-b border-[#121212]/10">
                {/* Search input bar */}
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#121212]/40" />
                  <input
                    type="text"
                    placeholder="Search posts, authors, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#121212]/15 rounded-none text-xs focus:outline-hidden focus:border-[#121212] transition placeholder:italic placeholder:text-[#121212]/35"
                  />
                </div>

                {/* Vertical Separator for wide screen */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-[#121212]/40 uppercase tracking-widest mr-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </div>

                  {/* Tag Filters */}
                  {allTags.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-4 py-1.5 rounded-none text-[10px] uppercase tracking-wider font-bold transition cursor-pointer ${
                          selectedTag === null
                            ? 'bg-[#121212] text-white'
                            : 'bg-[#121212]/5 hover:bg-[#121212] hover:text-white text-[#121212]/60 border border-[#121212]/5'
                        }`}
                      >
                        All
                      </button>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={(e) => handleTagClick(tag, e)}
                          className={`px-4 py-1.5 rounded-none text-[10px] uppercase tracking-wider font-bold transition shrink-0 cursor-pointer ${
                            selectedTag === tag
                              ? 'bg-[#121212] text-white'
                              : 'bg-[#121212]/5 hover:bg-[#121212] hover:text-white text-[#121212]/60 border border-[#121212]/5'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[#121212]/40 font-serif italic">No tags archived yet</span>
                  )}
                </div>
              </div>

              {/* Feed Grid */}
              {isAppLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#121212]/40" />
                  <p className="font-serif italic text-sm text-[#121212]/50">Curating columns and discussion archives...</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PostCard
                        post={post}
                        onClick={() => handlePostClick(post)}
                        onTagClick={handleTagClick}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#F5F4F0] border border-[#121212]/10 rounded-none p-8 max-w-lg mx-auto">
                  <AlertCircle className="w-10 h-10 text-[#121212]/30 mx-auto mb-4" />
                  <h3 className="font-serif text-lg text-[#121212] mb-2">
                    No articles archived matching your criteria
                  </h3>
                  <p className="text-sm text-[#121212]/60 mb-6 font-serif italic leading-relaxed">
                    Try altering your query, selecting a different active column, or write a new perspective to populate the chronicle feed.
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    {(searchQuery || selectedTag) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                        className="px-5 py-2 border border-[#121212]/20 hover:border-[#121212] text-[#121212]/70 text-[10px] uppercase tracking-widest font-bold rounded-none transition"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigate('create')}
                      className="px-5 py-2 bg-[#121212] hover:bg-[#121212]/80 text-white text-[10px] uppercase tracking-widest font-bold rounded-none transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Write Entry</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'detail' && selectedPost && (
            <PostDetail
              key="detail"
              post={selectedPost}
              currentUser={currentUser}
              onBack={() => setView('home')}
              onEdit={() => setView('edit')}
              onDelete={handleDeletePost}
              onOpenAuth={() => setIsAuthOpen(true)}
              showToast={showToast}
            />
          )}

          {view === 'create' && (
            <PostForm
              key="create"
              onSave={handleSavePost}
              onCancel={() => setView('home')}
              showToast={showToast}
            />
          )}

          {view === 'edit' && selectedPost && (
            <PostForm
              key="edit"
              post={selectedPost}
              onSave={handleSavePost}
              onCancel={() => setView('detail')}
              showToast={showToast}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Platform minimal footer */}
      <footer className="bg-[#121212] text-white mt-24 shrink-0 border-t border-[#121212]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold">
          <p>© 2026 Monograph Publishing House. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="hover:text-white transition cursor-pointer">Explore</button>
            <span>•</span>
            <span className="font-mono">Chronicle Edition 04.12</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
