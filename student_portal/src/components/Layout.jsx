import React from 'react';
import Navbar from './Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2026 The Silent Reporter. Anonymity Guaranteed.</p>
      </footer>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Layout;
