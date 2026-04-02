import React, { useState } from 'react';
import { FileUp, CheckCircle2, Circle, FileText, Loader2, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { VaultSection as VaultSectionType } from '../types';

interface VaultSectionProps {
  section: VaultSectionType;
  onUpload: (id: string, file: File) => Promise<void>;
  aiStatus: { status: 'pending' | 'verified' | 'failed'; message?: string } | null;
}

export const VaultSection: React.FC<VaultSectionProps> = ({ section, onUpload, aiStatus }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCompleted = section.status === 'completed';
  const isVerified = aiStatus?.status === 'verified';
  const isVerifying = aiStatus?.status === 'pending';
  const isFailed = aiStatus?.status === 'failed';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await onUpload(section.id, file);
    } catch (err: any) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden",
        isVerified ? "border-green-200 bg-green-50/10" : "border-slate-200",
        isFailed && "border-red-200 bg-red-50/10"
      )}
    >
      {isVerified && (
        <div className="absolute top-0 right-0 p-2">
          <div className="bg-green-600 text-white p-1 rounded-bl-lg shadow-lg flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={12} />
            AI Verified
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isCompleted ? "bg-green-50 text-green-600" : "bg-navy/5 text-navy"
          )}>
            {isCompleted ? <CheckCircle2 size={24} /> : (uploading ? <Loader2 className="animate-spin" size={24} /> : <Circle size={24} />)}
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold text-navy tracking-tight">
              {section.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {section.description}
            </p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
          isCompleted ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
        )}>
          {uploading ? 'Uploading...' : section.status}
        </div>
      </div>

      {isVerifying && (
        <div className="mb-4 p-3 bg-navy/5 border border-navy/10 text-navy text-xs rounded-lg flex items-center gap-2 animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          Verifying with AI...
        </div>
      )}

      {isFailed && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={14} />
          {aiStatus?.message || 'Our system didn\'t recognize this as the correct document. Please check and re-upload.'}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {section.fileName ? (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-md border transition-all",
            isVerified ? "bg-white border-green-200" : "bg-slate-50 border-slate-200"
          )}>
            <FileText className={cn(isVerified ? "text-green-600" : "text-navy")} size={20} />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate">
                {section.fileName}
              </span>
              {isVerified && <span className="text-[10px] text-green-600 font-bold uppercase">Material Info Verified</span>}
            </div>
            <button className="ml-auto text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <label className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-navy transition-all group",
            (uploading || isVerifying) && "opacity-50 cursor-not-allowed pointer-events-none"
          )}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading || isVerifying ? (
                <Loader2 className="w-8 h-8 mb-3 text-navy animate-spin" />
              ) : (
                <FileUp className="w-8 h-8 mb-3 text-slate-400 group-hover:text-navy transition-colors" />
              )}
              <p className="mb-2 text-sm text-slate-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">PDF (MAX. 15MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading || isVerifying}
            />
          </label>
        )}
      </div>
    </motion.div>
  );
}
