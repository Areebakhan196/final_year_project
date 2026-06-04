import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckCircle, LogIn, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.confirm_password) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      toast.success(
        'Account successfully created! You can now log in.',
        { position: 'top-right', autoClose: 6000 }
      );
      navigate('/login');
    } catch (error) {
      const errorMsg =
        error.userMessage ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        'Registration failed.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">

      {/* ── Top-Bar Header with Login Button ── */}
      <div className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-navy-900/40 backdrop-blur-sm mb-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>The Silent Reporter</span>
          <span className="text-slate-700 mx-1">·</span>
          <span className="text-slate-500">Student Registration</span>
        </div>

        {/* ── Prominent Top-Right Login Button ── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            to="/login"
            id="login-access-btn"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-md shadow-emerald-500/5"
          >
            <LogIn className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Log In
          </Link>
        </motion.div>
      </div>

      {/* ── Registration Card ── */}
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Create{' '}
            <span className="text-emerald-500">Student Account</span>
          </h1>
          <p className="text-slate-400 text-base">
            Register once. All your reports, permanently linked under one secure ID.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="w-full glass-card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Student Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  id="register-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@university.edu"
                  className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  id="register-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min. 8 characters"
                  className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  id="register-confirm-password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) =>
                    setFormData({ ...formData, confirm_password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-semibold">Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Inline Login Fallback */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Log in here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full mt-5 flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Upon registration, a <span className="text-emerald-400 font-semibold">unique Student ID</span> is permanently assigned to your account. Every complaint you file will automatically be linked to this single identifier for seamless tracking.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
