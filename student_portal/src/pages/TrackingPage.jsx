import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Hash, Clock, CheckCircle, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { complaintService } from '../services/api';
import { useComplaint } from '../context/ComplaintContext';

const TrackingPage = () => {
  const { lastTrackingId } = useComplaint();
  const [trackingId, setTrackingId] = useState(lastTrackingId || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!trackingId) return;

    setLoading(true);
    try {
      const response = await complaintService.getStatus(trackingId);
      setComplaint(response.data);
    } catch (error) {
      setComplaint(null);
      toast.error('Complaint not found. Please check your tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastTrackingId) {
      handleSearch();
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'UNDER_REVIEW': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'RESOLVED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'REJECTED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Track Your Report</h1>
        <p className="text-slate-400">Enter your unique tracking ID to check the status of your complaint.</p>
      </motion.div>

      <form onSubmit={handleSearch} className="mb-12">
        <div className="relative group">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="SR-XXXX-XXXX"
            className="w-full bg-navy-800 border border-slate-700 rounded-xl pl-12 pr-32 py-4 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2 !px-4 flex items-center space-x-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {complaint && (
          <motion.div
            key="status-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">Complaint #{complaint.tracking_id}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                {complaint.status === 'UNDER_REVIEW' ? 'Under Review' : complaint.status === 'PENDING' ? 'Pending' : complaint.status === 'RESOLVED' ? 'Resolved' : complaint.status === 'REJECTED' ? 'Rejected' : complaint.status}
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Submitted On</h4>
                  <p className="text-slate-400 text-sm">
                    {new Date(complaint.created_at).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-700" />
                <div className="space-y-12">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 z-10">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="pt-2">
                      <h4 className="font-semibold text-white">Report Received</h4>
                      <p className="text-slate-400 text-sm">Your complaint has been safely stored and encrypted.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase()) ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}>
                      <Search className={`w-5 h-5 ${['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase()) ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-semibold ${['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase()) ? 'text-white' : 'text-slate-600'}`}>Under Review</h4>
                      <p className="text-slate-500 text-sm">Authorized staff are analyzing the evidence provided.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      complaint.status?.toUpperCase() === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}>
                      <ShieldCheck className={`w-5 h-5 ${complaint.status?.toUpperCase() === 'RESOLVED' ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-semibold ${complaint.status?.toUpperCase() === 'RESOLVED' ? 'text-white' : 'text-slate-600'}`}>Resolution</h4>
                      <p className="text-slate-500 text-sm">The investigation has been completed and action taken.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!complaint && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-navy-800/30 border border-slate-700/50 rounded-xl p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400">No results to show</h3>
          <p className="text-slate-600 text-sm">Enter a valid tracking ID above to see the current status of your report.</p>
        </motion.div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default TrackingPage;
