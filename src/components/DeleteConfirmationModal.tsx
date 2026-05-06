import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText: string;
  requireDoubleConfirm?: boolean;
  doubleConfirmPhrase?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  requireDoubleConfirm = false,
  doubleConfirmPhrase = 'DELETE'
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);
  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirm = async () => {
    if (requireDoubleConfirm && step === 1) {
      setStep(2);
      return;
    }

    if (requireDoubleConfirm && step === 2 && confirmInput !== doubleConfirmPhrase) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Deletion failed:', error);
      alert('Deletion failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset state when opening/closing
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setConfirmInput('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-navy hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-navy">{title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>

              {requireDoubleConfirm && step === 2 && (
                <div className="space-y-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <label className="text-xs font-bold text-red-700 uppercase tracking-widest ml-1">
                    Type "{doubleConfirmPhrase}" to confirm
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder={doubleConfirmPhrase}
                    className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting || (requireDoubleConfirm && step === 2 && confirmInput !== doubleConfirmPhrase)}
                  className={cn(
                    "flex-[2] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50",
                    "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-200"
                  )}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Trash2 size={20} />
                      {step === 1 ? 'Next' : confirmText}
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="h-2 bg-red-600" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
