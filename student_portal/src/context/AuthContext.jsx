import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('student_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.data);
        } catch (err) {
          console.error("Token invalid, logging out.", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const loginUser = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: userToken, ...userData } = res.data;
    localStorage.setItem('student_token', userToken);
    setToken(userToken);
    setUser(userData);
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout request failed, cleaning local session anyway.", err);
    }
    localStorage.removeItem('student_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login: loginUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
