import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  BarChart3,
  Clock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const studentLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Subjects', to: '/student/subjects', icon: BookOpen },
    { name: 'Digital Notebook', to: '/student/notebook', icon: FileText },
    { name: 'Ask Teacher', to: '/student/ask-teacher', icon: MessageSquare },
    { name: 'Learning Insights', to: '#', icon: Sparkles, comingSoon: true },
  ];

  const teacherLinks = [
    { name: 'Dashboard', to: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Subject Management', to: '/teacher/subjects', icon: BookOpen },
    { name: 'Curriculum Documents', to: '/teacher/documents', icon: Layers },
    { name: 'Student Questions', to: '/teacher/questions', icon: MessageSquare },
    { name: 'Analytics', to: '#', icon: BarChart3, comingSoon: true },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 azure-card rounded-2xl p-4 my-6 ml-6 border border-sky-200/80 dark:border-sky-900/60 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-6.5rem)] transition-all">
      <div>
        <div className="px-3 py-2 mb-3">
          <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-widest block">
            {isTeacher ? 'Teacher Portal' : 'Student Portal'}
          </span>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            if (link.comingSoon) {
              return (
                <div
                  key={link.name}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed opacity-75 hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{link.name}</span>
                  </div>
                  <span className="text-[11px] bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={link.name}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800/80 hover:text-blue-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Portal Active Status Card */}
      <div className="bg-sky-50/90 dark:bg-slate-800/80 rounded-xl p-3.5 border border-sky-200/90 dark:border-sky-900/60 text-left shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">MindForge Engine</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-medium">
          Personalized curriculum & doubt resolution active.
        </p>
      </div>
    </aside>
  );
};
