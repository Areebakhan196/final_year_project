import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import TrackingPage from './pages/TrackingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import { ComplaintProvider } from './context/ComplaintContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* If authenticated, show LandingPage. If not, show Register page */}
      <Route path="/" element={user ? <LandingPage /> : <Register />} />
      <Route path="/track" element={<TrackingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ComplaintProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </ComplaintProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
