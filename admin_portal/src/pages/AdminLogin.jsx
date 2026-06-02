import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../security/AuthContext';
import { adminService } from '../services/api';

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login, logout, isAuthenticated } = useAuth();

  const from = useMemo(() => loc.state?.from || '/dashboard', [loc.state]);

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) nav('/dashboard', { replace: true });
  }, [isAuthenticated, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Enter username and password.');
      return;
    }
    setLoading(true);
    try {
      login(username, password);
      // Validate credentials quickly
      await adminService.getAnalytics();
      toast.success('Welcome back.');
      nav(from, { replace: true });
    } catch (err) {
      logout();
      toast.error(err.userMessage || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <Shield className="w-7 h-7 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Portal</h1>
        <p className="text-slate-400 mt-2">Authorized staff only. Use your admin credentials.</p>
      </motion.div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-lg">Sign in</span>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Security note: credentials are stored only in this browser session (sessionStorage) to attach a Basic Auth header to admin API calls.
          </p>
        </form>
      </div>
    </div>
  );
}

