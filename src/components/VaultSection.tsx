import React from 'react';
import { FileUp, CheckCircle2, Circle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { VaultSection as VaultSectionType } from '../types';

interface VaultSectionProps {
  section: VaultSectionType;
  onUpload: (id: string, file: File) => void;
}

export const VaultSection: React.FC<VaultSectionProps> = ({ section, onUpload }) => {
  const isCompleted = section.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isCompleted ? "bg-green-50 text-green-600" : "bg-navy/5 text-navy"
          )}>
            {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
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
          {section.status}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {section.fileName ? (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
            <FileText className="text-navy" size={20} />
            <span className="text-sm font-medium text-slate-700 truncate">
              {section.fileName}
            </span>
            <button className="ml-auto text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-navy transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUp className="w-8 h-8 mb-3 text-slate-400 group-hover:text-navy transition-colors" />
              <p className="mb-2 text-sm text-slate-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">PDF (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(section.id, file);
              }}
            />
          </label>
        )}
      </div>
    </motion.div>
  );
}
