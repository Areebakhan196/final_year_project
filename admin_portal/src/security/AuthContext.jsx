import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sr_admin_basic_auth';

function encodeBasic(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export function AuthProvider({ children }) {
  const [authHeader, setAuthHeader] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');

  useEffect(() => {
    if (authHeader) sessionStorage.setItem(STORAGE_KEY, authHeader);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [authHeader]);

  const value = useMemo(() => ({
    isAuthenticated: Boolean(authHeader),
    authHeader,
    login: (username, password) => setAuthHeader(encodeBasic(username, password)),
    logout: () => setAuthHeader(''),
  }), [authHeader]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

