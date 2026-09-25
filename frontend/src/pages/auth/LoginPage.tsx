import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
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
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25 mb-3.5">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            OnePath <span className="text-sky-600 dark:text-sky-400">AI</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            One curriculum. Different paths to understanding.
          </p>
        </div>

        {/* Card Form */}
        <div className="azure-card rounded-2xl p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
            Sign in to your adaptive learning account
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3 px-4 btn-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sky-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
