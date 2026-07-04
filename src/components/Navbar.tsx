import React from 'react';
import { LogIn, LogOut, PenSquare, User } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onNavigate: (view: string, arg?: string) => void;
  currentView: string;
}

export default function Navbar({ currentUser, onLogout, onOpenAuth, onNavigate, currentView }: NavbarProps) {
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDFCFB]/90 backdrop-blur-md border-b border-[#121212]/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand/Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-neutral-900 group focus:outline-hidden cursor-pointer"
        >
          <span className="font-serif italic text-2xl tracking-tight font-bold text-[#121212] transition-opacity group-hover:opacity-80">
            Chronicle.
          </span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('home')}
            className={`text-[11px] uppercase tracking-[0.2em] font-bold transition-all ${
              currentView === 'home'
                ? 'text-[#121212]'
                : 'text-[#121212]/40 hover:text-[#121212]/70'
            }`}
          >
            The Journal
          </button>

          {currentUser ? (
            <>
              {/* Write Post Button */}
              <button
                onClick={() => onNavigate('create')}
                className="flex items-center gap-2 px-4 py-2 border border-[#121212] text-[11px] uppercase tracking-widest font-bold hover:bg-[#121212] hover:text-white rounded-none transition"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>New Entry</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-3 pl-4 border-l border-[#121212]/10">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-bold text-[#121212] leading-none">
                    {currentUser.username}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#121212]/40 mt-1">
                    Author
                  </span>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-white text-[10px] font-bold select-none">
                  {getInitials(currentUser.username)}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-[#121212]/40 hover:text-red-600 rounded-none transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 border border-[#121212] text-[11px] uppercase tracking-widest font-bold hover:bg-[#121212] hover:text-white rounded-none transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
