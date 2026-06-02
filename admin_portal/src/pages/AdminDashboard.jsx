import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Filter,
  Download,
  ExternalLink,
  BarChart3,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminService } from '../services/api';

/** Build a path the Vite proxy can serve (/media/... includes subfolders like complaints/images/). */
function mediaFileUrl(stored) {
  if (stored == null || stored === '') return '';
  const s = String(stored).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      return new URL(s).pathname;
    } catch {
      return '';
    }
  }
  const idx = s.indexOf('/media/');
  if (idx !== -1) return s.slice(idx);
  if (s.startsWith('/media/')) return s;
  return `/media/${s.replace(/^\/+/, '')}`;
}

const STATUS_ACTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Reviewed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function formatStatusLabel(status) {
  const row = STATUS_ACTIONS.find((a) => a.value === status);
  return row ? row.label : status;
}

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [complaintsRes, analyticsRes] = await Promise.all([
        adminService.getComplaints(),
        adminService.getAnalytics()
      ]);
      setComplaints(complaintsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error(error.userMessage || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const response = await adminService.getComplaintDetail(id);
      setDetail(response.data);
    } catch (error) {
      toast.error(error.userMessage || 'Failed to load complaint details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminService.updateStatus(id, newStatus);
      toast.success(`Status updated to ${formatStatusLabel(newStatus)}`);
      setDetail({ ...detail, status: newStatus });
      setComplaints(complaints.map(c => c.tracking_id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      toast.error(error.userMessage || 'Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Reports" 
          value={analytics?.total_complaints || 0} 
          icon={MessageSquare} 
          color="text-blue-500" 
          bg="bg-blue-500/10" 
        />
        <StatCard 
          title="Pending" 
          value={analytics?.status_breakdown?.PENDING ?? 0} 
          icon={Clock} 
          color="text-yellow-500" 
          bg="bg-yellow-500/10" 
        />
        <StatCard 
          title="Resolved" 
          value={analytics?.status_breakdown?.RESOLVED ?? 0} 
          icon={CheckCircle} 
          color="text-emerald-500" 
          bg="bg-emerald-500/10" 
        />
        <StatCard 
          title="Avg. Response" 
          value="2 Days" 
          icon={BarChart3} 
          color="text-purple-500" 
          bg="bg-purple-500/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Complaints Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/20">
            <h2 className="text-xl font-bold text-white">Recent Complaints</h2>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Tracking ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {complaints.map((c) => (
                  <tr 
                    key={c.tracking_id} 
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedId === c.tracking_id ? 'bg-emerald-500/5' : ''}`}
                    onClick={() => handleViewDetail(c.tracking_id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">#{c.tracking_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(c.status)}`}>
                        {formatStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-slate-500 hover:text-emerald-500 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-slate-700 bg-slate-800/20">
            <h2 className="text-xl font-bold text-white">Review Details</h2>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
            {!selectedId ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-slate-400 font-medium">No Complaint Selected</h3>
                  <p className="text-slate-600 text-sm px-8">Select a record from the table to view decrypted content and manage status.</p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Decrypted Message</label>
                  <div className="bg-navy-900/50 p-4 rounded-lg border border-slate-700 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {detail.decrypted_text || "No text content provided."}
                  </div>
                </div>

                {detail.audio_file && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Audio Evidence</label>
                    <audio
                      key={`${detail.tracking_id}-audio`}
                      controls
                      preload="metadata"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/50"
                      src={mediaFileUrl(detail.audio_file)}
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {detail.evidence_image && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Evidence Image</label>
                    <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                      <img 
                        src={mediaFileUrl(detail.evidence_image)} 
                        alt="Evidence" 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={mediaFileUrl(detail.evidence_image)} target="_blank" rel="noreferrer" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Update Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_ACTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleUpdateStatus(detail.tracking_id, value)}
                        className={`py-2 text-xs font-bold uppercase rounded-md border transition-all ${
                          detail.status === value
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="glass-card p-6 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const getStatusBadgeColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
    case 'UNDER_REVIEW': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
    case 'RESOLVED': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    case 'REJECTED': return 'text-red-500 border-red-500/20 bg-red-500/5';
    default: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
  }
};

export default AdminDashboard;
