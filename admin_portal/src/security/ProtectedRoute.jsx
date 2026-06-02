import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { adminService } from '../services/api';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    async function check() {
      if (!isAuthenticated) {
        nav('/login', { replace: true, state: { from: loc.pathname } });
        return;
      }
      try {
        await adminService.getAnalytics();
        if (alive) setChecking(false);
      } catch {
        logout();
        toast.error('Admin session invalid. Please log in again.');
        nav('/login', { replace: true, state: { from: loc.pathname } });
      }
    }
    check();
    return () => { alive = false; };
  }, [isAuthenticated, logout, nav, loc.pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}

