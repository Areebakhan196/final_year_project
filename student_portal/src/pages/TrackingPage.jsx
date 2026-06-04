import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Hash, Clock, CheckCircle, AlertCircle, FileText, MessageCircle, List } from 'lucide-react';
import { toast } from 'react-toastify';
import { complaintService } from '../services/api';
import { useComplaint } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';

const TrackingPage = () => {
  const { lastTrackingId } = useComplaint();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState(user?.unique_student_id || lastTrackingId || '');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':      return 'text-yellow-500  bg-yellow-500/10  border-yellow-500/20';
      case 'UNDER_REVIEW': return 'text-blue-500    bg-blue-500/10    border-blue-500/20';
      case 'RESOLVED':     return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'REJECTED':     return 'text-red-500     bg-red-500/10     border-red-500/20';
      default:             return 'text-slate-500   bg-slate-500/10   border-slate-500/20';
    }
  };

  const formatStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'UNDER_REVIEW': return 'Under Review';
      case 'PENDING': return 'Pending';
      case 'RESOLVED': return 'Resolved';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const loadComplaintById = useCallback(async (complaintId) => {
    if (!complaintId || !user) return;
    setLoading(true);
    try {
      const response = await complaintService.getById(complaintId);
      setComplaint(response.data);
      setTrackingId(response.data.tracking_id);
    } catch {
      setComplaint(null);
      toast.error('Complaint not found.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadComplaintByTrackingId = useCallback(async (tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const response = await complaintService.getStatus(tid);
      setComplaint(response.data);
      if (response.data.id) setSelectedComplaintId(response.data.id);
    } catch {
      setComplaint(null);
      toast.error('Complaint not found. Please check your tracking ID.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyComplaints = useCallback(async () => {
    if (!user) {
      setMyComplaints([]);
      return;
    }
    setListLoading(true);
    try {
      const response = await complaintService.listMine();
      setMyComplaints(response.data || []);
      const preferred = response.data?.[0];
      if (preferred) {
        setTrackingId(preferred.tracking_id);
        setSelectedComplaintId(preferred.id);
        await loadComplaintById(preferred.id);
      }
    } catch {
      setMyComplaints([]);
    } finally {
      setListLoading(false);
    }
  }, [user, loadComplaintById]);

  useEffect(() => {
    if (user) {
      loadMyComplaints();
    } else if (lastTrackingId) {
      setTrackingId(lastTrackingId);
      loadComplaintByTrackingId(lastTrackingId);
    } else {
      setComplaint(null);
      setMyComplaints([]);
    }
  }, [user, lastTrackingId, loadMyComplaints, loadComplaintByTrackingId]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await loadComplaintByTrackingId(trackingId);
  };

  const selectComplaint = (item) => {
    setSelectedComplaintId(item.id);
    setTrackingId(item.tracking_id);
    loadComplaintById(item.id);
  };

  const showRemarks =
    complaint?.admin_remarks &&
    ['RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase());

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Track Your Report</h1>
        <p className="text-slate-400">
          {user
            ? 'Your Tracking ID is your Student ID (same for every report). Each submission is a separate complaint below.'
            : 'Enter the Tracking ID from your submission confirmation.'}
        </p>
        {user && (
          <p className="text-emerald-400/90 text-sm mt-2 font-mono">
            Student ID: {user.unique_student_id}
          </p>
        )}
      </motion.div>

      {user && (
        <div className="glass-card p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <List className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Your Complaints</h2>
          </div>
          {listLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : myComplaints.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No complaints yet. Submit your first report.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myComplaints.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectComplaint(c)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedComplaintId === c.id
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-700 bg-navy-900/50 hover:border-slate-600'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-mono text-sm text-slate-200 block">#{c.tracking_id}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase shrink-0 ${getStatusColor(c.status)}`}>
                    {formatStatusLabel(c.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-12">
        <div className="relative group">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder={user ? user.unique_student_id : 'e.g. AB12-345678'}
            className="w-full bg-navy-800 border border-slate-700 rounded-xl pl-12 pr-32 py-4 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2 !px-4 flex items-center space-x-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {complaint && (
          <motion.div
            key={complaint.id || complaint.tracking_id}
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
                {formatStatusLabel(complaint.status)}
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
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
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
                      ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase())
                        ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}>
                      <Search className={`w-5 h-5 ${
                        ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase())
                          ? 'text-white' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-semibold ${
                        ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase())
                          ? 'text-white' : 'text-slate-600'
                      }`}>Under Review</h4>
                      <p className="text-slate-500 text-sm">Authorized staff are analyzing the evidence provided.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      complaint.status?.toUpperCase() === 'RESOLVED'
                        ? 'bg-emerald-500'
                        : complaint.status?.toUpperCase() === 'REJECTED'
                        ? 'bg-red-500/80'
                        : 'bg-slate-800'
                    }`}>
                      <ShieldCheck className={`w-5 h-5 ${
                        ['RESOLVED', 'REJECTED'].includes(complaint.status?.toUpperCase())
                          ? 'text-white' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-semibold ${
                        complaint.status?.toUpperCase() === 'RESOLVED' ? 'text-emerald-400'
                          : complaint.status?.toUpperCase() === 'REJECTED' ? 'text-red-400'
                          : 'text-slate-600'
                      }`}>
                        {complaint.status?.toUpperCase() === 'REJECTED' ? 'Rejected' : 'Resolution'}
                      </h4>
                      <p className="text-slate-500 text-sm">The investigation has been completed and action taken.</p>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showRemarks && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`rounded-2xl border p-5 flex items-start gap-4 ${
                      complaint.status?.toUpperCase() === 'REJECTED'
                        ? 'bg-red-500/5 border-red-500/25'
                        : 'bg-emerald-500/5 border-emerald-500/25'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      complaint.status?.toUpperCase() === 'REJECTED'
                        ? 'bg-red-500/15 border border-red-500/30'
                        : 'bg-emerald-500/15 border border-emerald-500/30'
                    }`}>
                      <MessageCircle className={`w-4 h-4 ${
                        complaint.status?.toUpperCase() === 'REJECTED' ? 'text-red-400' : 'text-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${
                        complaint.status?.toUpperCase() === 'REJECTED' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        Admin Remarks / Reason
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {complaint.admin_remarks}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          <p className="text-slate-600 text-sm">
            {user ? 'Select a complaint from your list or enter a Tracking ID.' : 'Enter the Tracking ID from your submission.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default TrackingPage;
