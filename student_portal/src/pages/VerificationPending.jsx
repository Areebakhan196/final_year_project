import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailOpen, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

const VerificationPending = () => {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── Animated Mail Icon ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Pulsing glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl"
            />
            <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <MailOpen className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Verify Your{' '}
            <span className="text-emerald-500">Email</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
            Almost there! We've sent a verification link to your inbox. Open it to activate your account.
          </p>
        </motion.div>

        {/* ── Info Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.22 }}
          className="glass-card p-8 space-y-5"
        >
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-emerald-400 text-xs font-bold">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-0.5">Open your Gmail inbox</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Look for an email from <span className="text-emerald-400 font-medium">The Silent Reporter</span> with the subject <span className="text-slate-300 italic">"Verify Your Account"</span>.
              </p>
            </div>
          </div>

          {/* Divider line */}
          <div className="ml-4 border-l border-dashed border-slate-700 h-4" />

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-emerald-400 text-xs font-bold">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-0.5">Click the verification link</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clicking the link will instantly activate your account and redirect you to the login page.
              </p>
            </div>
          </div>

          {/* Divider line */}
          <div className="ml-4 border-l border-dashed border-slate-700 h-4" />

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-0.5">Log in & start reporting</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Once verified, sign in to link all your reports under your permanent Student ID.
              </p>
            </div>
          </div>

          {/* Dev hint for local environment */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="text-yellow-500/70 font-semibold">Local dev?</span>{' '}
              Check the Django server console — the verification link is printed there since the email backend is set to <span className="font-mono text-slate-500">console</span>.
            </p>
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <Link
            to="/login"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 hover:border-emerald-400 transition-all duration-200"
          >
            I've verified — Log In
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/register"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-500 hover:text-slate-200 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Re-register
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default VerificationPending;
