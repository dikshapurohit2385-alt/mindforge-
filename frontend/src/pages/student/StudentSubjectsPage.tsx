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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Explore Subjects</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">
            Browse teacher-approved academic courses and chapters
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-950 placeholder-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/70">
          Loading academic subjects...
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">No subjects found</h3>
          <p className="text-xs text-emerald-700/80 max-w-sm mx-auto">
            {searchQuery ? "No subjects matched your search term." : "Your teachers have not added any subjects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => (
            <motion.div
              key={subject.id}
              whileHover={{ y: -4 }}
              className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white flex flex-col justify-between h-56 transition-all hover:border-emerald-400 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-700" />
                    {subject.teacher_name || 'Teacher'}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    {subject.chapter_count || subject.chapters?.length || 0} Ch.
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-emerald-950 leading-snug">{subject.name}</h2>
                <p className="text-xs text-emerald-800/80 mt-2 line-clamp-2 leading-relaxed">
                  {subject.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-100 mt-auto">
                <button
                  onClick={() => navigate(`/student/subjects/${subject.id}`)}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
