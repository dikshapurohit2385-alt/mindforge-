import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { BookOpen, User, GraduationCap, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f2f9f4] flex items-center justify-center p-4 marble-texture">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-900/20 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Create OnePath AI Account</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">Join the adaptive learning platform</p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-3xl p-7 border border-emerald-200/80 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-2">I am joining as a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'STUDENT'
                      ? 'border-emerald-600 bg-emerald-100/80 text-emerald-950 ring-2 ring-emerald-600/20 font-bold'
                      : 'border-emerald-200/70 bg-white/80 text-emerald-800 hover:bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${role === 'STUDENT' ? 'bg-emerald-800 text-white' : 'bg-emerald-100/70 text-emerald-700'}`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Student</span>
                    <span className="text-[10px] text-emerald-700/80 font-medium">Learn & take notes</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'TEACHER'
                      ? 'border-emerald-600 bg-emerald-100/80 text-emerald-950 ring-2 ring-emerald-600/20 font-bold'
                      : 'border-emerald-200/70 bg-white/80 text-emerald-800 hover:bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${role === 'TEACHER' ? 'bg-emerald-800 text-white' : 'bg-emerald-100/70 text-emerald-700'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Teacher</span>
                    <span className="text-[10px] text-emerald-700/80 font-medium">Manage curriculum</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-2.5 bg-white/90 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1.5">Class / Grade (Optional)</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Grade 11 Science"
                  className="w-full px-4 py-2.5 bg-white/90 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-emerald-100 text-center">
            <p className="text-xs text-emerald-700">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
