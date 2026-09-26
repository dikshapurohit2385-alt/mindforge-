import React, { useEffect, useState } from 'react';
import { classService, attendanceService } from '../../api/services';
import type { SchoolClass, Subject, StudentAttendanceRosterItem } from '../../types';
import { 
  Save, 
  Loader2, 
  Check, 
  X
} from 'lucide-react';

export const TeacherAttendanceManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [roster, setRoster] = useState<StudentAttendanceRosterItem[]>([]);
  const [markState, setMarkState] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const clData = await classService.getAll();
        setClasses(clData);
        if (clData.length > 0) {
          const c9 = clData.find(c => c.name.includes("9")) || clData[0];
          setSelectedClassId(c9.id);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    const loadSubjects = async () => {
      try {
        const subData = await classService.getSubjects(selectedClassId);
        setSubjects(subData);
        if (subData.length > 0) {
          setSelectedSubjectId(subData[0].id);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    };
    loadSubjects();
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) return;
    const fetchRoster = async () => {
      setLoading(true);
      try {
        const ros = await attendanceService.getTeacherRoster(selectedClassId, selectedSubjectId);
        setRoster(ros);

        const initialMarks: Record<string, 'PRESENT' | 'ABSENT'> = {};
        ros.forEach(r => {
          initialMarks[r.student_id] = 'PRESENT';
        });
        setMarkState(initialMarks);
      } catch (err) {
        console.error("Failed to load attendance roster:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, [selectedClassId, selectedSubjectId]);

  const toggleStudentStatus = (studentId: string) => {
    setMarkState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId) return;
    setSaving(true);
    try {
      const records = Object.entries(markState).map(([student_id, status]) => ({
        student_id,
        status
      }));

      await attendanceService.markAttendance({
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        date: sessionDate,
        records
      });

      setSuccessMsg("Attendance successfully recorded for session!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Failed to save attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance Intelligence Roster
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
            Mark daily subject attendance and monitor students requiring AI catch-up support.
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || roster.length === 0}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Session Attendance</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
          <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-xs font-semibold text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading class roster...
        </div>
      ) : roster.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center text-xs text-slate-500 font-bold">
          No students registered in this class roster yet.
        </div>
      ) : (
        /* Roster Table */
        <div className="azure-card rounded-3xl p-6 border border-sky-200/90 dark:border-sky-900/60 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold border-b border-sky-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Quiz Accuracy</th>
                <th className="py-3 px-4">Learning Status</th>
                <th className="py-3 px-4 text-center">Session Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {roster.map(st => {
                const currentStatus = markState[st.student_id] || 'PRESENT';
                const isPresent = currentStatus === 'PRESENT';

                return (
                  <tr key={st.student_id} className="hover:bg-sky-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {st.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold">
                      <span className={st.attendance_percentage < 75 ? 'text-rose-600 font-black' : 'text-slate-800 dark:text-slate-200'}>
                        {st.attendance_percentage}% ({st.attended_classes}/{st.total_classes})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {st.quiz_accuracy}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md ${
                        st.needs_catchup
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {st.status_label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleStudentStatus(st.student_id)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isPresent
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-rose-500 text-white shadow-xs'
                        }`}
                      >
                        {isPresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{isPresent ? 'Present' : 'Absent'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
