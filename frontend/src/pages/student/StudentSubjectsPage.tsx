import React, { useEffect, useState } from 'react';
import { subjectService } from '../../api/services';
import type { Subject } from '../../types';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Layers, User, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await subjectService.getAll();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Explore Subjects</h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Browse teacher-approved academic courses and chapters
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading academic subjects...
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-sky-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No subjects found</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery ? "No subjects matched your search term." : "Your teachers have not added any subjects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => (
            <motion.div
              key={subject.id}
              whileHover={{ y: -3 }}
              className="azure-card azure-card-hover rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 flex flex-col justify-between h-60 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {subject.teacher_name || 'Teacher'}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {subject.chapter_count || subject.chapters?.length || 0} Ch.
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{subject.name}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {subject.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-sky-100 dark:border-slate-800 mt-auto">
                <button
                  onClick={() => navigate(`/student/subjects/${subject.id}`)}
                  className="w-full py-2.5 px-4 btn-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Explore Chapters & Modules</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
