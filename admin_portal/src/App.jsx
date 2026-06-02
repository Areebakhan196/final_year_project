import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import { AuthProvider } from './security/AuthContext';
import ProtectedRoute from './security/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<AdminLogin />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
