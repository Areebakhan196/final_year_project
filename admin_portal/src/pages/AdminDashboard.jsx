import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Filter,
  Download,
  BarChart3,
  ZoomIn,
  Eye,
  X,
  Send,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminService } from '../services/api';

/** API must return https:// Cloudinary URLs; never rewrite those to /media/ paths. */
function evidenceAbsoluteUrl(stored) {
  if (stored == null || stored === '') return '';
  const s = String(stored).trim();
  if (s.startsWith('https://') || s.startsWith('http://')) return s;
  if (s.startsWith('/media/')) return s;
  return '';
}

function isEvidenceImage(evidence) {
  if (evidence?.file_type === 'image') return true;
  if (evidence?.file_type === 'document') return false;
  const url = evidenceAbsoluteUrl(evidence?.file);
  const urlWithoutParams = url.split('?')[0].split('#')[0];
  if (/\/raw\/upload\//i.test(url)) return false;
  if (/\.(pdf|doc|docx|txt|zip|xls|xlsx|ppt|pptx)$/i.test(urlWithoutParams)) return false;
  if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(urlWithoutParams)) return true;
  if (/\/image\/upload\//i.test(url)) return true;
  return false;
}

function evidenceFileName(filePath) {
  const s = String(filePath || '');
  const segment = s.split('/').pop() || 'document';
  return segment.split('?')[0] || 'document';
}

/** Local /media/ paths only (e.g. audio in dev); Cloudinary URLs pass through unchanged. */
function mediaFileUrl(stored) {
  const absolute = evidenceAbsoluteUrl(stored);
  if (absolute) return absolute;
  const s = String(stored || '').trim();
  if (s.startsWith('/media/')) return s;
  return `/media/${s.replace(/^\/+/, '')}`;
}

const STATUS_ACTIONS = [
  { value: 'PENDING',      label: 'Pending',      color: 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' },
  { value: 'UNDER_REVIEW', label: 'Under Review',  color: 'border-blue-500/50   text-blue-400   hover:bg-blue-500/10' },
  { value: 'RESOLVED',     label: 'Resolved',      color: 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' },
  { value: 'REJECTED',     label: 'Rejected',      color: 'border-red-500/50    text-red-400    hover:bg-red-500/10' },
];

// Statuses that REQUIRE a remarks input
const REMARKS_REQUIRED = new Set(['RESOLVED', 'REJECTED']);

function formatStatusLabel(status) {
  const row = STATUS_ACTIONS.find((a) => a.value === status);
  return row ? row.label : status;
}

/* ─── Remarks Modal ──────────────────────────────────────────────── */
function RemarksModal({ targetStatus, onConfirm, onCancel }) {
  const [remarks, setRemarks] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, []);

  const isRequired = REMARKS_REQUIRED.has(targetStatus);
  const canSubmit  = !isRequired || remarks.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0,  scale: 0.93, y: 24  }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative z-10 w-full max-w-lg bg-[#0d1f35] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold leading-tight">Add Remarks</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Marking as{' '}
                <span className={`font-bold ${targetStatus === 'REJECTED' ? 'text-red-400' : targetStatus === 'RESOLVED' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {formatStatusLabel(targetStatus)}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Reason / Remarks for this decision
              {isRequired && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              ref={textareaRef}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                targetStatus === 'REJECTED'
                  ? 'Explain why this complaint is being rejected…'
                  : targetStatus === 'RESOLVED'
                  ? 'Describe the resolution and action taken…'
                  : 'Optional notes for this status change…'
              }
              rows={5}
              className="w-full bg-navy-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
            />
            {isRequired && remarks.trim().length === 0 && (
              <p className="text-xs text-red-400/80 mt-1.5">
                A remark is required when {formatStatusLabel(targetStatus).toLowerCase()}ing a complaint.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-500 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!canSubmit}
              onClick={() => onConfirm(remarks.trim())}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Confirm Update
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Image lightbox (in-portal enlarge, no new tab) ─────────────── */
function ImageLightboxModal({ imageUrl, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md border-0 cursor-default"
        aria-label="Close preview"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence image preview"
      >
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-navy-900/90 overflow-hidden shadow-2xl flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt="Evidence full size"
            className="max-w-full max-h-[calc(90vh-5rem)] w-auto h-auto object-contain rounded-lg"
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Admin Dashboard ─────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [complaints, setComplaints]       = useState([]);
  const [analytics, setAnalytics]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Remarks modal state
  const [modal, setModal] = useState(null); // { targetStatus }
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [complaintsRes, analyticsRes] = await Promise.all([
        adminService.getComplaints(),
        adminService.getAnalytics(),
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

  /** Called when admin clicks a status button — opens modal first */
  const requestStatusChange = (newStatus) => {
    setModal({ targetStatus: newStatus });
  };

  /** Called from modal when admin confirms (with optional remarks) */
  const confirmStatusUpdate = async (remarksText) => {
    setModal(null);
    const { targetStatus } = modal;
    try {
      await adminService.updateStatus(detail.id, targetStatus, remarksText);
      toast.success(`Status updated to ${formatStatusLabel(targetStatus)}`);
      const updated = { ...detail, status: targetStatus, admin_remarks: remarksText || null };
      setDetail(updated);
      setComplaints(complaints.map(c =>
        c.id === detail.id ? { ...c, status: targetStatus } : c
      ));
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
    <>
      {/* ── Remarks Modal (portal-style, rendered at root) ── */}
      <AnimatePresence>
        {modal && (
          <RemarksModal
            targetStatus={modal.targetStatus}
            onConfirm={confirmStatusUpdate}
            onCancel={() => setModal(null)}
          />
        )}
        {lightboxImage && (
          <ImageLightboxModal
            imageUrl={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Reports"  value={analytics?.total_complaints || 0}              icon={MessageSquare} color="text-blue-500"    bg="bg-blue-500/10" />
          <StatCard title="Pending"        value={analytics?.status_breakdown?.PENDING ?? 0}     icon={Clock}         color="text-yellow-500"  bg="bg-yellow-500/10" />
          <StatCard title="Resolved"       value={analytics?.status_breakdown?.RESOLVED ?? 0}    icon={CheckCircle}   color="text-emerald-500" bg="bg-emerald-500/10" />
          <StatCard title="Avg. Response"  value="2 Days"                                        icon={BarChart3}     color="text-purple-500"  bg="bg-purple-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Complaints Table ── */}
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-xl font-bold text-white">Recent Complaints</h2>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400"><Filter className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400"><Download className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Tracking ID</th>
                    <th className="px-6 py-4 font-semibold">Student ID</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedId === c.id ? 'bg-emerald-500/5' : ''}`}
                      onClick={() => handleViewDetail(c.id)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-200">
                        <span className="font-mono">#{c.tracking_id}</span>
                        <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                          Report #{c.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                        {c.student_id || '—'}
                      </td>
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

          {/* ── Detail Panel ── */}
          <div className="glass-card flex flex-col">
            <div className="p-6 border-b border-slate-700 bg-slate-800/20">
              <h2 className="text-xl font-bold text-white">Review Details</h2>
            </div>

            <div className="flex-1 p-6 overflow-y-auto max-h-[680px]">
              {!selectedId ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 font-medium">No Complaint Selected</h3>
                    <p className="text-slate-600 text-sm px-8">Select a record to view decrypted content and manage status.</p>
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
                  {detail.student_id && (
                    <div className="p-3 rounded-lg border border-slate-700 bg-navy-900/40">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Student ID</label>
                      <p className="text-emerald-400 font-mono text-sm">{detail.student_id}</p>
                    </div>
                  )}

                  {/* Decrypted Message */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Decrypted Message</label>
                    <div className="bg-navy-900/50 p-4 rounded-lg border border-slate-700 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {detail.decrypted_text || 'No text content provided.'}
                    </div>
                  </div>

                  {/* Audio Evidence */}
                  {detail.audio_file && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Audio Evidence</label>
                      <audio
                        key={`${detail.tracking_id}-audio`}
                        controls preload="metadata"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/50"
                        src={mediaFileUrl(detail.audio_file)}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}

                  {/* Evidence Images */}
                  {detail.evidences?.some((ev) => isEvidenceImage(ev)) && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                        Evidence Images
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {detail.evidences
                          .filter((ev) => isEvidenceImage(ev))
                          .map((evidence, idx) => {
                            const imageUrl = evidenceAbsoluteUrl(evidence.file);
                            return (
                              <button
                                key={evidence.id || `img-${idx}`}
                                type="button"
                                onClick={() => imageUrl && setLightboxImage(imageUrl)}
                                className="relative group rounded-lg overflow-hidden border border-slate-700 h-40 bg-navy-900 w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt="Evidence thumbnail"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                                    Image unavailable
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <span className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                                    <ZoomIn className="w-5 h-5" />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Supporting Documents */}
                  {detail.evidences?.some((ev) => !isEvidenceImage(ev)) && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                        Supporting Documents
                      </label>
                      <div className="space-y-2">
                        {detail.evidences
                          .filter((ev) => !isEvidenceImage(ev))
                          .map((evidence, idx) => {
                            const fileUrl = evidenceAbsoluteUrl(evidence.file);
                            const name = evidenceFileName(evidence.file);
                            if (!fileUrl) {
                              return (
                                <div
                                  key={evidence.id || `doc-${idx}`}
                                  className="p-3 rounded-lg border border-slate-700 bg-navy-900/50 text-slate-500 text-sm"
                                >
                                  Document unavailable
                                </div>
                              );
                            }
                            return (
                              <a
                                key={evidence.id || `doc-${idx}`}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-700 bg-navy-900/50 hover:bg-slate-800 hover:border-emerald-500/30 transition-colors group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                                  <span className="text-sm text-slate-300 truncate font-medium">{name}</span>
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0">
                                  <Download className="w-4 h-4" />
                                  Download
                                </span>
                              </a>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── Previous Admin Remarks (read-only display) ── */}
                  {detail.admin_remarks && (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                      <label className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest block mb-2">
                        Previous Remarks
                      </label>
                      <p className="text-slate-300 text-sm leading-relaxed">{detail.admin_remarks}</p>
                    </div>
                  )}

                  {/* ── Status Update Buttons ── */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                      Update Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_ACTIONS.map(({ value, label, color }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => requestStatusChange(value)}
                          className={`py-2 text-xs font-bold uppercase rounded-md border transition-all ${
                            detail.status === value
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : `bg-transparent ${color}`
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-600 text-center">
                      Clicking any status will prompt for admin remarks.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Sub-components ──────────────────────────────────────────────── */
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
    case 'PENDING':      return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
    case 'UNDER_REVIEW': return 'text-blue-500   border-blue-500/20   bg-blue-500/5';
    case 'RESOLVED':     return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    case 'REJECTED':     return 'text-red-500    border-red-500/20    bg-red-500/5';
    default:             return 'text-slate-500  border-slate-500/20  bg-slate-500/5';
  }
};

export default AdminDashboard;
