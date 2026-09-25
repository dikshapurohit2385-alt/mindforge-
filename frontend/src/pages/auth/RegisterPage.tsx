import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { BookOpen, User, GraduationCap, ArrowRight, Lock, Mail, AlertCircle, School } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [className, setClassName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const newUser = await register({
        name,
        email,
        password,
        role,
        class_name: role === 'STUDENT' ? className : undefined,
      });
      if (newUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Join OnePath AI — Adaptive learning tailored to you
          </p>
        </div>

        {/* Card Form */}
        <div className="azure-card rounded-2xl p-7 border border-sky-200/90 dark:border-sky-900/60 shadow-xl">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                I am joining as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'STUDENT'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-slate-900 dark:text-white ring-2 ring-sky-500/20 font-bold shadow-xs'
                      : 'border-sky-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:bg-sky-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${role === 'STUDENT' ? 'bg-blue-600 text-white shadow-xs' : 'bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300'}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-slate-900 dark:text-white">Student</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Learn & explore</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'TEACHER'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-slate-900 dark:text-white ring-2 ring-sky-500/20 font-bold shadow-xs'
                      : 'border-sky-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:bg-sky-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${role === 'TEACHER' ? 'bg-blue-600 text-white shadow-xs' : 'bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300'}`}>
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-slate-900 dark:text-white">Teacher</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Teach & guide</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Class Name (Student only) */}
            {role === 'STUDENT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Class / Grade Level
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. Grade 11, Class 10A, Year 2"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 px-4 btn-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sky-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
