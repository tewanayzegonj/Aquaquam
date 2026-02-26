import React, { useState, useRef, useEffect } from 'react';
import { Category, DayData, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  selectedMonth: Category;
  selectedDay: DayData | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onLogout?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  onToggleSidebar, 
  searchQuery,
  onSearchChange,
  onLogout
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="h-20 bg-white dark:bg-donezo-card-dark border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20 relative">
      <div className="flex items-center gap-3 md:gap-6 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-donezo-green transition-all active:scale-95 flex-shrink-0"
          title="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        {/* Install App Button (Mobile/PWA) */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-donezo-green text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-donezo-green/30 hover:bg-emerald-600 transition-all active:scale-95 animate-fade-in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* Desktop Search */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search library..." 
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-64 lg:w-80 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-donezo-green transition-all dark:text-white"
          />
          <svg className="w-5 h-5 absolute left-4 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Mobile Search Toggle */}
        <button 
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="md:hidden p-2.5 text-slate-400 hover:text-donezo-green transition-colors"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      {/* Mobile Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-0 top-20 bg-white dark:bg-donezo-card-dark border-b border-slate-100 dark:border-slate-800 p-4 z-30 animate-fade-in md:hidden">
           <div className="relative">
              <input 
                autoFocus
                type="text" 
                placeholder="Search..." 
                value={searchQuery || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-donezo-green transition-all dark:text-white"
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-6">
        <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold dark:text-white leading-tight">{currentUser?.name || 'Guest'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Library Member</p>
          </div>
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-donezo-green to-teal-400 p-0.5 shadow-md transition-transform active:scale-90 relative"
          >
             <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-[14px] flex items-center justify-center text-donezo-green font-bold">
               {currentUser ? getInitials(currentUser.name) : '??'}
             </div>
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 py-3 z-50 animate-fade-in-up">
              <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 mb-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
              </div>
              
              <div className="px-2">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;