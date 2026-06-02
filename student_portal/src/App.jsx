import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import TrackingPage from './pages/TrackingPage';
import { ComplaintProvider } from './context/ComplaintContext';

function App() {
  return (
    <Router>
      <ComplaintProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/track" element={<TrackingPage />} />
          </Routes>
        </Layout>
      </ComplaintProvider>
    </Router>
  );
}

export default App;
