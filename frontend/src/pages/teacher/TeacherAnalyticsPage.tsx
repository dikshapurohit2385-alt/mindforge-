import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teacherAnalyticsService } from '../../api/services';
import type { 
  TeacherAnalyticsOverview, 
  StudentCohortItem, 
  StudentAnalyticsDetail 
} from '../../types';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Search, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Brain, 
  Flame, 
  X, 
  Loader2, 
  ChevronRight
} from 'lucide-react';

export const TeacherAnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedStudentId = searchParams.get('studentId');

  const [overview, setOverview] = useState<TeacherAnalyticsOverview | null>(null);
  const [students, setStudents] = useState<StudentCohortItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Selected Student Drilldown Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(preselectedStudentId);
  const [studentDetail, setStudentDetail] = useState<StudentAnalyticsDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ovData, cohortData] = await Promise.all([
          teacherAnalyticsService.getOverview(),
          teacherAnalyticsService.getCohort()
        ]);
        setOverview(ovData);
        setStudents(cohortData);
      } catch (err) {
        console.error("Failed to load teacher analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch individual student drilldown when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await teacherAnalyticsService.getStudentDetail(selectedStudentId);
        setStudentDetail(detail);
      } catch (err) {
        console.error("Failed to fetch student analytics detail:", err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedStudentId]);

  const handleOpenStudent = (id: string) => {
    setSelectedStudentId(id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('studentId', id);
    setSearchParams(nextParams);
  };

  const handleCloseStudent = () => {
    setSelectedStudentId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('studentId');
    setSearchParams(nextParams);
  };

  // Filtered students
  const filteredStudents = students.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !classFilter || st.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name).filter(Boolean)));

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Teacher Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Cohort Analytics & Student Intelligence
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time cohort progress tracking, learning velocity, and actionable AI pedagogical interventions.
          </p>
        </div>
      </div>

      {/* Cohort KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
              Total Cohort
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {overview?.total_students ?? students.length}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Enrolled Learners</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
              Class Average
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {Math.round(overview?.average_class_progress ?? 0)}%
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Curriculum Completion</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md">
              Mastery Rate
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {Math.round(overview?.average_quiz_accuracy ?? 0)}%
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Cohort Quiz Accuracy</p>
        </div>
      </div>

      {/* Cohort Table & Filters */}
      <div className="azure-card rounded-2xl border border-sky-200/90 dark:border-sky-900/60 overflow-hidden shadow-xs">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-sky-100 dark:border-sky-900/60 bg-sky-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {uniqueClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((cls, i) => (
                  <option key={i} value={cls as string}>{cls}</option>
                ))}
              </select>
            )}
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredStudents.length} of {students.length} students
          </span>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading student cohort profiles...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No students matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sky-100 dark:border-sky-900/60 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Knowledge Level</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Weak Areas</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 dark:divide-sky-900/40">
                {filteredStudents.map((st) => (
                  <tr 
                    key={st.student_id}
                    className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{st.name}</span>
                        <span className="text-[11px] text-slate-400">{st.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {st.class_name || 'Standard'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300">
                        {st.knowledge_level || 'INTERMEDIATE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, st.overall_progress)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(st.overall_progress)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        st.quiz_accuracy >= 75 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : st.quiz_accuracy >= 50 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {Math.round(st.quiz_accuracy)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {st.weak_concept_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          {st.weak_concept_count} {st.weak_concept_count === 1 ? 'concept' : 'concepts'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Mastered
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudent(st.student_id)}
                        className="px-3 py-1.5 btn-primary rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Drilldown</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Student Drilldown Modal / Drawer */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 mb-0.5">
                  <Brain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Learning Intelligence</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {studentDetail?.student_name || 'Loading Learner...'}
                </h3>
                <span className="text-xs text-slate-400">{studentDetail?.email}</span>
              </div>
              <button
                onClick={handleCloseStudent}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {loadingDetail ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading student diagnostic analytics...</p>
                </div>
              ) : studentDetail ? (
                <div className="space-y-5">
                  {/* AI Recommended Intervention Banner */}
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      AI Recommended Teacher Action
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {studentDetail.recommended_intervention}
                    </p>
                  </div>

                  {/* Quick Profile Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Level</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-0.5">{studentDetail.knowledge_level}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Speed</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-0.5">{studentDetail.learning_speed}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Accuracy</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-0.5">{Math.round(studentDetail.quiz_accuracy)}%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Streak</span>
                      <span className="text-xs font-extrabold text-amber-500 block mt-0.5 flex items-center justify-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        {studentDetail.streak_days}d
                      </span>
                    </div>
                  </div>

                  {/* Concept Mastery: Strengths vs Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strong Concepts */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Strong Concepts ({studentDetail.strong_concepts?.length || 0})
                      </span>
                      {(!studentDetail.strong_concepts || studentDetail.strong_concepts.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No strong concepts recorded yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {studentDetail.strong_concepts.map((c, i) => (
                            <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weak Concepts */}
                    <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Concepts Needing Practice ({studentDetail.weak_concepts?.length || 0})
                      </span>
                      {(!studentDetail.weak_concepts || studentDetail.weak_concepts.length === 0) ? (
                        <p className="text-xs text-emerald-600 font-semibold">All concepts verified!</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {studentDetail.weak_concepts.map((c, i) => (
                            <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frequently Incorrect Concepts */}
                  {studentDetail.frequently_incorrect_concepts && studentDetail.frequently_incorrect_concepts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Recurring Mistakes Matrix:
                      </span>
                      <div className="space-y-1.5">
                        {studentDetail.frequently_incorrect_concepts.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.concept}</span>
                            <span className="text-rose-600 font-bold">{item.mistakes_count} mistakes recorded</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quiz History */}
                  {studentDetail.quiz_history && studentDetail.quiz_history.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Recent Quiz Attempts:
                      </span>
                      <div className="space-y-1.5">
                        {studentDetail.quiz_history.map((qh) => (
                          <div key={qh.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{qh.quiz_title}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-purple-600">{qh.score}/{qh.max_score} ({Math.round(qh.percentage)}%)</span>
                              <span className="text-[10px] text-slate-400">{new Date(qh.completed_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
