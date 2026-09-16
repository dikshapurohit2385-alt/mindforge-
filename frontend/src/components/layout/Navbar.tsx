import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-emerald-200/60 px-6 py-3.5 transition-all marble-texture">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate(user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-300">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 bg-clip-text text-transparent">
                OnePath
              </span>
              <span className="text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider bg-emerald-100/90 text-emerald-800 rounded-full border border-emerald-200/80 shadow-2xs">
                AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 font-medium hidden sm:block">One curriculum. Different paths.</p>
          </div>
        </div>

        {/* Right User Actions */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-white/90 border border-emerald-200/80 rounded-full px-3.5 py-1.5 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <span className="font-bold text-xs text-emerald-950 block">{user.name}</span>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
