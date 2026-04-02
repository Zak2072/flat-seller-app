import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Send, 
  CheckCircle2, 
  Mail, 
  User, 
  Loader2, 
  FileCheck,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { UserProfile } from '../types';

interface SolicitorHandoffProps {
  profile: UserProfile;
  onSend: (name: string, email: string) => Promise<void>;
}

export const SolicitorHandoff: React.FC<SolicitorHandoffProps> = ({ profile, onSend }) => {
  const [name, setName] = useState(profile.solicitorInfo?.name || '');
  const [email, setEmail] = useState(profile.solicitorInfo?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const completedCount = Object.values(profile.vaultProgress).filter(Boolean).length;
  const isVaultComplete = completedCount === 5;
  const isPaid = profile.hasPaid;
  const isUnlocked = isVaultComplete && isPaid;
  const alreadySent = !!profile.solicitorInfo?.sentAt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || isSending) return;

    setIsSending(true);
    try {
      await onSend(name, email);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Handoff failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy tracking-tight">Solicitor Handoff</h2>
          <p className="text-slate-500 mt-2">Securely transfer your verified Material Information pack to your legal team.</p>
        </div>
        <div className="flex gap-2">
          {!isVaultComplete && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-sm font-medium">
              <Lock size={16} />
              Vault: {completedCount}/5
            </div>
          )}
          {!isPaid && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full border border-red-100 text-sm font-medium">
              <CreditCard size={16} />
              Payment Required
            </div>
          )}
          {isUnlocked && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-medium">
              <ShieldCheck size={16} />
              Ready for Handoff
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Status & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-serif font-semibold text-navy mb-4 flex items-center gap-2">
              <FileCheck size={20} className="text-navy" />
              Pack Contents
            </h3>
            <ul className="space-y-3">
              {Object.entries(profile.vaultProgress).map(([id, completed]) => (
                <li key={id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 capitalize">{id.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {completed ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">Vault Progress</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded uppercase",
                  isVaultComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                )}>
                  {isVaultComplete ? 'Complete' : `${completedCount}/5`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">Payment Status</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded uppercase",
                  isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-navy text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
            <h3 className="text-lg font-serif font-semibold mb-2 relative z-10">Secure Transfer</h3>
            <p className="text-navy-light text-sm relative z-10">
              All documents are encrypted and transferred via our secure legal gateway. Your solicitor will receive a time-limited access link.
            </p>
          </div>
        </div>

        {/* Right: Handoff Form */}
        <div className="lg:col-span-2">
          <div className={cn(
            "bg-white border border-slate-200 rounded-2xl p-8 shadow-sm transition-all relative overflow-hidden",
            !isUnlocked && "opacity-75 grayscale pointer-events-none"
          )}>
            {!isUnlocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 text-center max-w-xs space-y-4">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-navy">Section Locked</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {!isVaultComplete && "• Complete all 5 vault sections\n"}
                      {!isPaid && "• Pay the verification fee"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-navy flex items-center gap-2">
                    <User size={14} /> Solicitor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-navy flex items-center gap-2">
                    <Mail size={14} /> Solicitor Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@lawfirm.co.uk"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documents to be sent</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(profile.vaultFiles).map(([id, file]) => (
                    file && (
                      <div key={id} className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                        <FileCheck size={12} className="text-green-500" />
                        <span className="truncate">{file.fileName}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isUnlocked || isSending || alreadySent}
                className={cn(
                  "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg",
                  alreadySent 
                    ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                    : "bg-navy text-white hover:bg-navy-light active:scale-[0.98] disabled:opacity-50"
                )}
              >
                {isSending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Preparing Secure Pack...
                  </>
                ) : alreadySent ? (
                  <>
                    <CheckCircle2 size={20} />
                    Pack Sent to Solicitor
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Generate & Send Solicitor Pack
                  </>
                )}
              </button>

              {alreadySent && (
                <p className="text-center text-xs text-slate-400">
                  Sent on {new Date(profile.solicitorInfo?.sentAt || '').toLocaleDateString()} at {new Date(profile.solicitorInfo?.sentAt || '').toLocaleTimeString()}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Success Toast Simulation */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-green-500"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold">Pack Sent Successfully</p>
              <p className="text-sm text-green-100">Your solicitor has been notified via secure link.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
