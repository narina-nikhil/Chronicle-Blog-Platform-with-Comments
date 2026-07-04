import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: UserType) => void;
  showToast: (text: string, type: 'success' | 'error') => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (activeTab === 'register') {
      if (!username) {
        showToast('Username is required.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
    }

    setIsLoading(true);

    try {
      const url = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = activeTab === 'login' 
        ? { email, password } 
        : { email, username, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      onSuccess(data.token, data.user);
      showToast(
        activeTab === 'login' 
          ? `Welcome back, ${data.user.username}!` 
          : `Account created! Welcome, ${data.user.username}!`, 
        'success'
      );
      onClose();
      // Clear forms
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Back drop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        className="relative w-full max-w-md bg-[#FDFCFB] border border-[#121212]/15 rounded-none shadow-2xl overflow-hidden z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#121212]/40 hover:text-[#121212]/70 p-1.5 rounded-none transition"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-serif font-light tracking-tight text-[#121212] mb-2">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="font-serif italic text-sm text-[#121212]/50 mb-6">
            {activeTab === 'login' 
              ? 'Enter your credentials to publish and interact.' 
              : 'Sign up to write posts and join the discussions.'}
          </p>

          {/* Tab Switcher */}
          <div className="flex border-b border-[#121212]/10 mb-6">
            <button
              onClick={() => { setActiveTab('login'); }}
              className={`flex-1 pb-3 text-xs uppercase tracking-widest font-bold border-b transition cursor-pointer ${
                activeTab === 'login'
                  ? 'border-[#121212] text-[#121212]'
                  : 'border-transparent text-[#121212]/40 hover:text-[#121212]/70'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); }}
              className={`flex-1 pb-3 text-xs uppercase tracking-widest font-bold border-b transition cursor-pointer ${
                activeTab === 'register'
                  ? 'border-[#121212] text-[#121212]'
                  : 'border-transparent text-[#121212]/40 hover:text-[#121212]/70'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#121212]/40" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alice_dev"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-xs text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#121212]/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-xs text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#121212]/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-xs text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-[#121212]/50 uppercase tracking-[0.2em] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#121212]/40" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FDFCFB] border border-[#121212]/15 rounded-none text-xs text-[#121212] focus:outline-hidden focus:border-[#121212] transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 bg-[#121212] hover:bg-[#121212]/85 text-white font-bold text-[11px] uppercase tracking-widest rounded-none transition flex items-center justify-center gap-2 disabled:bg-[#121212]/30 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper Account Info */}
          <div className="mt-6 pt-4 border-t border-[#121212]/10 text-center text-xs">
            <span className="text-[#121212]/40">
              {activeTab === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>{' '}
            <button
              onClick={() => { setActiveTab(activeTab === 'login' ? 'register' : 'login'); }}
              className="font-bold text-[#121212] hover:underline cursor-pointer"
            >
              {activeTab === 'login' ? 'Register here' : 'Sign in here'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
