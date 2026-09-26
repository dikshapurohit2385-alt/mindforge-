import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, BookOpen, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
            <>
              {/* User Profile Info */}
              <div className="hidden sm:flex items-center gap-2.5 bg-white/90 dark:bg-slate-800/90 border border-sky-200/80 dark:border-sky-800/60 rounded-xl px-3 py-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">{user.name}</span>
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
