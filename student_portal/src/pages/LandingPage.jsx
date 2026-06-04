import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  File,
  Mic,
  Image as ImageIcon,
  Send,
  ShieldCheck,
  ChevronDown,
  Square,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/api';
import { useComplaint } from '../context/ComplaintContext';
import { useAudioRecorder, blobToAudioFile } from '../hooks/useAudioRecorder';
import { getAudioDurationSeconds } from '../utils/audioDuration';
import { useAuth } from '../context/AuthContext';

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const LandingPage = () => {
  const { saveTrackingId } = useComplaint();
  const { user } = useAuth();
  const {
    phase: recordPhase,
    seconds: recordSeconds,
    recordedDuration,
    error: recordError,
    blob: recordBlob,
    start: startRecording,
    stop: stopRecording,
    discard: discardRecording,
  } = useAudioRecorder();
  const audioFileInputRef = useRef(null);
  const processedBlobRef = useRef(null);
  const evidenceImageInputRef = useRef(null);
  const evidenceDocInputRef = useRef(null);

  const [mode, setMode] = useState('text');
  const [previewDurationSec, setPreviewDurationSec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'General',
    textContent: '',
    audioFile: null,
    evidenceImages: [],
    evidenceFiles: [],
  });

  const categories = [
    'General',
    'Harassment',
    'Corruption',
    'Safety Violation',
    'Discrimination',
    'Financial Fraud',
    'Other',
  ];

  const audioPreviewUrl = useMemo(() => {
    if (mode !== 'audio' || !formData.audioFile) return null;
    try {
      return URL.createObjectURL(formData.audioFile);
    } catch {
      return null;
    }
  }, [mode, formData.audioFile]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  useEffect(() => {
    if (mode !== 'text') return;
    discardRecording();
    setFormData((prev) => ({ ...prev, audioFile: null }));
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  }, [mode, discardRecording]);

  useEffect(() => {
    if (recordPhase !== 'stopped' || !recordBlob) {
      if (recordPhase === 'idle') processedBlobRef.current = null;
      return;
    }
    if (processedBlobRef.current === recordBlob) return;
    processedBlobRef.current = recordBlob;

    try {
      const file = blobToAudioFile(recordBlob);
      setFormData((prev) => ({ ...prev, audioFile: file }));
      if (recordedDuration > 0) {
        setPreviewDurationSec(recordedDuration);
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
      toast.error('Could not save recording. Please try again.');
      processedBlobRef.current = null;
      discardRecording();
    }
  }, [recordPhase, recordBlob, recordedDuration, discardRecording]);

  useEffect(() => {
    if (!formData.audioFile) {
      setPreviewDurationSec(null);
      return undefined;
    }

    let cancelled = false;

    if (recordPhase === 'stopped' && recordedDuration > 0) {
      setPreviewDurationSec(recordedDuration);
    }

    getAudioDurationSeconds(formData.audioFile)
      .then((sec) => {
        if (!cancelled && sec != null && sec > 0) {
          setPreviewDurationSec(sec);
        }
      })
      .catch(() => {
        /* metadata/decode optional */
      });

    return () => {
      cancelled = true;
    };
  }, [formData.audioFile, recordPhase, recordedDuration]);

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      discardRecording();
      setFormData((prev) => ({ ...prev, audioFile: file }));
    }
  };

  const handleEvidenceImagesChange = (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      /\.(jpe?g|png)$/i.test(f.name) || f.type.startsWith('image/')
    );
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        evidenceImages: [...prev.evidenceImages, ...files],
      }));
    }
    if (evidenceImageInputRef.current) evidenceImageInputRef.current.value = '';
  };

  const handleEvidenceDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...files],
      }));
    }
    if (evidenceDocInputRef.current) evidenceDocInputRef.current.value = '';
  };

  const removeEvidenceImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      evidenceImages: prev.evidenceImages.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const removeEvidenceDocument = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleStartRecording = () => {
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    processedBlobRef.current = null;
    setFormData((prev) => ({ ...prev, audioFile: null }));
    discardRecording();
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleClearAudio = () => {
    processedBlobRef.current = null;
    discardRecording();
    setPreviewDurationSec(null);
    setFormData((prev) => ({ ...prev, audioFile: null }));
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'text' && !formData.textContent) {
      toast.error('Please enter your complaint text.');
      return;
    }
    if (mode === 'audio') {
      if (recordPhase === 'recording') {
        toast.error('Stop recording before submitting.');
        return;
      }
      if (!formData.audioFile) {
        toast.error('Record your complaint or upload an audio file.');
        return;
      }
    }
    if (formData.evidenceImages.length === 0) {
      toast.error('At least one evidence image is mandatory.');
      return;
    }

    setLoading(true);
    const data = new FormData();

    const finalContent = `[${formData.category}] ${formData.textContent}`;

    if (mode === 'text') data.append('text_content', finalContent);
    if (mode === 'audio' && formData.audioFile) {
      data.append('audio_file', formData.audioFile);
      data.append('text_content', `Category: ${formData.category} (voice report)`);
    }
    
    formData.evidenceImages.forEach((file) => {
      data.append('evidence_images', file);
    });
    formData.evidenceFiles.forEach((file) => {
      data.append('evidence_files', file);
    });

    try {
      const response = await complaintService.submit(data);
      const trackingId = response.data.tracking_id;
      saveTrackingId(trackingId);
      if (user) {
        toast.success(`New complaint submitted! Your Tracking ID: ${trackingId}`);
      } else {
        toast.success(`Complaint submitted! Save your Tracking ID: ${trackingId}`);
      }
      handleClearAudio();
      setFormData({
        category: 'General',
        textContent: '',
        audioFile: null,
        evidenceImages: [],
        evidenceFiles: [],
      });
    } catch (error) {
      toast.error(error.userMessage || error.response?.data?.error || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight sm:text-5xl">
          Report Safely. <span className="text-emerald-500">Stay Silent.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-4">
          Your identity is protected by end-to-end encryption. No personal data is ever stored.
        </p>
        
        {user ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
            <span>Logged in as Student ID: <strong className="font-mono">{user.unique_student_id}</strong>. Your report will be linked to this ID.</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/90 rounded-lg text-sm font-medium">
            <span>You are reporting anonymously. <Link to="/login" className="underline hover:text-yellow-400 font-semibold transition-colors">Sign In</Link> or <Link to="/register" className="underline hover:text-yellow-400 font-semibold transition-colors">Register</Link> to track reports under a permanent ID.</span>
          </div>
        )}
      </motion.div>

      <div className="glass-card p-8">
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Complaint Category</label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex space-x-4 mb-8 p-1 bg-navy-900/50 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition-all ${
              mode === 'text' ? 'bg-navy-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Text Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('audio')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md transition-all ${
              mode === 'audio' ? 'bg-navy-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="font-medium">Audio Mode</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'text' ? (
              <motion.div
                key="text-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">Complaint Details</label>
                <textarea
                  rows={6}
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Describe the incident in detail..."
                  className="w-full bg-navy-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </motion.div>
            ) : (
              <motion.div
                key="audio-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">Audio Evidence</label>

                <div className="flex flex-col sm:flex-row gap-3">
                  {recordPhase !== 'recording' ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <Mic className="w-5 h-5" />
                      Record audio
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop recording
                    </button>
                  )}
                  {formData.audioFile && recordPhase !== 'recording' && (
                    <button
                      type="button"
                      onClick={handleClearAudio}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove audio
                    </button>
                  )}
                </div>

                {recordPhase === 'recording' && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <span className="text-red-200 text-sm font-medium">Recording… {formatDuration(recordSeconds)}</span>
                  </div>
                )}

                {recordError && (
                  <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    {recordError}
                  </p>
                )}

                {formData.audioFile && recordPhase !== 'recording' && audioPreviewUrl && (
                  <div className="rounded-lg border border-slate-700 bg-navy-900/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Preview</p>
                      {previewDurationSec != null && previewDurationSec > 0 && (
                        <p className="text-sm font-medium text-emerald-400 tabular-nums">
                          Duration: {formatDuration(previewDurationSec)}
                        </p>
                      )}
                    </div>
                    <audio controls preload="metadata" className="w-full" src={audioPreviewUrl}>
                      Preview not supported.
                    </audio>
                  </div>
                )}

                <div>
                  <p className="text-slate-500 text-xs mb-2">Or upload a file (MP3, WAV, WebM — up to ~10MB)</p>
                  <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer group relative">
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*,.webm,.m4a"
                      onChange={handleAudioFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Mic className="w-10 h-10 text-slate-500 group-hover:text-emerald-500 mx-auto mb-3 transition-colors" />
                    <p className="text-slate-400 font-medium text-sm">
                      {formData.audioFile ? formData.audioFile.name : 'Click or drag to upload audio'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section A: Evidence Images (mandatory) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Evidence Images <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">JPG, JPEG, or PNG — at least one image is required.</p>
            <div className="space-y-3">
              {formData.evidenceImages.map((file, idx) => (
                <div key={`img-${idx}-${file.name}`} className="flex items-center justify-between p-3 bg-navy-900 border border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-300 truncate font-medium">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvidenceImage(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors shrink-0"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="relative">
                <input
                  ref={evidenceImageInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleEvidenceImagesChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors font-semibold text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Image</span>
                </div>
              </div>
            </div>
            {formData.evidenceImages.length === 0 && (
              <p className="text-xs text-red-400/80 mt-2">At least one evidence image is mandatory.</p>
            )}
          </div>

          {/* Section B: Supporting Documents (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Supporting Documents <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">PDF, DOC, DOCX — you may skip this section.</p>
            <div className="space-y-3">
              {formData.evidenceFiles.map((file, idx) => (
                <div key={`doc-${idx}-${file.name}`} className="flex items-center justify-between p-3 bg-navy-900 border border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    <File className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-300 truncate font-medium">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvidenceDocument(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors shrink-0"
                    aria-label="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="relative">
                <input
                  ref={evidenceDocInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,application/pdf,application/msword"
                  onChange={handleEvidenceDocumentsChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-full btn-secondary flex items-center justify-center gap-2 py-3 border-dashed border-slate-600 hover:border-emerald-500/50 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add File</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading || (mode === 'audio' && recordPhase === 'recording')}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="text-lg">{user ? 'Submit Report' : 'Submit Anonymously'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 flex items-start space-x-3 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            By submitting, you agree that this information is accurate to the best of your knowledge. Your IP address is not logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
