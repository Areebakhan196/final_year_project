import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../services/api';

const ForgotPassword = () => {
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
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      toast.success("Password successfully updated! You can now log in with your new credentials.");
      navigate('/login');
    } catch (error) {
      const errorMsg = error.userMessage || error.response?.data?.email?.[0] || error.response?.data?.password?.[0] || 'Password recovery failed.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Reset <span className="text-emerald-500">Password</span>
        </h1>
        <p className="text-slate-400">
          Enter your registered email and set a new password.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@university.edu"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
