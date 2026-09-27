import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, BookOpen, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full azure-card border-b border-sky-200/80 dark:border-sky-900/60 px-4 py-3 transition-all">
      <div className="flex items-center justify-between w-full">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate(user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                OnePath <span className="text-sky-600 dark:text-sky-400">AI</span>
              </span>
              <span className="text-xs px-2 py-0.5 font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 rounded-md border border-sky-200 dark:border-sky-800 shadow-2xs">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:block">
              One curriculum. Adaptive paths.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-slate-800 transition-colors border border-sky-200/60 dark:border-sky-800/60 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Pale Azure (Light)' : 'Switch to Rich Blue (Dark)'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" />
            )}
          </button>

          {user && (
            <div className="relative" ref={menuRef}>
              {/* User Trigger Button with Name & Role Badge */}
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-slate-700 dark:text-sky-300 transition-all border cursor-pointer flex items-center gap-2.5 ${
                  menuOpen 
                    ? 'bg-sky-100 dark:bg-slate-800 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20 shadow-xs' 
                    : 'hover:bg-sky-100 dark:hover:bg-slate-800 border-sky-200/60 dark:border-sky-800/60'
                }`}
                title="User profile & options"
                aria-label="User profile & options"
                aria-expanded={menuOpen}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${user.role === 'TEACHER' ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}`}>
                    {user.role === 'TEACHER' ? 'Teacher' : 'Student'}
                  </span>
                </div>
              </button>

              {/* Sub-menu Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/90 dark:border-sky-800/80 shadow-xl p-3 z-50 transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-sky-900/40 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-sky-100/80 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Account Role</span>
                        <span className={`text-xs px-2 py-0.5 font-bold uppercase rounded-md border ${
                          user.role === 'TEACHER' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                            : 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch Account</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
