import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  BadgePoundSterling, 
  ShieldAlert, 
  Download, 
  FileUp, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { PropertyProfile, VaultSectionId } from '../types';

interface StepContentProps {
  id: VaultSectionId;
  profile: PropertyProfile;
  onUpload: (id: string, files: File | FileList | File[]) => Promise<void>;
  onDeleteFile: (id: string, fileName: string) => Promise<void>;
  onTeamUpdate: (data: any) => Promise<void>;
  onFinancialUpdate: (data: any) => Promise<void>;
}

export const StepContent: React.FC<StepContentProps> = ({ id, profile, onUpload, onDeleteFile, onTeamUpdate, onFinancialUpdate }) => {
  const [teamData, setTeamData] = useState(profile.teamInfo || {
    groundLeaseHolder: '',
    managementCompany: '',
    managingAgent: ''
  });
  const [financialData, setFinancialData] = useState(profile.financialInfo || {
    reserveFundAmount: ''
  });
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [updatingFinancial, setUpdatingFinancial] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTeam(true);
    await onTeamUpdate(teamData);
    setUpdatingTeam(false);
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFinancial(true);
    await onFinancialUpdate(financialData);
    setUpdatingFinancial(false);
  };

  const renderUploadSlot = (slotId: string, label: string, description: string, tooltip?: string) => {
    const fileData = profile.vaultFiles[slotId];
    const aiStatus = profile.aiVerification[slotId];
    const isVerifying = aiStatus?.status === 'pending';
    const isVerified = aiStatus?.status === 'verified';
    const isFailed = aiStatus?.status === 'failed';

    const files = Array.isArray(fileData) ? fileData : (fileData ? [fileData] : []);

    return (
      <div key={slotId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-navy">{label}</h4>
              {tooltip && (
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === slotId ? null : slotId)}
                    className="text-gold hover:text-navy transition-colors"
                  >
                    <HelpCircle size={16} />
                  </button>
                  <AnimatePresence>
                    {activeTooltip === slotId && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                      >
                        <p className="leading-relaxed">{tooltip}</p>
                        <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          {isVerified && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
        </div>

        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all group/file",
              isVerified ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
            )}>
              <FileText className={cn(isVerified ? "text-green-600" : "text-navy")} size={20} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-slate-700 truncate">{file.fileName}</span>
                {index === 0 && (
                  <>
                    {isVerifying && (
                      <span className="text-[10px] text-navy flex items-center gap-1 animate-pulse">
                        <Loader2 size={10} className="animate-spin" /> Checking documents...
                      </span>
                    )}
                    {isVerified && (
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <ShieldCheck size={10} /> {aiStatus.message || 'Verified'}
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> {aiStatus.message || 'Verification failed'}
                      </span>
                    )}
                  </>
                )}
              </div>
              <button 
                onClick={() => onDeleteFile(slotId, file.fileName)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/file:opacity-100"
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <label className={cn(
          "flex items-center justify-center w-full cursor-pointer transition-all group",
          files.length > 0 
            ? "py-3 border border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-navy" 
            : "py-8 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-navy"
        )}>
          <div className="flex items-center gap-2">
            {files.length > 0 ? (
              <>
                <Plus size={16} className="text-slate-400 group-hover:text-navy" />
                <span className="text-xs text-slate-500 font-medium group-hover:text-navy">Add another PDF</span>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <FileUp className="w-8 h-8 mb-2 text-slate-400 group-hover:text-navy transition-colors" />
                <p className="text-xs text-slate-500 font-medium">Upload PDF</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf"
            multiple={slotId === 'sc_accounts'}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) onUpload(slotId, files);
            }}
          />
        </label>
      </div>
    );
  };

  switch (id) {
    case 'team':
      return (
        <div className="max-w-2xl space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-navy">Stakeholders</h3>
                <p className="text-slate-500 text-sm">Ground Lease Holder, Management Company, and Managing Agent details.</p>
              </div>
            </div>
            
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Ground Lease Holder</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'groundLeaseHolder' ? null : 'groundLeaseHolder')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'groundLeaseHolder' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed">The person or company that owns the land. They are usually paid ground rent.</p>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.groundLeaseHolder}
                  onChange={(e) => setTeamData({...teamData, groundLeaseHolder: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Freehold Properties Ltd"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Management Company</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'managementCompany' ? null : 'managementCompany')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'managementCompany' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed">The company responsible for the block's upkeep. Often made up of the residents.</p>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.managementCompany}
                  onChange={(e) => setTeamData({...teamData, managementCompany: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Jenner Walk Management"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Managing Agent</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'managingAgent' ? null : 'managingAgent')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'managingAgent' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed">The firm hired to handle the day-to-day running of the building and collect service charges.</p>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.managingAgent}
                  onChange={(e) => setTeamData({...teamData, managingAgent: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. City Block Management"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={updatingTeam}
                className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2"
              >
                {updatingTeam ? <Loader2 className="animate-spin" size={20} /> : 'Save Details'}
              </button>
            </form>
          </div>
          {profile.vaultProgress.team && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 1 complete. You’ve identified the key players. Peace of mind achieved.</p>
            </div>
          )}
        </div>
      );

    case 'forms':
      return (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-navy">The Forms</h3>
                <p className="text-slate-500 text-sm max-w-xl">
                  Your solicitor will send you the official TA6, TA7, and TA10 forms. Use the lists below to get your information together now. Once you have filled in your solicitor’s copies, upload them here for a final AI check.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 'ta6-prep',
                  title: 'TA6: Property Information',
                  items: [
                    'Note your boundary responsibilities and any moved fences.',
                    'List any past disputes or noise complaints with neighbours.',
                    'Gather planning permissions for extensions or loft work.',
                    'Find warranties for damp-proofing or windows (FENSA).',
                    'Check your utility meter locations and provider names.'
                  ]
                },
                {
                  id: 'ta7-prep',
                  title: 'TA7: Leasehold Information',
                  items: [
                    'Confirm your current service charge and ground rent costs.',
                    'Check if you have your Share Certificate for the management company.',
                    'Note any written consent you received for flooring or structural changes.',
                    'Check if a Leaseholder Deed of Certificate (BSA 2022) is finished.'
                  ]
                },
                {
                  id: 'ta10-prep',
                  title: 'TA10: Fittings and Contents',
                  items: [
                    'Decide if appliances like the oven and fridge stay or go.',
                    'List which curtains, blinds, and carpets are included.',
                    'Note if you are taking any light fittings or smart home tech.',
                    'Check if garden sheds or specific plants are staying.'
                  ]
                }
              ].map((prep) => (
                <details key={prep.id} className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                    <span className="font-bold text-navy">{prep.title}</span>
                    <ArrowRight className="text-navy transition-transform group-open:rotate-90" size={18} />
                  </summary>
                  <div className="p-5 pt-0 space-y-3 border-t border-slate-200/50 mt-1">
                    {prep.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-navy/20 mt-1.5 shrink-0" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderUploadSlot(
              'ta6', 
              'Upload Finished TA6', 
              'Property Information Form',
              'These are standard Law Society forms. Your solicitor will send you the official versions. Get your answers ready now.'
            )}
            {renderUploadSlot(
              'ta7', 
              'Upload Finished TA7', 
              'Leasehold Information Form',
              'These are standard Law Society forms. Your solicitor will send you the official versions. Get your answers ready now.'
            )}
            {renderUploadSlot(
              'ta10', 
              'Upload Finished TA10', 
              'Fittings and Contents Form',
              'These are standard Law Society forms. Your solicitor will send you the official versions. Get your answers ready now.'
            )}
            {renderUploadSlot(
              'solicitor_forms', 
              'Upload Other Solicitor Forms', 
              'Any other forms from your solicitor',
              'Any extra forms provided by your legal team for your specific sale.'
            )}
          </div>

          {profile.vaultProgress.forms && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 2 complete. The big forms are done. You're making great progress!</p>
            </div>
          )}
        </div>
      );

    case 'money':
      const currentYear = new Date().getFullYear();
      return (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Financial Enclosures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderUploadSlot(
                'sc_accounts', 
                'Service Charge Accounts', 
                `Last 3 years of audited accounts (${currentYear-3}-${currentYear-1})`,
                'Summaries of how the building’s money was spent. Find these on your resident portal or ask your Managing Agent.'
              )}
              {renderUploadSlot(
                'sc_budget', 
                `${currentYear} Service Charge Budget`, 
                'The upcoming year\'s financial plan',
                'This is the breakdown of what the agent expects to spend this year. Ask your Managing Agent for the latest budget letter.'
              )}
              {renderUploadSlot(
                'ground_rent_receipt', 
                'Ground Rent Receipt', 
                'Proof of payment for the current period',
                'Proof you have paid the Freeholder. Look for an account statement or a receipt from the last 12 months.'
              )}
              <div className="space-y-4">
                {renderUploadSlot(
                  'reserve_fund_confirmation', 
                  'Reserve Fund', 
                  'Statement showing amount held for major works',
                  'The \'sinking fund\' held for big future repairs. The total is usually listed in your most recent accounts.'
                )}
                <form onSubmit={handleFinancialSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Reserve Fund Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                      <input 
                        type="text"
                        value={financialData.reserveFundAmount}
                        onChange={(e) => setFinancialData({...financialData, reserveFundAmount: e.target.value})}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                        placeholder="e.g. 15,000"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={updatingFinancial}
                    className="w-full py-3 bg-navy text-white rounded-xl font-bold text-sm hover:bg-navy-light transition-all flex items-center justify-center gap-2"
                  >
                    {updatingFinancial ? <Loader2 className="animate-spin" size={16} /> : 'Update Amount'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          {profile.vaultProgress.money && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 3 complete. You’ve done your bit for the financials. Peace of mind achieved.</p>
            </div>
          )}
        </div>
      );

    case 'safety':
      return (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Safety Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadSlot(
                'fra', 
                'Fire Risk Assessment (FRA)', 
                'Current building fire safety report',
                'A safety report for the shared areas. Your Managing Agent must have a copy of the most recent check.'
              )}
              {renderUploadSlot(
                'asbestos_survey', 
                'Communal Asbestos Survey', 
                'Report on communal area asbestos management',
                'A report confirming the building is safe. Most blocks built before 2000 are required to have one on file.'
              )}
              {renderUploadSlot(
                'eicr', 
                'Communal Electrical (EICR)', 
                'Electrical safety certificate for common parts',
                'An electrical safety certificate for the hallways and shared systems, not just your flat.'
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Legal Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadSlot(
                'insurance', 
                'Building Insurance Policy', 
                'Current schedule and summary',
                'The current building insurance schedule. Ask your Managing Agent for the latest summary of cover.'
              )}
              {renderUploadSlot(
                'bsa', 
                'Leaseholder Deed (BSA 2022)', 
                'Building Safety Act certificate',
                'A certificate required under the Building Safety Act 2022 for buildings over 11 metres or 5 storeys.'
              )}
              {renderUploadSlot(
                'headlease', 
                'The Headlease', 
                'The overarching building contract',
                'The main contract between the Freeholder and the Management Company. You can get a copy from the Land Registry if you don\'t have one.'
              )}
              {renderUploadSlot(
                'management_articles', 
                'Articles & Share Cert', 
                'Management Company Articles of Association',
                'The rules for how your Management Company is run. These are often sent when you first bought the flat.'
              )}
              {renderUploadSlot(
                'transfer_fees', 
                'Notice of Transfer Fees', 
                'Managing Agent list of fees',
                'The list of fees charged by the Managing Agent for processing the sale and updating records.'
              )}
            </div>
          </div>

          {profile.vaultProgress.safety && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 4 complete. Safety first! Your pack is almost ready for the solicitor.</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};
