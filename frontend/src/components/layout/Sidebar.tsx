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
    { name: 'Content Ingestion', to: '#', icon: Layers, comingSoon: true },
    { name: 'Student Questions', to: '/teacher/questions', icon: MessageSquare },
    { name: 'Analytics', to: '#', icon: BarChart3, comingSoon: true },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 glass-card rounded-3xl p-4 my-6 ml-6 border border-emerald-200/70 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-6rem)] marble-texture">
      <div>
        <div className="px-3 py-2 mb-4">
          <span className="text-[11px] font-extrabold text-emerald-800/80 uppercase tracking-widest block">
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
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-emerald-600/70 text-xs font-medium cursor-not-allowed opacity-75 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-emerald-600/60" />
                    <span>{link.name}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
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
                  `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-md shadow-emerald-950/15'
                      : 'text-emerald-950 hover:bg-emerald-100/60 hover:text-emerald-900'
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

      {/* Phase 1 Status Footer Card */}
      <div className="bg-gradient-to-br from-emerald-100/80 via-teal-50/80 to-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80 text-left shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-[11px] font-extrabold text-emerald-950">Phase 1 Active</span>
        </div>
        <p className="text-[10px] text-emerald-800/80 leading-snug font-medium">
          Real PostgreSQL database & REST API active.
        </p>
      </div>
    </aside>
  );
};
