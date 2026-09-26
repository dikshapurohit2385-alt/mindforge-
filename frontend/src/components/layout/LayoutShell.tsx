import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isStudySpacePage = location.pathname.startsWith('/student/study-space/') || 
                           location.pathname.startsWith('/student/adaptive-lesson/');

  return (
    <div className="h-screen flex flex-col overflow-hidden transition-colors duration-200 bg-stone-100/50 dark:bg-slate-950">
      <Navbar />
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {!isStudySpacePage && <Sidebar />}
        <main 
          className={`flex-1 flex flex-col min-h-0 ${
            isStudySpacePage 
              ? 'p-0 overflow-hidden' 
              : 'p-3 sm:p-6 overflow-y-auto'
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex-1 flex flex-col min-h-0 ${
              isStudySpacePage ? 'overflow-hidden' : ''
            }`}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
